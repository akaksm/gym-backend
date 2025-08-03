import { Payment } from "../models/payment.js"
import { User } from "../models/user.js"
import { Membership } from "../models/membership.js"
import { MembershipType } from "../models/membershipType.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {
    initiateKhaltiPayment,
    verifyKhaltiPayment,
    refundKhaltiPayment,
} from "../utils/khaltiService.js"

// Initiate Khalti payment
export const initiatePayment = asyncHandler(async (req, res) => {
    const { membershipTypeId, userId } = req.body

    // Validation
    if (!membershipTypeId || !userId) {
        throw new ApiError("Membership type ID and user ID are required", 400)
    }

    const [user, membershipType] = await Promise.all([
        User.findById(userId),
        MembershipType.findById(membershipTypeId),
    ])

    if (!user) throw new ApiError("User not found", 404)
    if (!membershipType) throw new ApiError("Membership type not found", 404)

    // Check for existing active membership
    const existingMembership = await Membership.findOne({
        user: userId,
        isActive: true,
        endDate: { $gte: new Date() },
    })

    if (existingMembership) {
        throw new ApiError("User already has an active membership", 400)
    }

    // Create membership (initially inactive)
    const membership = await Membership.create({
        user: userId,
        membershipType: membershipTypeId,
        startDate: new Date(),
        endDate: new Date(Date.now() + membershipType.durationInDays * 86400000),
        paymentStatus: "Pending",
        isActive: false,
    })

    // Create payment record
    const payment = await Payment.create({
        user: userId,
        membership: membership._id,
        amount: membershipType.priceNRS,
        currency: "NPR",
        paymentMethod: "khalti",
        description: `${membershipType.title} Membership Payment`,
    })

    // Prepare Khalti payload
    const khaltiPayload = {
        amount: membershipType.priceNRS,
        transactionId: payment.transactionId,
        description: `${membershipType.title} Membership`,
        userEmail: user.email,
        userPhone: user.phone,
    }

    // Initiate Khalti payment
    const khaltiResponse = await initiateKhaltiPayment(khaltiPayload)

    // Update payment with Khalti details
    payment.khaltiPaymentUrl = khaltiResponse.payment_url
    payment.khaltiPaymentToken = khaltiResponse.token
    payment.khaltiTransactionId = khaltiResponse.transaction_id
    await payment.save()

    return res.status(200).json(
        new ApiResponse(
            "Payment initiated successfully",
            {
                paymentId: payment._id,
                paymentUrl: khaltiResponse.payment_url,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
            }
        )
    )
})

// Verify payment (for frontend callback)
export const verifyPayment = asyncHandler(async (req, res) => {
    const { token } = req.query // From Khalti redirect URL

    if (!token) {
        throw new ApiError("Payment token is required", 400)
    }

    // Verify with Khalti
    const verification = await verifyKhaltiPayment(token)
    if (verification.status !== "Completed") {
        throw new ApiError("Payment verification failed", 400)
    }

    // Find and update payment
    const payment = await Payment.findOneAndUpdate(
        { khaltiPaymentToken: token },
        {
            status: "completed",
            completedDate: new Date(),
            khaltiTransactionId: verification.transaction_id,
        },
        { new: true }
    )

    if (!payment) {
        throw new ApiError("Payment record not found", 404)
    }

    // Activate membership
    await Membership.findOneAndUpdate(
        { _id: payment.membership },
        { isActive: true, paymentStatus: "Completed" }
    )

    return res.redirect(
        `${process.env.FRONTEND_URL}/payment-success?paymentId=${payment._id}`
    )
})

// Khalti webhook handler (for instant notifications)
export const khaltiWebhook = asyncHandler(async (req, res) => {
    const { token, transaction_id, status } = req.body

    if (!token || !transaction_id) {
        throw new ApiError("Invalid webhook payload", 400)
    }

    // Find payment
    const payment = await Payment.findOne({ khaltiPaymentToken: token })
    if (!payment) {
        throw new ApiError("Payment not found", 404)
    }

    // Skip if already processed
    if (payment.status === "completed") {
        return res.status(200).json(new ApiResponse(`Payment success`, { success: true }))
    }

    if (status === "Completed") {
        // Verify payment (double-check)
        const verification = await verifyKhaltiPayment(token)
        if (verification.status !== "Completed") {
            throw new ApiError("Webhook verification failed", 400)
        }

        // Update payment
        payment.status = "completed"
        payment.completedDate = new Date()
        payment.khaltiTransactionId = transaction_id
        await payment.save()

        // Activate membership
        await Membership.findOneAndUpdate(
            { _id: payment.membership },
            { isActive: true, paymentStatus: "Completed" }
        )
    } else {
        payment.status = "failed"
        payment.errorMessage = status
        await payment.save()
    }

    return res.status(200).json(new ApiResponse(`Payment`, { success: true }))
})

// Process refund
export const processRefund = asyncHandler(async (req, res) => {
    const { paymentId } = req.params
    const { refundAmount, reason } = req.body

    const payment = await Payment.findById(paymentId)
    if (!payment) throw new ApiError("Payment not found", 404)

    // Validation
    if (payment.status !== "completed") {
        throw new ApiError("Only completed payments can be refunded", 400)
    }
    if (payment.paymentMethod !== "khalti") {
        throw new ApiError("Only Khalti payments can be refunded", 400)
    }

    const amountToRefund = refundAmount || payment.amount

    // Process refund via Khalti
    if (payment.khaltiTransactionId) {
        await refundKhaltiPayment(payment.khaltiTransactionId, amountToRefund)
    }

    // Update payment
    payment.status = "refunded"
    payment.refundAmount = amountToRefund
    payment.refundDate = new Date()
    payment.errorMessage = reason || "Refund processed"
    await payment.save()

    // Deactivate membership
    await Membership.findOneAndUpdate(
        { _id: payment.membership },
        { isActive: false, paymentStatus: "Refunded" }
    )

    return res.status(200).json(
        new ApiResponse("Refund processed successfully", payment)
    )
})

// Get payment by ID
export const getPaymentById = asyncHandler(async (req, res) => {
    const { id } = req.params

    const payment = await Payment.findById(id)
        .populate("user", "name email")
        .populate("membership")

    if (!payment) {
        throw new ApiError("Payment not found", 404)
    }

    return res.status(200).json(
        new ApiResponse("Payment retrieved successfully", payment)
    )
})

// Get user payments
export const getUserPayments = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const payments = await Payment.find({ user: userId })
        .populate("membership")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    const total = await Payment.countDocuments({ user: userId })

    return res.status(200).json(
        new ApiResponse(
            "User payments retrieved successfully",
            {
                payments,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }

        )
    )
})

// Get all payments (admin)
export const getAllPayments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit

    const payments = await Payment.find()
        .populate("user", "name email")
        .populate("membership")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    const total = await Payment.countDocuments()

    return res.status(200).json(
        new ApiResponse(
            "Payments retrieved successfully",
            {
                payments,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / limit),
                }
            }

        )
    )
})
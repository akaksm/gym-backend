import { Membership } from "../models/membership.js"
import { User } from "../models/user.js"
import { MembershipType } from "../models/membershipType.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Payment } from "../models/payment.js"

// Create a new membership
const createMembership = asyncHandler(async (req, res) => {
    const { user, membershipType, paymentStatus } = req.body

    if (!user || !membershipType) {
        throw new ApiError("User and membership type are required", 400)
    }

    const userExists = await User.findById(user)
    if (!userExists) {
        throw new ApiError("User not found", 404)
    }

    const membershipTypeData = await MembershipType.findById(membershipType)
    if (!membershipTypeData) {
        throw new ApiError("Membership type not found", 404)
    }

    const existingActiveMembership = await Membership.findOne({
        user: user,
        isActive: true,
        endDate: { $gte: new Date() }
    })
    if (existingActiveMembership) {
        throw new ApiError("User already has an active membership", 400)
    }

    const startDate = new Date()
    let endDate = new Date()

    if (membershipTypeData.durationInDays) {
        endDate.setDate(startDate.getDate() + membershipTypeData.durationInDays)
    } else if (membershipTypeData.durationInMonths) {
        endDate.setMonth(startDate.getMonth() + membershipTypeData.durationInMonths)
    } else {
        endDate = new Date('2100-12-31')
    }

    const membership = await Membership.create({
        user,
        membershipType,
        startDate,
        endDate,
        paymentStatus: paymentStatus || "Pending",
        isActive: false
    })

    return res
        .status(201)
        .json(new ApiResponse("Membership created successfully (pending payment)", membership))
})

// NEW: Activate membership after successful payment (for webhook/callback)
const activateMembership = asyncHandler(async (req, res) => {
    const { paymentId } = req.body

    if (!paymentId) {
        throw new ApiError("Payment ID is required", 400)
    }

    // Find the payment
    const payment = await Payment.findById(paymentId)
    if (!payment) {
        throw new ApiError("Payment not found", 404)
    }

    // Verify payment is completed
    if (payment.status !== "completed") {
        throw new ApiError("Payment is not completed", 400)
    }

    const membership = await Membership.findById(payment.membership)
        .populate('membershipType')

    if (!membership) {
        throw new ApiError("Membership not found", 404)
    }

    if (!membership.membershipType) {
        throw new ApiError("Membership type not found", 404)
    }

    // 4. Calculate end date
    const startDate = new Date()
    let endDate = new Date(startDate)

    if (membership.membershipType.durationInDays) {
        endDate.setDate(startDate.getDate() + membership.membershipType.durationInDays)
    } else if (membership.membershipType.durationInMonths) {
        endDate.setMonth(startDate.getMonth() + membership.membershipType.durationInMonths)
    }

    // Find and update membership
    const updateMembership = await Membership.findOneAndUpdate(
        { user: payment.user, payment: paymentId },
        {
            isActive: true,
            paymentStatus: "Completed",
            startDate, // Reset start date to now
            endDate
        },
        { new: true }
    ).populate("membershipType")

    await updateMembership.save()

    return res.status(200).json(
        new ApiResponse("Membership activated successfully", updateMembership)
    )
})


// Get all memberships
const getAllMemberships = asyncHandler(async (req, res) => {
    const memberships = await Membership.find()
        .populate("user", "name email")
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    return res
        .status(200)
        .json(new ApiResponse("Memberships retrieved successfully", memberships))
})

// Get membership by ID
const getMembershipById = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membership = await Membership.findById(id)
        .populate("user", "name email")
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    if (!membership) {
        throw new ApiError("Membership not found", 404)
    }

    return res
        .status(200)
        .json(new ApiResponse("Membership retrieved successfully", membership))
})

// Get memberships by user ID
const getMembershipsByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params

    const memberships = await Membership.find({ user: userId })
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    return res
        .status(200)
        .json(new ApiResponse("User memberships retrieved successfully", memberships))
})

// Update membership
const updateMembership = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { membershipType, paymentStatus, isActive, payment } = req.body

    const membership = await Membership.findById(id)
    if (!membership) {
        throw new ApiError("Membership not found", 404)
    }

    if (membershipType) {
        const membershipTypeData = await MembershipType.findById(membershipType)
        if (!membershipTypeData) {
            throw new ApiError("Membership type not found", 404)
        }

        const startDate = membership.startDate
        let newEndDate = new Date(startDate)

        if (membershipTypeData.durationInDays) {
            newEndDate.setDate(startDate.getDate() + membershipTypeData.durationInDays)
        } else if (membershipTypeData.durationInMonths) {
            newEndDate.setMonth(startDate.getMonth() + membershipTypeData.durationInMonths)
        } else {
            newEndDate = new Date('2100-12-31')
        }

        membership.membershipType = membershipType
        membership.endDate = newEndDate
    }

    if (paymentStatus) {
        membership.paymentStatus = paymentStatus
        if (paymentStatus === "Completed") {
            membership.isActive = true
        } else if (paymentStatus === "Refunded") {
            membership.isActive = false
        }
    }

    if (isActive !== undefined) membership.isActive = isActive
    if (payment) membership.payment = payment

    if (membership.endDate < new Date()) {
        membership.isActive = false
    }

    await membership.save()

    return res
        .status(200)
        .json(new ApiResponse("Membership updated successfully", membership))
})

// Delete membership
const deleteMembership = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membership = await Membership.findById(id)

    if (!membership) {
        throw new ApiError("Membership not found", 404)
    }

    if (membership.payment) {
        throw new ApiError("Cannot delete membership with associated payment", 400)
    }

    await membership.deleteOne()

    return res
        .status(200)
        .json(new ApiResponse("Membership deleted successfully", null))
})

// Get active memberships
const getActiveMemberships = asyncHandler(async (req, res) => {
    const activeMemberships = await Membership.find({ isActive: true })
        .populate("user", "name email")
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    return res
        .status(200)
        .json(new ApiResponse(activeMemberships, "Active memberships retrieved successfully", activeMemberships))
})

// Check if user has active membership (updated for stricter checks)
const checkUserActiveMembership = asyncHandler(async (req, res) => {
    const { userId } = req.params

    const currentDate = new Date()
    const activeMembership = await Membership.findOne({
        user: userId,
        isActive: true,
        endDate: { $gte: currentDate },
        paymentStatus: "Completed"
    })
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    const hasActiveMembership = !!activeMembership

    return res.status(200).json(
        new ApiResponse("Membership status checked successfully", {
            hasActiveMembership,
            membership: activeMembership,
            daysRemaining: hasActiveMembership
                ? Math.ceil((activeMembership.endDate - currentDate) / (1000 * 60 * 60 * 24))
                : 0
        })
    )
})

export {
    createMembership,
    activateMembership,
    getAllMemberships,
    getMembershipById,
    getMembershipsByUserId,
    updateMembership,
    deleteMembership,
    getActiveMemberships,
    checkUserActiveMembership
}
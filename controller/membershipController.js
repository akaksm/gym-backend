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
        throw new ApiError(400, "User and membership type are required")
    }

    const userExists = await User.findById(user)
    if (!userExists) {
        throw new ApiError(404, "User not found")
    }

    const membershipTypeData = await MembershipType.findById(membershipType)
    if (!membershipTypeData) {
        throw new ApiError(404, "Membership type not found")
    }

    const existingActiveMembership = await Membership.findOne({
        user: user,
        isActive: true,
        endDate: { $gte: new Date() }
    })
    if (existingActiveMembership) {
        throw new ApiError(400, "User already has an active membership")
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
        .json(new ApiResponse(201, membership, "Membership created successfully (pending payment)"))
})

// NEW: Activate membership after successful payment (for webhook/callback)
const activateMembership = asyncHandler(async (req, res) => {
    const { paymentId } = req.body;

    if (!paymentId) {
        throw new ApiError(400, "Payment ID is required");
    }

    // Find the payment
    const payment = await Payment.findById(paymentId)
    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    // Verify payment is completed
    if (payment.status !== "completed") {
        throw new ApiError(400, "Payment is not completed");
    }

    const membership = await Membership.findById(payment.membership)
        .populate('membershipType');

    if (!membership) {
        throw new ApiError(404, "Membership not found");
    }

    if (!membership.membershipType) {
        throw new ApiError(404, "Membership type not found");
    }

    // 4. Calculate end date
    const startDate = new Date();
    let endDate = new Date(startDate);

    if (membership.membershipType.durationInDays) {
        endDate.setDate(startDate.getDate() + membership.membershipType.durationInDays);
    } else if (membership.membershipType.durationInMonths) {
        endDate.setMonth(startDate.getMonth() + membership.membershipType.durationInMonths);
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
    ).populate("membershipType");

    await updateMembership.save()

    return res.status(200).json(
        new ApiResponse(200, updateMembership, "Membership activated successfully")
    );
});


// Get all memberships
const getAllMemberships = asyncHandler(async (req, res) => {
    const memberships = await Membership.find()
        .populate("user", "name email")
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    return res
        .status(200)
        .json(new ApiResponse(200, memberships, "Memberships retrieved successfully"))
})

// Get membership by ID
const getMembershipById = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membership = await Membership.findById(id)
        .populate("user", "name email")
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    if (!membership) {
        throw new ApiError(404, "Membership not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, membership, "Membership retrieved successfully"))
})

// Get memberships by user ID
const getMembershipsByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params

    const memberships = await Membership.find({ user: userId })
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    return res
        .status(200)
        .json(new ApiResponse(200, memberships, "User memberships retrieved successfully"))
})

// Update membership
const updateMembership = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { membershipType, paymentStatus, isActive, payment } = req.body

    const membership = await Membership.findById(id)
    if (!membership) {
        throw new ApiError(404, "Membership not found")
    }

    if (membershipType) {
        const membershipTypeData = await MembershipType.findById(membershipType)
        if (!membershipTypeData) {
            throw new ApiError(404, "Membership type not found")
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
        membership.paymentStatus = paymentStatus;
        if (paymentStatus === "Completed") {
            membership.isActive = true;
        } else if (paymentStatus === "Refunded") {
            membership.isActive = false;
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
        .json(new ApiResponse(200, membership, "Membership updated successfully"))
})

// Delete membership
const deleteMembership = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membership = await Membership.findById(id)

    if (!membership) {
        throw new ApiError(404, "Membership not found")
    }

    if (membership.payment) {
        throw new ApiError(400, "Cannot delete membership with associated payment");
    }

    await membership.deleteOne()

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Membership deleted successfully"))
})

// Get active memberships
const getActiveMemberships = asyncHandler(async (req, res) => {
    const activeMemberships = await Membership.find({ isActive: true })
        .populate("user", "name email")
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status")

    return res
        .status(200)
        .json(new ApiResponse(200, activeMemberships, "Active memberships retrieved successfully"))
})

// Check if user has active membership (updated for stricter checks)
const checkUserActiveMembership = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const currentDate = new Date();
    const activeMembership = await Membership.findOne({
        user: userId,
        isActive: true,
        endDate: { $gte: currentDate },
        paymentStatus: "Completed"
    })
        .populate("membershipType", "title priceNRS durationInDays durationInMonths")
        .populate("payment", "amount paymentMethod status");

    const hasActiveMembership = !!activeMembership;

    return res.status(200).json(
        new ApiResponse(200, {
            hasActiveMembership,
            membership: activeMembership,
            daysRemaining: hasActiveMembership
                ? Math.ceil((activeMembership.endDate - currentDate) / (1000 * 60 * 60 * 24))
                : 0
        }, "Membership status checked successfully")
    );
});

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
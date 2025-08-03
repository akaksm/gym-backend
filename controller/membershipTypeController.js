import { MembershipType } from "../models/membershipType.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Create a new membership type
const createMembershipType = asyncHandler(async (req, res) => {
    const {
        title,
        priceNRS,
        durationInDays,
        durationInMonths,
        isCalendarBased,
        excludeSaturdays,
        accessStartTime,
        accessEndTime,
        isActive,
        description
    } = req.body

    if (!title || !priceNRS) {
        throw new ApiError("Title and price are required", 400)
    }

    // Check if title is valid enum value
    const validTitles = [
        'Daily', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly',
        'Three-Year', 'Five-Year', 'Ten-Year', 'Lifetime'
    ]
    if (!validTitles.includes(title)) {
        throw new ApiError("Invalid membership type title", 400)
    }

    // Check if title already exists
    const existingType = await MembershipType.findOne({ title })
    if (existingType) {
        throw new ApiError("Membership type with this title already exists", 400)
    }

    const membershipType = await MembershipType.create({
        title,
        priceNRS,
        durationInDays,
        durationInMonths,
        isCalendarBased: isCalendarBased || false,
        excludeSaturdays: excludeSaturdays || false,
        accessStartTime: accessStartTime || '05:00',
        accessEndTime: accessEndTime || '20:30',
        isActive: isActive !== undefined ? isActive : true,
        description
    })

    return res
        .status(201)
        .json(new ApiResponse("Membership type created successfully", membershipType, 'success', 201))
})

// Get all membership types
const getAllMembershipTypes = asyncHandler(async (req, res) => {
    const membershipTypes = await MembershipType.find().sort({ priceNRS: 1 })

    return res
        .status(200)
        .json(new ApiResponse("Membership types retrieved successfully", membershipTypes))
})

// Get active membership types
const getActiveMembershipTypes = asyncHandler(async (req, res) => {
    const membershipTypes = await MembershipType.find({ isActive: true }).sort({ priceNRS: 1 })

    return res
        .status(200)
        .json(new ApiResponse("Active membership types retrieved successfully", membershipTypes))
})

// Get membership type by ID
const getMembershipTypeById = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membershipType = await MembershipType.findById(id)

    if (!membershipType) {
        throw new ApiError("Membership type not found", 404)
    }

    return res
        .status(200)
        .json(new ApiResponse("Membership type retrieved successfully", membershipType))
})

// Update membership type
const updateMembershipType = asyncHandler(async (req, res) => {
    const { id } = req.params
    const {
        title,
        priceNRS,
        durationInDays,
        durationInMonths,
        isCalendarBased,
        excludeSaturdays,
        accessStartTime,
        accessEndTime,
        isActive,
        description
    } = req.body

    const membershipType = await MembershipType.findById(id)
    if (!membershipType) {
        throw new ApiError("Membership type not found", 404)
    }

    if (title) {
        // Check if new title already exists (excluding current document)
        const existingType = await MembershipType.findOne({ title, _id: { $ne: id } })
        if (existingType) {
            throw new ApiError("Membership type with this title already exists", 400)
        }

        // Check if title is valid enum value
        const validTitles = [
            'Daily', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly',
            'Three-Year', 'Five-Year', 'Ten-Year', 'Lifetime'
        ]
        if (!validTitles.includes(title)) {
            throw new ApiError("Invalid membership type title", 400)
        }

        membershipType.title = title
    }

    if (priceNRS) membershipType.priceNRS = priceNRS
    if (durationInDays !== undefined) membershipType.durationInDays = durationInDays
    if (durationInMonths !== undefined) membershipType.durationInMonths = durationInMonths
    if (isCalendarBased !== undefined) membershipType.isCalendarBased = isCalendarBased
    if (excludeSaturdays !== undefined) membershipType.excludeSaturdays = excludeSaturdays
    if (accessStartTime) membershipType.accessStartTime = accessStartTime
    if (accessEndTime) membershipType.accessEndTime = accessEndTime
    if (isActive !== undefined) membershipType.isActive = isActive
    if (description !== undefined) membershipType.description = description

    await membershipType.save()

    return res
        .status(200)
        .json(new ApiResponse("Membership type updated successfully", membershipType))
})

// Delete membership type
const deleteMembershipType = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membershipType = await MembershipType.findByIdAndDelete(id)

    if (!membershipType) {
        throw new ApiError("Membership type not found", 404)
    }

    return res
        .status(200)
        .json(new ApiResponse("Membership type deleted successfully", null))
})

// Toggle membership type status (active/inactive)
const toggleMembershipTypeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membershipType = await MembershipType.findById(id)
    if (!membershipType) {
        throw new ApiError("Membership type not found", 404)
    }

    membershipType.isActive = !membershipType.isActive
    await membershipType.save()

    return res
        .status(200)
        .json(new ApiResponse(`Membership type ${membershipType.isActive ? 'activated' : 'deactivated'} successfully`, membershipType))
})

export {
    createMembershipType,
    getAllMembershipTypes,
    getActiveMembershipTypes,
    getMembershipTypeById,
    updateMembershipType,
    deleteMembershipType,
    toggleMembershipTypeStatus
}
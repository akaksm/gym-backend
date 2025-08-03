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
        throw new ApiError(400, "Title and price are required")
    }

    // Check if title is valid enum value
    const validTitles = [
        'Daily', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly',
        'Three-Year', 'Five-Year', 'Ten-Year', 'Lifetime'
    ]
    if (!validTitles.includes(title)) {
        throw new ApiError(400, "Invalid membership type title")
    }

    // Check if title already exists
    const existingType = await MembershipType.findOne({ title })
    if (existingType) {
        throw new ApiError(400, "Membership type with this title already exists")
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
        .json(new ApiResponse(201, membershipType, "Membership type created successfully"))
})

// Get all membership types
const getAllMembershipTypes = asyncHandler(async (req, res) => {
    const membershipTypes = await MembershipType.find().sort({ priceNRS: 1 })

    return res
        .status(200)
        .json(new ApiResponse(200, membershipTypes, "Membership types retrieved successfully"))
})

// Get active membership types
const getActiveMembershipTypes = asyncHandler(async (req, res) => {
    const membershipTypes = await MembershipType.find({ isActive: true }).sort({ priceNRS: 1 })

    return res
        .status(200)
        .json(new ApiResponse(200, membershipTypes, "Active membership types retrieved successfully"))
})

// Get membership type by ID
const getMembershipTypeById = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membershipType = await MembershipType.findById(id)

    if (!membershipType) {
        throw new ApiError(404, "Membership type not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, membershipType, "Membership type retrieved successfully"))
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
        throw new ApiError(404, "Membership type not found")
    }

    if (title) {
        // Check if new title already exists (excluding current document)
        const existingType = await MembershipType.findOne({ title, _id: { $ne: id } })
        if (existingType) {
            throw new ApiError(400, "Membership type with this title already exists")
        }

        // Check if title is valid enum value
        const validTitles = [
            'Daily', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly',
            'Three-Year', 'Five-Year', 'Ten-Year', 'Lifetime'
        ]
        if (!validTitles.includes(title)) {
            throw new ApiError(400, "Invalid membership type title")
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
        .json(new ApiResponse(200, membershipType, "Membership type updated successfully"))
})

// Delete membership type
const deleteMembershipType = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membershipType = await MembershipType.findByIdAndDelete(id)

    if (!membershipType) {
        throw new ApiError(404, "Membership type not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Membership type deleted successfully"))
})

// Toggle membership type status (active/inactive)
const toggleMembershipTypeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params

    const membershipType = await MembershipType.findById(id)
    if (!membershipType) {
        throw new ApiError(404, "Membership type not found")
    }

    membershipType.isActive = !membershipType.isActive
    await membershipType.save()

    return res
        .status(200)
        .json(new ApiResponse(200, membershipType, `Membership type ${membershipType.isActive ? 'activated' : 'deactivated'} successfully`))
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
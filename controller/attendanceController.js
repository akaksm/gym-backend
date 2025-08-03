import { Attendance } from "../models/attendance.js"
import { User } from "../models/user.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { fingerprintService } from "../utils/fingerprintService.js"

// Helper to get start of today (midnight)
function getTodayDate() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
}

// Helper to get date range
function getDateRange(startDate, endDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
}

export const enrollFingerprint = asyncHandler(async (req, res) => {
    const { userId, fingerIndex = 0 } = req.body

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    try {
        const result = await fingerprintService.enrollUser(userId, fingerIndex)

        return res.status(200).json(
            new ApiResponse(200, result, "Fingerprint enrolled successfully")
        )
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message)
    }
})

export const recordFingerprintAttendance = asyncHandler(async (req, res) => {
    const { userId, fingerIndex = 0 } = req.body

    if (!userId) {
        throw new ApiError(400, "User ID is required")
    }

    try {
        const result = await fingerprintService.verifyAttendance(userId, fingerIndex)

        return res.status(200).json(
            new ApiResponse(200, result, "Attendance recorded via fingerprint")
        )
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message)
    }
})

// Manual attendance management (Admin function)
export const markManualAttendance = asyncHandler(async (req, res) => {
    const { userId, date, action, notes } = req.body

    if (!userId || !date || !action) {
        throw new ApiError(400, "User ID, date, and action are required")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    let attendance = await Attendance.findOne({ user: userId, date: attendanceDate })

    if (action === 'check-in') {
        if (attendance && attendance.checkInTime) {
            throw new ApiError(409, "User already checked in for this date")
        }

        if (!attendance) {
            attendance = await Attendance.create({
                user: userId,
                date: attendanceDate,
                checkInTime: new Date(),
                status: 'present',
                verificationMethod: 'manual',
                deviceId: 'admin-panel',
                notes: notes || 'Manually marked by admin'
            })
        } else {
            attendance.checkInTime = new Date()
            attendance.status = 'present'
            attendance.verificationMethod = 'manual'
            attendance.deviceId = 'admin-panel'
            attendance.notes = notes || 'Manually marked by admin'
            await attendance.save()
        }

        return res.status(201).json(
            new ApiResponse(201, attendance, "Manual check-in recorded")
        )
    } else if (action === 'check-out') {
        if (!attendance || !attendance.checkInTime) {
            throw new ApiError(400, "User must check in before checking out")
        }

        if (attendance.checkOutTime) {
            throw new ApiError(409, "User already checked out for this date")
        }

        attendance.checkOutTime = new Date()
        attendance.verificationMethod = 'manual'
        attendance.deviceId = 'admin-panel'
        attendance.notes = notes || 'Manually marked by admin'
        await attendance.save()

        return res.status(200).json(
            new ApiResponse(200, attendance, "Manual check-out recorded")
        )
    } else if (action === 'absent') {
        if (attendance) {
            attendance.status = 'absent'
            attendance.verificationMethod = 'manual'
            attendance.deviceId = 'admin-panel'
            attendance.notes = notes || 'Marked absent by admin'
            await attendance.save()
        } else {
            attendance = await Attendance.create({
                user: userId,
                date: attendanceDate,
                status: 'absent',
                verificationMethod: 'manual',
                deviceId: 'admin-panel',
                notes: notes || 'Marked absent by admin'
            })
        }

        return res.status(200).json(
            new ApiResponse(200, attendance, "Absence recorded")
        )
    } else {
        throw new ApiError(400, "Invalid action. Use 'check-in', 'check-out', or 'absent'")
    }
})

// Get attendance for a specific user
export const getUserAttendance = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { startDate, endDate, page = 1, limit = 30 } = req.query

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    let query = { user: userId }

    if (startDate && endDate) {
        const { start, end } = getDateRange(startDate, endDate)
        query.date = { $gte: start, $lte: end }
    }

    const skip = (page - 1) * limit

    const attendance = await Attendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)

    const total = await Attendance.countDocuments(query)

    return res.status(200).json(
        new ApiResponse(200, {
            attendance,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        }, "User attendance retrieved successfully")
    )
})

// Get today's attendance (Admin dashboard)
export const getTodayAttendance = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query
    const today = getTodayDate()

    const skip = (page - 1) * limit

    const attendance = await Attendance.find({ date: today })
        .populate('user', 'name email phone profileImage')
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limit)

    const total = await Attendance.countDocuments({ date: today })

    // Calculate statistics
    const presentCount = await Attendance.countDocuments({
        date: today,
        status: 'present'
    })
    const absentCount = await Attendance.countDocuments({
        date: today,
        status: 'absent'
    })

    return res.status(200).json(
        new ApiResponse(200, {
            attendance,
            statistics: {
                total: total,
                present: presentCount,
                absent: absentCount,
                attendanceRate: total > 0 ? ((presentCount / total) * 100).toFixed(2) : 0
            },
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        }, "Today's attendance retrieved successfully")
    )
})

// Get attendance statistics
export const getAttendanceStats = asyncHandler(async (req, res) => {
    const { startDate, endDate, userId } = req.query

    let query = {}

    if (startDate && endDate) {
        const { start, end } = getDateRange(startDate, endDate)
        query.date = { $gte: start, $lte: end }
    }

    if (userId) {
        query.user = userId
    }

    const attendance = await Attendance.find(query)
        .populate('user', 'name email')

    // Calculate statistics
    const totalDays = attendance.length
    const presentDays = attendance.filter(a => a.status === 'present').length
    const absentDays = attendance.filter(a => a.status === 'absent').length
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0

    // Calculate average check-in time
    const checkInTimes = attendance
        .filter(a => a.checkInTime)
        .map(a => a.checkInTime.getHours() * 60 + a.checkInTime.getMinutes())

    const avgCheckInTime = checkInTimes.length > 0
        ? Math.round(checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length)
        : 0

    // Calculate average session duration
    const sessionDurations = attendance
        .filter(a => a.checkInTime && a.checkOutTime)
        .map(a => (a.checkOutTime - a.checkInTime) / (1000 * 60)) // in minutes

    const avgSessionDuration = sessionDurations.length > 0
        ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
        : 0

    return res.status(200).json(
        new ApiResponse(200, {
            totalDays,
            presentDays,
            absentDays,
            attendanceRate: Number(attendanceRate),
            avgCheckInTime,
            avgSessionDuration,
            attendance
        }, "Attendance statistics retrieved successfully")
    )
})

// Bulk mark attendance (Admin function)
export const bulkMarkAttendance = asyncHandler(async (req, res) => {
    const { date, attendanceData } = req.body

    if (!date || !attendanceData || !Array.isArray(attendanceData)) {
        throw new ApiError(400, "Date and attendance data array are required")
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)

    const results = []
    const errors = []

    for (const item of attendanceData) {
        try {
            const { userId, action, notes } = item

            if (!userId || !action) {
                errors.push({ userId, error: "Missing required fields" })
                continue
            }

            const user = await User.findById(userId)
            if (!user) {
                errors.push({ userId, error: "User not found" })
                continue
            }

            let attendance = await Attendance.findOne({
                user: userId,
                date: attendanceDate
            })

            if (action === 'present') {
                if (!attendance) {
                    attendance = await Attendance.create({
                        user: userId,
                        date: attendanceDate,
                        checkInTime: new Date(),
                        status: 'present',
                        verificationMethod: 'manual',
                        deviceId: 'admin-bulk',
                        notes: notes || 'Bulk marked by admin'
                    })
                } else {
                    attendance.status = 'present'
                    attendance.checkInTime = attendance.checkInTime || new Date()
                    attendance.verificationMethod = 'manual'
                    attendance.deviceId = 'admin-bulk'
                    attendance.notes = notes || 'Bulk marked by admin'
                    await attendance.save()
                }
            } else if (action === 'absent') {
                if (!attendance) {
                    attendance = await Attendance.create({
                        user: userId,
                        date: attendanceDate,
                        status: 'absent',
                        verificationMethod: 'manual',
                        deviceId: 'admin-bulk',
                        notes: notes || 'Bulk marked by admin'
                    })
                } else {
                    attendance.status = 'absent'
                    attendance.verificationMethod = 'manual'
                    attendance.deviceId = 'admin-bulk'
                    attendance.notes = notes || 'Bulk marked by admin'
                    await attendance.save()
                }
            }

            results.push({ userId, success: true, attendance })
        } catch (error) {
            errors.push({ userId: item.userId, error: error.message })
        }
    }

    return res.status(200).json(
        new ApiResponse(200, {
            results,
            errors,
            summary: {
                total: attendanceData.length,
                successful: results.length,
                failed: errors.length
            }
        }, "Bulk attendance marking completed")
    )
})

// Delete attendance record (Admin function)
export const deleteAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params

    const attendance = await Attendance.findByIdAndDelete(id)
    if (!attendance) {
        throw new ApiError(404, "Attendance record not found")
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Attendance record deleted successfully")
    )
})

// Fingerprint device management endpoints
export const getDeviceStatus = asyncHandler(async (req, res) => {
    try {
        const deviceInfo = await fingerprintService.getDeviceStatus()

        return res.status(200).json(
            new ApiResponse(200, deviceInfo, "Device status retrieved successfully")
        )
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message)
    }
})

export const deleteFingerprintEnrollment = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { fingerIndex = 0 } = req.body

    try {
        const result = await fingerprintService.deleteEnrollment(userId, fingerIndex)

        return res.status(200).json(
            new ApiResponse(200, result, "Fingerprint enrollment deleted successfully")
        )
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message)
    }
})

export const initializeFingerprintDevice = asyncHandler(async (req, res) => {
    try {
        await fingerprintService.initialize()

        return res.status(200).json(
            new ApiResponse(200, { status: 'initialized' }, "Fingerprint device initialized successfully")
        )
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message)
    }
})
import express from 'express'
import {
    enrollFingerprint,
    recordFingerprintAttendance,
    markManualAttendance,
    getUserAttendance,
    getTodayAttendance,
    getAttendanceStats,
    bulkMarkAttendance,
    deleteAttendance,
    getDeviceStatus,
    deleteFingerprintEnrollment,
    initializeFingerprintDevice
} from '../controller/attendanceController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// Fingerprint device management
router.get('/device/status', authMiddleware, asyncHandler(getDeviceStatus))
router.post('/device/initialize', authMiddleware, asyncHandler(initializeFingerprintDevice))

// Fingerprint-based endpoints
router.post('/enroll-fingerprint', authMiddleware, asyncHandler(enrollFingerprint))
router.post('/fingerprint-attendance', asyncHandler(recordFingerprintAttendance))
router.delete('/fingerprint/:userId', authMiddleware, asyncHandler(deleteFingerprintEnrollment))

// Manual attendance management (Admin)
router.post('/manual', authMiddleware, asyncHandler(markManualAttendance))
router.post('/bulk', authMiddleware, asyncHandler(bulkMarkAttendance))

// Attendance retrieval
router.get('/user/:userId', authMiddleware, asyncHandler(getUserAttendance))
router.get('/today', authMiddleware, asyncHandler(getTodayAttendance))
router.get('/stats', authMiddleware, asyncHandler(getAttendanceStats))

// Admin functions
router.delete('/:id', authMiddleware, asyncHandler(deleteAttendance))

export default router 
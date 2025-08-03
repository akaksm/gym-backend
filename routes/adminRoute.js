import express from 'express'
import {
    registerAdmin,
    loginAdmin,
    verifyAdminOTP,
    resendAdminOTP,
    adminDetails,
    updateAdmin,
    adminPasswordChange,
    adminForgetPassword,
    verifyAdminForgetPasswordOTP,
    adminForgetPasswordChange,
    getAdminDashboard
} from '../controller/adminController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { adminAuthMiddleware } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/file-upload.js'

const router = express.Router()

// Registration and authentication
router.post('/register', asyncHandler(registerAdmin))
router.post('/login', asyncHandler(loginAdmin))
router.post('/verify-otp', asyncHandler(verifyAdminOTP))
router.post('/resend-otp', asyncHandler(resendAdminOTP))

// Password management
router.post('/password/forgot', asyncHandler(adminForgetPassword))
router.post('/password/verify-otp', asyncHandler(verifyAdminForgetPasswordOTP))
router.post('/password/reset', asyncHandler(adminForgetPasswordChange))
router.post('/password/change', adminAuthMiddleware, asyncHandler(adminPasswordChange))

// Admin profile
router.get('/details', adminAuthMiddleware, asyncHandler(adminDetails))
router.put('/update', adminAuthMiddleware, upload.single('profileImage'), asyncHandler(updateAdmin))

// Dashboard
router.get('/dashboard', adminAuthMiddleware, asyncHandler(getAdminDashboard))

export default router 
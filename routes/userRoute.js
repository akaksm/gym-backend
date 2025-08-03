import express from 'express'
import {
    register,
    loginUser,
    verifyOTP,
    resendOTP,
    searchUser,
    userDetails,
    updateUser,
    deleteUser,
    passwordChange,
    forgetPassword,
    verifyForgetPasswordOTP,
    forgetPasswordChange,
    getUserDashboard
} from '../controller/userController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/file-upload.js'

const router = express.Router()

// Registration and authentication
router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(loginUser))
router.post('/verify-otp', asyncHandler(verifyOTP))
router.post('/resend-otp', asyncHandler(resendOTP))

// Password management
router.post('/password/forgot', asyncHandler(forgetPassword))
router.post('/password/verify-otp', asyncHandler(verifyForgetPasswordOTP))
router.post('/password/reset', asyncHandler(forgetPasswordChange))
router.post('/password/change', authMiddleware, asyncHandler(passwordChange))

// User profile and search
router.get('/search', asyncHandler(searchUser))
router.get('/details/:id', asyncHandler(userDetails))
router.put('/update', authMiddleware, upload.single('profileImage'), asyncHandler(updateUser))
router.delete('/delete/:id', authMiddleware, asyncHandler(deleteUser))

// Dashboard
router.get('/dashboard', authMiddleware, asyncHandler(getUserDashboard))

export default router
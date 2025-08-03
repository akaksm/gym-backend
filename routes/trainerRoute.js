import express from 'express'
import {
    registerTrainer,
    loginTrainer,
    verifyTrainerOTP,
    resendTrainerOTP,
    getAllTrainers,
    trainerDetails,
    updateTrainer,
    getTrainerClients,
    updateTrainerSchedule,
    trainerPasswordChange,
    trainerForgetPassword,
    verifyTrainerForgetPasswordOTP,
    trainerForgetPasswordChange,
    getTrainerDashboard
} from '../controller/trainerController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { trainerAuthMiddleware } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/file-upload.js'

const router = express.Router()

// Registration and authentication
router.post('/register', asyncHandler(registerTrainer))
router.post('/login', asyncHandler(loginTrainer))
router.post('/verify-otp', asyncHandler(verifyTrainerOTP))
router.post('/resend-otp', asyncHandler(resendTrainerOTP))

// Password management
router.post('/password/forgot', asyncHandler(trainerForgetPassword))
router.post('/password/verify-otp', asyncHandler(verifyTrainerForgetPasswordOTP))
router.post('/password/reset', asyncHandler(trainerForgetPasswordChange))
router.post('/password/change', trainerAuthMiddleware, asyncHandler(trainerPasswordChange))

// Trainer profile and clients
router.get('/all', asyncHandler(getAllTrainers))
router.get('/details/:id', asyncHandler(trainerDetails))
router.put('/update', trainerAuthMiddleware, upload.single('profileImage'), asyncHandler(updateTrainer))
router.get('/clients', trainerAuthMiddleware, asyncHandler(getTrainerClients))
router.put('/schedule', trainerAuthMiddleware, asyncHandler(updateTrainerSchedule))

// Dashboard
router.get('/dashboard', trainerAuthMiddleware, asyncHandler(getTrainerDashboard))

export default router 
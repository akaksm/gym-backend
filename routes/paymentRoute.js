import express from 'express'
import {
    initiatePayment,
    verifyPayment,
    khaltiWebhook,
    getUserPayments,
    getPaymentById,
    processRefund,
    getAllPayments
} from '../controller/paymentController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { verifyKhaltiWebhook } from '../middleware/verifyKhaltiWebhook.js'

const router = express.Router()

// Payment initiation and verification
router.post('/initiate', authMiddleware, asyncHandler(initiatePayment))
router.post('/verify', asyncHandler(verifyPayment))

// Khalti webhook (no auth required - called by Khalti)
router.post('/webhook/khalti', verifyKhaltiWebhook, asyncHandler(khaltiWebhook))

// Payment history and details
router.get('/user/:userId', authMiddleware, asyncHandler(getUserPayments))
router.get('/:id', authMiddleware, asyncHandler(getPaymentById))

// Admin routes
router.get('/', authMiddleware, asyncHandler(getAllPayments))
router.post('/refund/:paymentId', authMiddleware, asyncHandler(processRefund))

export default router 
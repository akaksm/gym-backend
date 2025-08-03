import express from 'express'
import {
    generatePrediction,
    updatePrediction,
    getUserPredictions,
    getPredictionAnalytics,
    deletePrediction
} from '../controller/predictionController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(authMiddleware)

// Generate new prediction
router.post('/generate/:userId', asyncHandler(generatePrediction))

// Update prediction with actual workout time
router.put('/:predictionId', asyncHandler(updatePrediction))

// Get user's prediction history
router.get('/user/:userId', asyncHandler(getUserPredictions))

// Get prediction analytics
router.get('/analytics/:userId', asyncHandler(getPredictionAnalytics))

// Delete prediction
router.delete('/:predictionId', asyncHandler(deletePrediction))

export default router 
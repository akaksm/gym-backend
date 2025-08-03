import { Prediction } from "../models/prediction.js"
import { User } from "../models/user.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { workoutTimePredictor } from "../utils/mlService.js"

// Generate optimal workout time prediction
export const generatePrediction = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const {
        date,
        workSchedule,
        personalFactors
    } = req.body

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError("User not found", 404)
    }

    // Update user with work schedule if provided
    if (workSchedule) {
        user.workSchedule = {
            workStartTime: workSchedule.workStartTime || "09:00",
            workEndTime: workSchedule.workEndTime || "17:00",
            commuteTime: workSchedule.commuteTime || 30,
            preferredWorkoutTime: workSchedule.preferredWorkoutTime || "Evening"
        }
        await user.save()
    }

    // Update personal factors if provided
    if (personalFactors) {
        user.energyLevel = personalFactors.energyLevel || user.energyLevel
        user.sleepQuality = personalFactors.sleepQuality || user.sleepQuality
        user.stressLevel = personalFactors.stressLevel || user.stressLevel
        await user.save()
    }

    // Predict optimal workout time using ML
    const predictionDate = date ? new Date(date) : new Date()
    const prediction = await workoutTimePredictor.predictOptimalTime(userId, predictionDate)

    // Create prediction record
    const predictionRecord = await Prediction.create({
        user: userId,
        predictedOptimalTime: prediction.optimalSlot,
        predictedDate: predictionDate,
        confidence: prediction.optimalSlot.confidence,
        userFactors: {
            workSchedule: user.workSchedule || {
                workStartTime: "09:00",
                workEndTime: "17:00",
                commuteTime: 30,
                preferredWorkoutTime: "Evening"
            },
            personalFactors: {
                age: user.age,
                weight: user.weight,
                height: user.height,
                fitnessGoal: user.fitnessGoal,
                currentFitnessLevel: user.currentFitnessLevel || 'Beginner',
                energyLevel: user.energyLevel || 'Medium',
                sleepQuality: user.sleepQuality || 'Good',
                stressLevel: user.stressLevel || 'Medium'
            }
        },
        gymFactors: {
            gymHours: {
                openTime: "06:00",
                closeTime: "22:00"
            },
            crowdLevel: prediction.factors.crowdLevel,
            equipmentAvailability: prediction.factors.equipmentAvailability
        },
        trainerFactors: {
            assignedTrainer: user.assignedTrainer,
            trainerAvailability: {
                availableSlots: [] // Will be populated from trainer schedule
            }
        },
        alternativeSlots: prediction.alternativeSlots,
        recommendation: generateRecommendation(prediction.optimalSlot, prediction.factors)
    })

    return res.status(201).json(
        new ApiResponse("Optimal workout time prediction generated successfully", {
            prediction: predictionRecord,
            optimalTime: prediction.optimalSlot,
            alternatives: prediction.alternativeSlots,
            factors: prediction.factors
        }, `Success`, 201)
    )
})

// Helper function to generate recommendations
function generateRecommendation(optimalSlot, factors) {
    const hour = parseInt(optimalSlot.startTime.split(':')[0])
    let recommendation = ""

    // Crowd level recommendations
    if (factors.crowdLevel === 'Low') {
        recommendation += "Perfect time with minimal crowds. "
    } else if (factors.crowdLevel === 'Peak') {
        recommendation += "High energy time slot with peak activity. "
    }

    // Equipment availability recommendations
    if (factors.equipmentAvailability === 'High') {
        recommendation += "All equipment should be available. "
    } else if (factors.equipmentAvailability === 'Low') {
        recommendation += "Consider bringing your own equipment or plan alternative exercises. "
    }

    // Trainer availability
    if (factors.trainerAvailable) {
        recommendation += "Your trainer will be available for guidance. "
    }

    // Time-based recommendations
    if (hour < 10) {
        recommendation += "Early morning workout - great for metabolism boost!"
    } else if (hour >= 17) {
        recommendation += "Evening workout - perfect for stress relief after work!"
    } else {
        recommendation += "Flexible time slot - adapt to your schedule!"
    }

    return recommendation
}

// Update prediction with actual workout results
export const updatePrediction = asyncHandler(async (req, res) => {
    const { predictionId } = req.params
    const { actualWorkoutTime } = req.body

    const prediction = await Prediction.findById(predictionId)
    if (!prediction) {
        throw new ApiError("Prediction not found", 404)
    }

    // Calculate accuracy based on actual vs predicted
    const accuracy = calculateAccuracy(prediction.predictedOptimalTime, actualWorkoutTime)

    prediction.actualWorkoutTime = actualWorkoutTime
    prediction.accuracy = accuracy
    prediction.isCompleted = true
    await prediction.save()

    return res.status(200).json(
        new ApiResponse("Prediction updated with actual workout results", {
            prediction,
            accuracy
        })
    )
})

// Get user's prediction history
export const getUserPredictions = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError("User not found", 404)
    }

    const skip = (page - 1) * limit
    const predictions = await Prediction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    const total = await Prediction.countDocuments({ user: userId })

    // Calculate statistics
    const completedPredictions = predictions.filter(p => p.isCompleted)
    const successRate = completedPredictions.length > 0
        ? (completedPredictions.filter(p => p.accuracy && p.accuracy.overallAccuracy > 70).length / completedPredictions.length) * 100
        : 0

    return res.status(200).json(
        new ApiResponse("User predictions retrieved successfully", {
            predictions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            statistics: {
                totalPredictions: predictions.length,
                completedPredictions: completedPredictions.length,
                successRate: Math.round(successRate)
            }
        })
    )
})

// Get prediction analytics
export const getPredictionAnalytics = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { startDate, endDate } = req.query

    let query = { user: userId, isCompleted: true }
    if (startDate && endDate) {
        query.predictedDate = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    }

    const predictions = await Prediction.find(query)

    // Calculate analytics
    const totalPredictions = predictions.length
    const averageAccuracy = totalPredictions > 0
        ? predictions.reduce((sum, p) => sum + (p.accuracy?.overallAccuracy || 0), 0) / totalPredictions
        : 0
    const highConfidencePredictions = predictions.filter(p => p.confidence > 80).length
    const lowConfidencePredictions = predictions.filter(p => p.confidence < 50).length

    // Most common recommendations
    const recommendations = predictions.map(p => p.recommendation)
    const recommendationFrequency = recommendations.reduce((acc, rec) => {
        acc[rec] = (acc[rec] || 0) + 1
        return acc
    }, {})

    return res.status(200).json(
        new ApiResponse("Prediction analytics retrieved successfully", {
            analytics: {
                totalPredictions,
                averageAccuracy: Math.round(averageAccuracy),
                highConfidencePredictions,
                lowConfidencePredictions,
                recommendationFrequency
            },
            predictions: predictions.slice(0, 10) // Return last 10 for detailed view
        })
    )
})

// Delete prediction
export const deletePrediction = asyncHandler(async (req, res) => {
    const { predictionId } = req.params

    const prediction = await Prediction.findByIdAndDelete(predictionId)
    if (!prediction) {
        throw new ApiError("Prediction not found", 404)
    }

    return res.status(200).json(
        new ApiResponse("Prediction deleted successfully", {})
    )
})

// Helper function to calculate accuracy
function calculateAccuracy(predicted, actual) {
    // Simple accuracy calculation - can be enhanced
    const timeDiff = Math.abs(
        new Date(`2000-01-01 ${predicted.startTime}`) -
        new Date(`2000-01-01 ${actual.startTime}`)
    ) / (1000 * 60) // Convert to minutes

    const timeAccuracy = Math.max(0, 100 - (timeDiff * 2)) // 2% penalty per minute
    const crowdAccuracy = 85 // Placeholder - should be calculated from actual data
    const overallAccuracy = (timeAccuracy + crowdAccuracy) / 2

    return {
        timeAccuracy: Math.round(timeAccuracy),
        crowdAccuracy: Math.round(crowdAccuracy),
        overallAccuracy: Math.round(overallAccuracy)
    }
} 
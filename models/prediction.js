import mongoose from 'mongoose'

const predictionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    predictedOptimalTime: {
        startTime: {
            type: String, // Format: "HH:MM"
            required: true
        },
        endTime: {
            type: String, // Format: "HH:MM"
            required: true
        },
        duration: {
            type: Number, // in minutes
            required: true
        }
    },
    predictedDate: {
        type: Date,
        required: true
    },
    confidence: {
        type: Number, // 0-100 percentage
        default: 0
    },
    // User-specific factors
    userFactors: {
        workSchedule: {
            workStartTime: String, // "09:00"
            workEndTime: String,   // "17:00"
            commuteTime: Number,   // in minutes
            preferredWorkoutTime: {
                type: String,
                enum: ['Morning', 'Afternoon', 'Evening', 'Night'],
                default: 'Evening'
            }
        },
        personalFactors: {
            age: Number,
            weight: Number,
            height: Number,
            fitnessGoal: String,
            currentFitnessLevel: {
                type: String,
                enum: ['Beginner', 'Intermediate', 'Advanced'],
                default: 'Beginner'
            },
            energyLevel: {
                type: String,
                enum: ['Low', 'Medium', 'High'],
                default: 'Medium'
            },
            sleepQuality: {
                type: String,
                enum: ['Poor', 'Fair', 'Good', 'Excellent'],
                default: 'Good'
            },
            stressLevel: {
                type: String,
                enum: ['Low', 'Medium', 'High'],
                default: 'Medium'
            }
        }
    },
    // Gym factors
    gymFactors: {
        gymHours: {
            openTime: String,  // "06:00"
            closeTime: String  // "22:00"
        },
        crowdLevel: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Peak'],
            default: 'Medium'
        },
        equipmentAvailability: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium'
        }
    },
    // Trainer factors
    trainerFactors: {
        assignedTrainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trainer'
        },
        trainerAvailability: {
            availableSlots: [{
                startTime: String,
                endTime: String,
                day: {
                    type: String,
                    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                }
            }]
        }
    },
    // Historical data
    historicalFactors: {
        pastAttendance: {
            totalSessions: Number,
            averageDuration: Number,
            preferredTimeSlots: [String], // ["18:00-19:00", "19:00-20:00"]
            successRate: Number // percentage of completed workouts
        },
        crowdPatterns: {
            hourlyCrowdLevels: [{
                hour: Number, // 0-23
                averageCrowdLevel: Number // 0-100
            }]
        }
    },
    // ML Model data
    mlFeatures: {
        features: {
            type: Map,
            of: Number
        },
        featureImportance: {
            type: Map,
            of: Number
        }
    },
    // Actual results
    actualWorkout: {
        startTime: String,
        endTime: String,
        duration: Number,
        completed: {
            type: Boolean,
            default: false
        },
        satisfaction: {
            type: Number, // 1-5 rating
            min: 1,
            max: 5
        },
        crowdLevel: String,
        equipmentAvailability: String
    },
    // Accuracy metrics
    accuracy: {
        timeAccuracy: Number, // percentage
        crowdAccuracy: Number, // percentage
        overallAccuracy: Number // percentage
    },
    recommendation: {
        type: String,
        default: null
    },
    alternativeSlots: [{
        startTime: String,
        endTime: String,
        confidence: Number,
        reason: String
    }],
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
})

// Indexes for efficient queries
predictionSchema.index({ user: 1, predictedDate: 1 })
predictionSchema.index({ predictedDate: 1, isCompleted: 1 })
predictionSchema.index({ 'userFactors.workSchedule.workStartTime': 1 })
predictionSchema.index({ 'gymFactors.crowdLevel': 1 })

export const Prediction = mongoose.model('Prediction', predictionSchema)

import { Attendance } from "../models/attendance.js"
import { Prediction } from "../models/prediction.js"
import { User } from "../models/user.js"
import { Trainer } from "../models/trainer.js"

// Simple Random Forest implementation for workout time prediction
class RandomForest {
    constructor(nTrees = 10, maxDepth = 5) {
        this.nTrees = nTrees
        this.maxDepth = maxDepth
        this.trees = []
    }

    // Bootstrap sample for each tree
    bootstrapSample(data, sampleSize) {
        const sample = []
        for (let i = 0; i < sampleSize; i++) {
            const randomIndex = Math.floor(Math.random() * data.length)
            sample.push(data[randomIndex])
        }
        return sample
    }

    // Calculate entropy for splitting
    calculateEntropy(labels) {
        const counts = {}
        labels.forEach(label => {
            counts[label] = (counts[label] || 0) + 1
        })

        let entropy = 0
        const total = labels.length
        Object.values(counts).forEach(count => {
            const p = count / total
            entropy -= p * Math.log2(p)
        })
        return entropy
    }

    // Find best split for a feature
    findBestSplit(data, featureIndex) {
        const uniqueValues = [...new Set(data.map(row => row[featureIndex]))]
        let bestSplit = null
        let bestGain = -1

        uniqueValues.forEach(value => {
            const left = data.filter(row => row[featureIndex] <= value)
            const right = data.filter(row => row[featureIndex] > value)

            if (left.length === 0 || right.length === 0) return

            const leftLabels = left.map(row => row[row.length - 1])
            const rightLabels = right.map(row => row[row.length - 1])
            const allLabels = data.map(row => row[row.length - 1])

            const leftEntropy = this.calculateEntropy(leftLabels)
            const rightEntropy = this.calculateEntropy(rightLabels)
            const parentEntropy = this.calculateEntropy(allLabels)

            const leftWeight = left.length / data.length
            const rightWeight = right.length / data.length
            const gain = parentEntropy - (leftWeight * leftEntropy + rightWeight * rightEntropy)

            if (gain > bestGain) {
                bestGain = gain
                bestSplit = { value, featureIndex }
            }
        })

        return bestSplit
    }

    // Build decision tree
    buildTree(data, depth = 0) {
        const labels = data.map(row => row[row.length - 1])
        const uniqueLabels = [...new Set(labels)]

        // Base cases
        if (uniqueLabels.length === 1 || depth >= this.maxDepth || data.length < 5) {
            const labelCounts = {}
            labels.forEach(label => {
                labelCounts[label] = (labelCounts[label] || 0) + 1
            })
            return {
                type: 'leaf', prediction: Object.keys(labelCounts).reduce((a, b) =>
                    labelCounts[a] > labelCounts[b] ? a : b)
            }
        }

        // Find best split
        let bestSplit = null
        let bestGain = -1

        for (let i = 0; i < data[0].length - 1; i++) {
            const split = this.findBestSplit(data, i)
            if (split && split.gain > bestGain) {
                bestGain = split.gain
                bestSplit = split
            }
        }

        if (!bestSplit) {
            const labelCounts = {}
            labels.forEach(label => {
                labelCounts[label] = (labelCounts[label] || 0) + 1
            })
            return {
                type: 'leaf', prediction: Object.keys(labelCounts).reduce((a, b) =>
                    labelCounts[a] > labelCounts[b] ? a : b)
            }
        }

        const left = data.filter(row => row[bestSplit.featureIndex] <= bestSplit.value)
        const right = data.filter(row => row[bestSplit.featureIndex] > bestSplit.value)

        return {
            type: 'node',
            featureIndex: bestSplit.featureIndex,
            value: bestSplit.value,
            left: this.buildTree(left, depth + 1),
            right: this.buildTree(right, depth + 1)
        }
    }

    // Train the forest
    train(data) {
        this.trees = []
        for (let i = 0; i < this.nTrees; i++) {
            const sample = this.bootstrapSample(data, data.length)
            const tree = this.buildTree(sample)
            this.trees.push(tree)
        }
    }

    // Predict using a single tree
    predictSingle(tree, features) {
        if (tree.type === 'leaf') {
            return tree.prediction
        }

        if (features[tree.featureIndex] <= tree.value) {
            return this.predictSingle(tree.left, features)
        } else {
            return this.predictSingle(tree.right, features)
        }
    }

    // Predict using the entire forest
    predict(features) {
        const predictions = this.trees.map(tree => this.predictSingle(tree, features))
        const counts = {}
        predictions.forEach(pred => {
            counts[pred] = (counts[pred] || 0) + 1
        })
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
    }

    // Get confidence score
    getConfidence(features) {
        const predictions = this.trees.map(tree => this.predictSingle(tree, features))
        const counts = {}
        predictions.forEach(pred => {
            counts[pred] = (counts[pred] || 0) + 1
        })
        const maxCount = Math.max(...Object.values(counts))
        return (maxCount / this.nTrees) * 100
    }
}

// Main workout time prediction service
class WorkoutTimePredictor {
    constructor() {
        this.forest = new RandomForest(15, 8)
        this.featureNames = [
            'age', 'weight', 'height', 'fitnessLevel', 'energyLevel', 'sleepQuality', 'stressLevel',
            'workStartHour', 'workEndHour', 'commuteTime', 'preferredWorkoutTime',
            'gymOpenHour', 'gymCloseHour', 'crowdLevel', 'equipmentAvailability',
            'trainerAvailable', 'pastSuccessRate',
            'dayOfWeek', 'month', 'isWeekend', 'temperature', 'weather', 'isHoliday'
        ]
    }

    // Encode categorical variables
    encodeCategorical(value, categories) {
        return categories.indexOf(value)
    }

    // Extract features from user data
    extractFeatures(user, workSchedule, gymHours, crowdData, trainerData, date) {
        const features = []

        // Personal factors (7 features)
        features.push(user.age || 30)
        features.push(user.weight || 70)
        features.push(user.height || 170)
        features.push(this.encodeCategorical(user.currentFitnessLevel || 'Beginner', ['Beginner', 'Intermediate', 'Advanced']))
        features.push(this.encodeCategorical(user.energyLevel || 'Medium', ['Low', 'Medium', 'High']))
        features.push(this.encodeCategorical(user.sleepQuality || 'Good', ['Poor', 'Fair', 'Good', 'Excellent']))
        features.push(this.encodeCategorical(user.stressLevel || 'Medium', ['Low', 'Medium', 'High']))

        // Work schedule (4 features)
        const workStartHour = parseInt(workSchedule.workStartTime?.split(':')[0]) || 9
        const workEndHour = parseInt(workSchedule.workEndTime?.split(':')[0]) || 17
        features.push(workStartHour)
        features.push(workEndHour)
        features.push(workSchedule.commuteTime || 30)
        features.push(this.encodeCategorical(workSchedule.preferredWorkoutTime || 'Evening', ['Morning', 'Afternoon', 'Evening', 'Night']))

        // Gym factors (4 features)
        const gymOpenHour = parseInt(gymHours.openTime?.split(':')[0]) || 6
        const gymCloseHour = parseInt(gymHours.closeTime?.split(':')[0]) || 22
        features.push(gymOpenHour)
        features.push(gymCloseHour)
        features.push(this.encodeCategorical(crowdData.crowdLevel || 'Medium', ['Low', 'Medium', 'High', 'Peak']))
        features.push(this.encodeCategorical(crowdData.equipmentAvailability || 'Medium', ['Low', 'Medium', 'High']))

        // Trainer factors (1 feature)
        features.push(trainerData.available ? 1 : 0)

        // Historical data (1 feature)
        features.push(crowdData.pastSuccessRate || 75)

        // Temporal factors (6 features)
        const dayOfWeek = date.getDay()
        const month = date.getMonth()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        features.push(dayOfWeek)
        features.push(month)
        features.push(isWeekend ? 1 : 0)
        features.push(25) // temperature placeholder
        features.push(0)  // weather placeholder (0 = sunny)
        features.push(0)  // holiday placeholder

        return features
    }

    // Generate available time slots
    generateTimeSlots(gymOpenHour, gymCloseHour, workStartHour, workEndHour, commuteTime) {
        const slots = []
        const slotDuration = 60 // 1 hour slots

        for (let hour = gymOpenHour; hour < gymCloseHour; hour++) {
            const slotStart = hour
            const slotEnd = hour + 1

            // Check if slot conflicts with work schedule
            const conflictsWithWork = (slotStart >= workStartHour && slotStart < workEndHour) ||
                (slotEnd > workStartHour && slotEnd <= workEndHour)

            // Check if slot conflicts with commute time
            const conflictsWithCommute = (slotStart >= workStartHour - commuteTime / 60 && slotStart < workStartHour) ||
                (slotEnd > workEndHour && slotEnd <= workEndHour + commuteTime / 60)

            if (!conflictsWithWork && !conflictsWithCommute) {
                slots.push({
                    startTime: `${slotStart.toString().padStart(2, '0')}:00`,
                    endTime: `${slotEnd.toString().padStart(2, '0')}:00`,
                    hour: slotStart
                })
            }
        }

        return slots
    }

    // Main prediction method
    async predictOptimalTime(userId, date) {
        try {
            // Get user data
            const user = await User.findById(userId)
            if (!user) {
                throw new Error('User not found')
            }

            // Get historical data
            const historicalData = await this.getHistoricalData(userId)
            const crowdPatterns = await this.getCrowdPatterns(date)

            // Gym configuration
            const gymHours = {
                openTime: "06:00",
                closeTime: "22:00"
            }

            // Generate available time slots
            const availableSlots = this.generateTimeSlots(
                parseInt(gymHours.openTime.split(':')[0]),
                parseInt(gymHours.closeTime.split(':')[0]),
                parseInt(user.workSchedule?.workStartTime?.split(':')[0]) || 9,
                parseInt(user.workSchedule?.workEndTime?.split(':')[0]) || 17,
                user.workSchedule?.commuteTime || 30
            )

            if (availableSlots.length === 0) {
                throw new Error('No available time slots found')
            }

            // Evaluate each slot
            const slotEvaluations = []
            for (const slot of availableSlots) {
                const crowdLevel = this.calculateCrowdLevel(historicalData, date.getDay(), slot.hour)
                const equipmentAvailability = this.getEquipmentAvailability(crowdLevel)
                const trainerAvailable = await this.getTrainerAvailability(user.assignedTrainer, date)

                const crowdData = {
                    crowdLevel,
                    equipmentAvailability,
                    pastSuccessRate: historicalData.successRate || 75
                }

                const trainerData = {
                    available: trainerAvailable
                }

                const features = this.extractFeatures(
                    user,
                    user.workSchedule || { workStartTime: "09:00", workEndTime: "17:00", commuteTime: 30, preferredWorkoutTime: "Evening" },
                    gymHours,
                    crowdData,
                    trainerData,
                    date
                )

                // Get prediction and confidence
                const prediction = this.forest.predict(features)
                const confidence = this.forest.getConfidence(features)

                slotEvaluations.push({
                    slot,
                    prediction,
                    confidence,
                    crowdLevel,
                    equipmentAvailability,
                    trainerAvailable,
                    reason: this.generateReason(slot, crowdData)
                })
            }

            // Sort by confidence and select optimal slot
            slotEvaluations.sort((a, b) => b.confidence - a.confidence)
            const optimalSlot = slotEvaluations[0]

            // Get alternative slots
            const alternativeSlots = slotEvaluations.slice(1, 4).map(evaluation => ({
                startTime: evaluation.slot.startTime,
                endTime: evaluation.slot.endTime,
                confidence: evaluation.confidence,
                reason: evaluation.reason
            }))

            return {
                optimalSlot: {
                    startTime: optimalSlot.slot.startTime,
                    endTime: optimalSlot.slot.endTime,
                    duration: 60,
                    confidence: optimalSlot.confidence
                },
                alternativeSlots,
                factors: {
                    crowdLevel: optimalSlot.crowdLevel,
                    equipmentAvailability: optimalSlot.equipmentAvailability,
                    trainerAvailable: optimalSlot.trainerAvailable
                }
            }
        } catch (error) {
            console.error('Error in predictOptimalTime:', error)
            throw error
        }
    }

    // Get historical attendance data
    async getHistoricalData(userId) {
        try {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const attendance = await Attendance.find({
                user: userId,
                date: { $gte: thirtyDaysAgo }
            })

            const totalSessions = attendance.length
            const completedSessions = attendance.filter(a => a.checkOutTime).length
            const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 75

            return {
                totalSessions,
                completedSessions,
                successRate,
                attendance
            }
        } catch (error) {
            console.error('Error getting historical data:', error)
            return {
                totalSessions: 0,
                completedSessions: 0,
                successRate: 75,
                attendance: []
            }
        }
    }

    // Get crowd patterns for a specific date
    async getCrowdPatterns(date) {
        try {
            const dayOfWeek = date.getDay()
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            // Get attendance data for the same day of week over the past 30 days
            const attendance = await Attendance.find({
                date: {
                    $gte: thirtyDaysAgo,
                    $lt: date
                }
            })

            // Calculate hourly crowd levels
            const hourlyCrowdLevels = {}
            for (let hour = 6; hour < 22; hour++) {
                const hourAttendance = attendance.filter(a => {
                    const checkInHour = new Date(a.checkInTime).getHours()
                    return checkInHour === hour
                }).length

                hourlyCrowdLevels[hour] = hourAttendance / 4 // Average over 4 weeks
            }

            return {
                hourlyCrowdLevels,
                dayOfWeek
            }
        } catch (error) {
            console.error('Error getting crowd patterns:', error)
            return {
                hourlyCrowdLevels: {},
                dayOfWeek: date.getDay()
            }
        }
    }

    // Calculate crowd level for a specific hour
    calculateCrowdLevel(historicalData, dayOfWeek, hour) {
        const avgAttendance = historicalData.hourlyCrowdLevels?.[hour] || 5

        if (avgAttendance < 10) return 'Low'
        if (avgAttendance < 25) return 'Medium'
        if (avgAttendance < 40) return 'High'
        return 'Peak'
    }

    // Get equipment availability based on crowd level
    getEquipmentAvailability(crowdLevel) {
        switch (crowdLevel) {
            case 'Low': return 'High'
            case 'Medium': return 'Medium'
            case 'High': return 'Low'
            case 'Peak': return 'Low'
            default: return 'Medium'
        }
    }

    // Get trainer availability
    async getTrainerAvailability(trainerId, date) {
        if (!trainerId) return false

        try {
            const trainer = await Trainer.findById(trainerId)
            if (!trainer) return false

            const dayOfWeek = date.getDay()
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            const dayName = dayNames[dayOfWeek]

            const daySchedule = trainer.schedule?.find(s => s.day === dayName)
            if (!daySchedule) return false

            const currentHour = date.getHours()
            const startHour = parseInt(daySchedule.startTime.split(':')[0])
            const endHour = parseInt(daySchedule.endTime.split(':')[0])

            return currentHour >= startHour && currentHour < endHour
        } catch (error) {
            console.error('Error getting trainer availability:', error)
            return false
        }
    }

    // Predict crowd level for a specific hour
    predictCrowdLevel(hour, crowdData) {
        const avgAttendance = crowdData.hourlyCrowdLevels?.[hour] || 5
        if (avgAttendance < 10) return 'Low'
        if (avgAttendance < 25) return 'Medium'
        if (avgAttendance < 40) return 'High'
        return 'Peak'
    }

    // Predict equipment availability
    predictEquipmentAvailability(hour, crowdData) {
        const crowdLevel = this.predictCrowdLevel(hour, crowdData)
        return this.getEquipmentAvailability(crowdLevel)
    }

    // Generate reason for recommendation
    generateReason(slot, crowdData) {
        const hour = slot.hour
        let reason = ""

        if (hour < 10) {
            reason += "Early morning workout for metabolism boost. "
        } else if (hour >= 17) {
            reason += "Evening workout for stress relief. "
        } else {
            reason += "Mid-day workout for energy maintenance. "
        }

        if (crowdData.crowdLevel === 'Low') {
            reason += "Minimal crowds expected. "
        } else if (crowdData.crowdLevel === 'Peak') {
            reason += "High energy environment with peak activity. "
        }

        if (crowdData.equipmentAvailability === 'High') {
            reason += "All equipment should be available. "
        }

        return reason.trim()
    }

    // Train the model with historical data
    async trainModel() {
        try {
            // Get all completed predictions
            const predictions = await Prediction.find({ isCompleted: true })

            if (predictions.length < 50) {
                console.log('Insufficient training data. Need at least 50 completed predictions.')
                return false
            }

            // Prepare training data
            const trainingData = []
            for (const prediction of predictions) {
                const user = await User.findById(prediction.user)
                if (!user) continue

                const features = this.extractFeatures(
                    user,
                    prediction.userFactors.workSchedule,
                    prediction.gymFactors.gymHours,
                    { crowdLevel: prediction.gymFactors.crowdLevel },
                    { available: prediction.trainerFactors.trainerAvailability?.availableSlots?.length > 0 },
                    prediction.predictedDate
                )

                // Add actual workout time as target
                const actualHour = parseInt(prediction.actualWorkout.startTime.split(':')[0])
                features.push(actualHour)

                trainingData.push(features)
            }

            // Train the model
            this.forest.train(trainingData)
            console.log(`Model trained with ${trainingData.length} samples`)
            return true
        } catch (error) {
            console.error('Error training model:', error)
            return false
        }
    }
}

// Export singleton instance
export const workoutTimePredictor = new WorkoutTimePredictor() 
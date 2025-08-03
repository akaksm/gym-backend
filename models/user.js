import mongoose from 'mongoose'
import { type } from 'os'

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            // unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            // minlength: 6,
            trim: true
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other']
        },
        profileImage: {
            type: String,
            default: 'default-profile.png'
        },
        membership: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Membership'
        },
        assignedTrainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trainer' // Now references the Trainer model
        },
        age: Number,
        height: Number,
        weight: Number,
        fitnessGoal: {
            type: String,
            enum: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility', 'General Fitness'],
            default: 'General Fitness'
        },
        medicalConditions: {
            type: String,
            default: 'None'
        },
        emailVerified: {
            type: Boolean,
            default: false
        },
        otp: String,
        otpExpiry: Date,
        forgotPassword: {
            otp: String,
            otpExpiry: Date,
            isVerified: {
                type: Boolean,
                default: false
            }
        },
        fingerprintTemplate: {
            type: String,
            unique: true,
            sparse: true
        },
        isFingerprintEnrolled: {
            type: Boolean,
            default: false
        },
        lastEnrollmentAttempt: Date,
        isDeleted: {
            type: Boolean,
            default: false
        },
        // Work schedule for optimal workout prediction
        workSchedule: {
            workStartTime: {
                type: String,
                default: "09:00"
            },
            workEndTime: {
                type: String,
                default: "17:00"
            },
            commuteTime: {
                type: Number,
                default: 30 // in minutes
            },
            preferredWorkoutTime: {
                type: String,
                enum: ['Morning', 'Afternoon', 'Evening', 'Night'],
                default: 'Evening'
            }
        },
        // Personal factors for ML prediction
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
        },
        currentFitnessLevel: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner'
        }
    },
    { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
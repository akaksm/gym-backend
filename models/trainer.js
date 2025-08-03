import mongoose from 'mongoose'

const trainerSchema = new mongoose.Schema(
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
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            trim: true
        },
        profileImage: {
            type: String,
            default: 'default-trainer.png'
        },
        specialization: {
            type: [String],
            enum: [
                'Weight Training', 'Cardio', 'Yoga', 'Pilates',
                'CrossFit', 'Martial Arts', 'Nutrition', 'Rehabilitation'
            ],
            default: []
        },
        certification: String,
        experience: {
            type: Number,
            default: 0
        },
        hourlyRate: Number,
        bio: String,
        clients: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        schedule: [{
            day: {
                type: String,
                enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            },
            startTime: String,
            endTime: String,
            client: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }],
        emailVerified: {
            type: Boolean,
            default: false
        },
        otp: {
            type: String,
            default: null
        },
        otpExpiry: {
            type: Date,
            default: null
        },
        forgotPassword: {
            otp: {
                type: String,
                default: null
            },
            otpExpiry: {
                type: Date,
                default: null
            },
            isVerified: {
                type: Boolean,
                default: false
            }
        }
    },
    { timestamps: true }
)

export const Trainer = mongoose.model('Trainer', trainerSchema)
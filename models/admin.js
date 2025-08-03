import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
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
            default: 'default-admin.png'
        },
        role: {
            type: String,
            default: 'admin',
            enum: ['admin']
        },
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

export const Admin = mongoose.model('Admin', adminSchema) 
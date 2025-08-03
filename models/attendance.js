import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    checkInTime: {
        type: Date
    },
    checkOutTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['present', 'absent'],
        default: 'present'
    },
    verificationMethod: {
        type: String,
        enum: ['fingerprint', 'manual', 'card'],
        default: 'fingerprint'
    },
    deviceId: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
})

attendanceSchema.index({ user: 1, date: 1 }, { unique: true })

export const Attendance = mongoose.model('Attendance', attendanceSchema)

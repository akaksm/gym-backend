import mongoose, { mongo } from "mongoose"

const membershipTypeSchema = new mongoose.Schema({
    title: {
        type: String,
        enum: [
            'Daily', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'Three-Year', 'Five-Year', 'Ten-Year', 'Lifetime'
        ],
        required: true,
        unique: true
    },
    priceNRS: {
        type: Number,
        required: true
    },
    durationInDays: Number,
    durationInMonths: Number,
    isCalendarBased: {
        type: Boolean,
        default: false
    },
    excludeSaturdays: {
        type: Boolean,
        default: false
    },
    accessStartTime: {
        type: String,
        default: '05:00'
    },
    accessEndTime: {
        type: String,
        default: '20:30'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: false
})

export const MembershipType = mongoose.model('MembershipType', membershipTypeSchema)
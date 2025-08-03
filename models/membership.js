import mongoose from "mongoose"

const membershipSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        membershipType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MembershipType',
            required: true
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Completed', 'Unpaid', 'Refunded'],
            default: 'Pending'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment'
        }
    }, {
    timestamps: true,
    versionKey: false
}
)

export const Membership = mongoose.model('Membership', membershipSchema)
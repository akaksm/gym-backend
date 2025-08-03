import mongoose from 'mongoose'
import encrypt from 'mongoose-encryption'

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    membership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Membership',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'NPR'
    },
    paymentMethod: {
        type: String,
        enum: ['khalti', 'cash', 'card'],
        default: 'khalti'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    // Khalti specific fields
    khaltiTransactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    khaltiPaymentUrl: {
        type: String
    },
    khaltiPaymentToken: {
        type: String
    },
    // Transaction details
    transactionId: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        default: 'Membership payment'
    },
    // Payment metadata
    paymentDate: {
        type: Date,
        default: Date.now
    },
    completedDate: {
        type: Date
    },
    refundDate: {
        type: Date
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    // Error handling
    errorMessage: {
        type: String
    },
    errorCode: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: false
})

// Generate unique transaction ID
paymentSchema.pre('save', async function (next) {
    if (!this.transactionId) {
        this.transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }
    next()
})

// // Add encryption plugin (MUST come before model creation)
// paymentSchema.plugin(encrypt, {
//     encryptionKey: process.env.DB_ENCRYPTION_KEY,
//     signingKey: process.env.DB_SIGNING_KEY,
//     encryptedFields: ['khaltiPaymentToken', 'khaltiTransactionId']
// });

export const Payment = mongoose.model('Payment', paymentSchema) 
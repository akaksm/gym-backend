import axios from 'axios'
import { ApiError } from './ApiError.js'

const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL || 'https://a.khalti.com/api/v2'
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY
const KHALTI_PUBLIC_KEY = process.env.KHALTI_PUBLIC_KEY

// Initialize Khalti payment
export const initiateKhaltiPayment = async (paymentData) => {
    try {
        const payload = {
            public_key: KHALTI_PUBLIC_KEY,
            amount: paymentData.amount * 100, // Khalti expects amount in paisa
            product_identity: paymentData.transactionId,
            product_name: paymentData.description,
            customer_info: {
                name: paymentData.userName,
                email: paymentData.userEmail,
                phone: paymentData.userPhone
            },
            amount_breakdown: {
                subtotal: paymentData.amount * 100,
                tax: 0,
                shipping: 0,
                discount: 0
            },
            customer_details: {
                customer_name: paymentData.userName,
                customer_email: paymentData.userEmail,
                customer_phone: paymentData.userPhone
            },
            return_url: `${process.env.FRONTEND_URL}/payment-success`,
            website_url: process.env.FRONTEND_URL
        }

        const response = await axios.post(`${KHALTI_BASE_URL}/epayment/initiate/`, payload, {
            headers: {
                'Authorization': `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        })

        return {
            success: true,
            payment_url: response.data.payment_url,
            token: response.data.token,
            transaction_id: response.data.transaction_id
        }
    } catch (error) {
        console.error('Khalti payment initiation error:', error.response?.data || error.message)
        throw new ApiError('Failed to initiate payment', 500)
    }
}

// Verify Khalti payment
export const verifyKhaltiPayment = async (token) => {
    try {
        const response = await axios.post(`${KHALTI_BASE_URL}/epayment/lookup/`, {
            token: token
        }, {
            headers: {
                'Authorization': `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        })

        return {
            success: true,
            status: response.data.status,
            transaction_id: response.data.transaction_id,
            amount: response.data.amount,
            data: response.data
        }
    } catch (error) {
        console.error('Khalti payment verification error:', error.response?.data || error.message)
        throw new ApiError('Failed to verify payment', 500)
    }
}

// Refund Khalti payment
export const refundKhaltiPayment = async (transactionId, amount) => {
    try {
        const response = await axios.post(`${KHALTI_BASE_URL}/epayment/refund/`, {
            transaction_id: transactionId,
            amount: amount * 100, // Convert to paisa
            refund_type: 'full' // or 'partial'
        }, {
            headers: {
                'Authorization': `Key ${KHALTI_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        })

        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('Khalti refund error:', error.response?.data || error.message)
        throw new ApiError('Failed to process refund', 500)
    }
} 
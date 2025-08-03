// middleware/verifyKhaltiWebhook.js
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import crypto from 'crypto'


export const verifyKhaltiWebhook = asyncHandler(async (req, res, next) => {
    const khaltiSecret = req.headers['x-khalti-secret']
    const payload = JSON.stringify(req.body)

    const expectedSignature = crypto
        .createHmac('sha256', process.env.KHALTI_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex')

    if (khaltiSecret !== expectedSignature) {
        throw new ApiError(403, "Invalid webhook signature")
    }
    next()
})


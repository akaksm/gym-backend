import nodemailer from 'nodemailer'
import { asyncHandler } from './asyncHandler.js'

export const sendEmail = asyncHandler(async (options) => {
    var transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })

    const mailOptions = {
        from: options.from /*process.env.SMTP_HOST*/,
        to: options.to,
        subject: options.subject,
        // text: options.text,
        html: options.html
    }

    await transport.sendMail(mailOptions)
})
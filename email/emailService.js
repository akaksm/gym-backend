import { sendEmail } from "../utils/setEmail.js"

export const sendVerificationEmail = async (user) => {
    // console.log(user?.email)
    const options = {
        from: "no-reply@gym.com",
        to: user.email,
        subject: "Email Verification OTP",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Our Platform</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f8f9fa;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: #007bff;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 20px;
                        text-align: center;
                    }
                    .content p {
                        font-size: 16px;
                        color: #333;
                        margin: 10px 0;
                    }
                    .otp-box {
                        display: inline-block;
                        background: #f1f1f1;
                        padding: 12px 20px;
                        font-size: 20px;
                        font-weight: bold;
                        letter-spacing: 4px;
                        border-radius: 5px;
                        margin: 15px 0;
                        color: #007bff;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background: #007bff;
                        color: white;
                        text-decoration: none;
                        font-size: 16px;
                        font-weight: bold;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    .footer {
                        text-align: center;
                        font-size: 14px;
                        color: #555;
                        padding: 15px;
                        background: #f1f1f1;
                        border-top: 1px solid #ddd;
                    }
                    /* Responsive Design */
                    @media (max-width: 600px) {
                        .content {
                            padding: 15px;
                        }
                        .header {
                            font-size: 20px;
                            padding: 15px;
                        }
                        .otp-box {
                            font-size: 18px;
                            padding: 10px 18px;
                        }
                        .button {
                            font-size: 14px;
                            padding: 10px 20px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        Welcome to Our Platform
                    </div>
                    <div class="content">
                        <p>Hello ${user.name},</p>
                        <p>Thank you for registering with us! To complete your registration, please use the following OTP:</p>
                        <div class="otp-box">${user.otp}</div>
                        <p>This OTP will expire in 10 minutes.</p>
                        <p>If you didn't create an account, please ignore this email.</p>
                        <a href="${process.env.FRONTEND_URL}/verify-email" class="button">Verify Email</a>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                        <p>&copy; 2024 Our Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    await sendEmail(options)
}

export const sendForgetPasswordVerificationEmail = async (user) => {
    const options = {
        from: "no-reply@gym.com",
        to: user.email,
        subject: "Password Reset OTP",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f8f9fa;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: #dc3545;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 20px;
                        text-align: center;
                    }
                    .content p {
                        font-size: 16px;
                        color: #333;
                        margin: 10px 0;
                    }
                    .otp-box {
                        display: inline-block;
                        background: #f1f1f1;
                        padding: 12px 20px;
                        font-size: 20px;
                        font-weight: bold;
                        letter-spacing: 4px;
                        border-radius: 5px;
                        margin: 15px 0;
                        color: #dc3545;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background: #dc3545;
                        color: white;
                        text-decoration: none;
                        font-size: 16px;
                        font-weight: bold;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    .footer {
                        text-align: center;
                        font-size: 14px;
                        color: #555;
                        padding: 15px;
                        background: #f1f1f1;
                        border-top: 1px solid #ddd;
                    }
                    /* Responsive Design */
                    @media (max-width: 600px) {
                        .content {
                            padding: 15px;
                        }
                        .header {
                            font-size: 20px;
                            padding: 15px;
                        }
                        .otp-box {
                            font-size: 18px;
                            padding: 10px 18px;
                        }
                        .button {
                            font-size: 14px;
                            padding: 10px 20px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        Password Reset Request
                    </div>
                    <div class="content">
                        <p>Hello ${user.name},</p>
                        <p>We received a request to reset your password. Use the following OTP to reset your password:</p>
                        <div class="otp-box">${user.forgotPassword.otp}</div>
                        <p>This OTP will expire in 10 minutes.</p>
                        <p>If you didn't request a password reset, please ignore this email.</p>
                        <a href="${process.env.FRONTEND_URL}/reset-password" class="button">Reset Password</a>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                        <p>&copy; 2024 Our Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    await sendEmail(options)
}

export const sendWelcomeEmail = async (user) => {
    const options = {
        from: "no-reply@gym.com",
        to: user.email,
        subject: "Welcome to Our Platform!",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome!</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f8f9fa;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                    }
                    .header {
                        background: #28a745;
                        color: white;
                        text-align: center;
                        padding: 20px;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 20px;
                        text-align: center;
                    }
                    .content p {
                        font-size: 16px;
                        color: #333;
                        margin: 10px 0;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background: #28a745;
                        color: white;
                        text-decoration: none;
                        font-size: 16px;
                        font-weight: bold;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    .footer {
                        text-align: center;
                        font-size: 14px;
                        color: #555;
                        padding: 15px;
                        background: #f1f1f1;
                        border-top: 1px solid #ddd;
                    }
                    /* Responsive Design */
                    @media (max-width: 600px) {
                        .content {
                            padding: 15px;
                        }
                        .header {
                            font-size: 20px;
                            padding: 15px;
                        }
                        .button {
                            font-size: 14px;
                            padding: 10px 20px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        Welcome to Our Platform!
                    </div>
                    <div class="content">
                        <p>Hello ${user.name},</p>
                        <p>Welcome to our platform! Your account has been successfully verified.</p>
                        <p>You can now access all features and start your fitness journey with us.</p>
                        <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
                    </div>
                    <div class="footer">
                        <p>Thank you for choosing our platform!</p>
                        <p>&copy; 2024 Our Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }

    await sendEmail(options)
}
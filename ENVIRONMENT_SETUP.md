# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/gym_management
DATABASE=mongodb://localhost:27017/gym_management

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Khalti Payment Gateway Configuration
KHALTI_BASE_URL=https://a.khalti.com/api/v2
KHALTI_SECRET_KEY=your_khalti_secret_key_here
KHALTI_PUBLIC_KEY=your_khalti_public_key_here
KHALTI_WEBHOOK_SECRET=your_khalti_webhook_secret_here

# Database Encryption (Optional)
DB_ENCRYPTION_KEY=your_encryption_key_here_32_characters
DB_SIGNING_KEY=your_signing_key_here_64_characters

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./public/uploads

# Fingerprint Device Configuration
FINGERPRINT_DEVICE_IP=192.168.1.100
FINGERPRINT_DEVICE_PORT=4370
FINGERPRINT_DEVICE_ID=DEVICE_001
FINGERPRINT_DEVICE_TYPE=zkteco
FINGERPRINT_DEVICE_TIMEOUT=5000
FINGERPRINT_DEBUG=false

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Setup Instructions

1. **Copy the above variables** to your `.env` file
2. **Replace placeholder values** with your actual configuration
3. **Generate secure keys** for JWT and encryption
4. **Set up MongoDB** database
5. **Configure email service** (Gmail recommended)
6. **Get Khalti credentials** from their developer portal

## Security Notes

- Use strong, unique secrets for JWT and encryption
- Never commit `.env` file to version control
- Use different values for development and production
- Regularly rotate sensitive keys 
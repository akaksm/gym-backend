# Gym Management System - Backend

A comprehensive backend API for gym management with attendance tracking, payment processing, and workout time prediction.

## 🚀 Features

### Core Features
- **User Management**: Registration, authentication, profile management
- **Trainer Management**: Trainer profiles, scheduling, client assignment
- **Membership System**: Multiple membership types, payment processing
- **Attendance Tracking**: Fingerprint and manual attendance recording
- **Payment Integration**: Khalti wallet integration for Nepal
- **Workout Prediction**: AI-powered workout time prediction
- **Admin Dashboard**: Comprehensive admin controls

### Technical Features
- **RESTful API**: Well-structured endpoints
- **Authentication**: JWT-based authentication
- **File Upload**: Profile image handling
- **Email Service**: OTP verification and notifications
- **Security**: Helmet, CORS, input validation
- **Database**: MongoDB with Mongoose ODM

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## 🔧 Configuration

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed configuration instructions.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/verify-otp` - Email verification

### User Management
- `GET /api/users/dashboard` - User dashboard
- `PUT /api/users/profile` - Update profile
- `POST /api/users/change-password` - Change password

### Trainer Management
- `GET /api/trainers` - Get all trainers
- `GET /api/trainers/:id` - Get trainer details
- `POST /api/trainers/assign` - Assign trainer to user

### Membership
- `GET /api/membership-types` - Get membership plans
- `POST /api/memberships/create` - Create membership
- `GET /api/memberships/user/:userId` - Get user membership

### Payment (Khalti)
- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/verify` - Verify payment
- `POST /api/payments/webhook/khalti` - Khalti webhook

### Attendance
- `POST /api/attendance/enroll-fingerprint` - Enroll fingerprint
- `POST /api/attendance/fingerprint-attendance` - Record attendance
- `POST /api/attendance/manual` - Manual attendance
- `GET /api/attendance/today` - Today's attendance

### Workout Prediction
- `POST /api/predictions/generate/:userId` - Generate prediction
- `PUT /api/predictions/:predictionId` - Update prediction
- `GET /api/predictions/user/:userId` - Get user predictions

## 🗄️ Database Models

- **User**: Member information and preferences
- **Trainer**: Trainer profiles and schedules
- **Membership**: User membership details
- **MembershipType**: Available membership plans
- **Payment**: Payment records and transactions
- **Attendance**: Attendance tracking records
- **Prediction**: Workout time predictions
- **Admin**: Admin user management

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Rate limiting (configurable)
- File upload validation

## 📧 Email Integration

- OTP verification emails
- Password reset emails
- Welcome emails
- Notification emails

## 💳 Payment Integration

- Khalti wallet integration
- Webhook verification
- Payment status tracking
- Refund processing

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Checklist
- [ ] Set production environment variables
- [ ] Configure MongoDB Atlas
- [ ] Set up SSL certificate
- [ ] Configure domain and DNS
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures
- [ ] Test all endpoints
- [ ] Set up CI/CD pipeline

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
FRONTEND_URL=https://yourdomain.com
```

## 📁 Project Structure

```
Backend/
├── controller/          # Route controllers
├── models/             # Database models
├── routes/             # API routes
├── middleware/         # Custom middleware
├── utils/              # Utility functions
├── database/           # Database connection
├── email/              # Email services
├── public/             # Static files
├── server.js           # Main server file
└── package.json        # Dependencies
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the guides in the docs folder
- Create an issue in the repository

## 🔄 Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added attendance system
- **v1.2.0**: Added payment integration
- **v1.3.0**: Added workout prediction 
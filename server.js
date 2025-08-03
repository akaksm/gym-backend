import express from 'express' // Importing express to create a web server
import dotenv from 'dotenv' // Importing dotenv to manage environment variables
import connectDB from './database/connection.js' // Importing the database connection module
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { errorMiddleware, notFound } from './middleware/errorMiddleware.js'

dotenv.config() // Load environment variables from .env file
await connectDB() // Establish a connection to the database

import userRouter from './routes/userRoute.js'
import trainerRouter from './routes/trainerRoute.js'
import adminRouter from './routes/adminRoute.js'
import attendanceRouter from './routes/attendanceRoute.js'
import membershipRouter from './routes/membershipRoute.js'
import membershipTypeRouter from './routes/membershipTypeRoute.js'
import paymentRouter from './routes/paymentRoute.js'
import predictionRouter from './routes/predictionRoute.js'

// 2. APP INITIALIZATION

const app = express() // Create an instance of express
const { PORT = 3000 } = process.env // Set the port from environment variables or default to 3000

// 3. GLOBAL MIDDLEWARE

// Security middleware
app.use(helmet())
app.use(morgan('combined'))

app.use(express.json()) // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })) // Middleware to parse URL-encoded request bodies
app.use('/api/image', express.static('./public/uploads'))
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['POST', 'PUT', 'GET', 'DELETE'],
  credentials: true
}))

// 4. ROUTE HANDLING
app.use('/api/users', userRouter)
app.use('/api/trainers', trainerRouter)
app.use('/api/admins', adminRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/memberships', membershipRouter)
app.use('/api/membership-types', membershipTypeRouter)
app.use('/api/payments', paymentRouter)
app.use('/api/predictions', predictionRouter)

// 5. ERROR HANDLING MIDDLEWARE
app.use(notFound)
app.use(errorMiddleware)

// 6. SERVER LISTENING
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`) // Log a message when the server starts
})
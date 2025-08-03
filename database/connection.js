// database/connection.js (ES Module)

import mongoose from 'mongoose'

// Optional: recommended setting for  MongoDB 6+
mongoose.set('strictQuery', false)

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE)

    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

export default connectDB
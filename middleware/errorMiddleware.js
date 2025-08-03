// middleware/errorMiddleware.js

// 404 Not Found Error Middleware
const notFound = (req, res, next) => {
  const error = new Error(`Route Not Found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

// General Error Middleware
const errorMiddleware = (error, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode
    res.status(statusCode).json({
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    })
}

// ES Module Export
export {notFound, errorMiddleware}
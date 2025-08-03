import multer from 'multer'
import path from 'path'
import { ApiError } from '../utils/apiError.js'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },

    filename: function (req, file, cb) {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname))
    }
})

export const upload = multer({ storage: storage })

export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) throw new ApiError(err.message, 400)
    else if (err) throw new ApiError(err.message, 400)
    next()
}


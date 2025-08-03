import jwt from 'jsonwebtoken'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.js'
import { ApiError } from '../utils/ApiError.js'
import { Trainer } from '../models/trainer.js'
import { Admin } from '../models/admin.js'
import { Membership } from '../models/membership.js'

export const authMiddleware = asyncHandler(async (req, res, next) => {
    const datatoken = req.header('Authorization')?.replace('Bearer ', '')
    if (!datatoken) throw new ApiError(`Token is not available`, 400)
    const data = jwt.verify(datatoken, process.env.JWT_SECRET)
    const user = await User.findById(data.id)
    req.user = user
    next()
})

export const trainerAuthMiddleware = asyncHandler(async (req, res, next) => {
    const datatoken = req.header('Authorization')?.replace('Bearer ', '')
    if (!datatoken) throw new ApiError(`Token is not available`, 400)
    const data = jwt.verify(datatoken, process.env.JWT_SECRET)
    const trainer = await Trainer.findById(data.id)
    req.trainer = trainer
    next()
})

export const adminAuthMiddleware = asyncHandler(async (req, res, next) => {
    const datatoken = req.header('Authorization')?.replace('Bearer ', '')
    if (!datatoken) throw new ApiError(`Token is not available`, 400)
    const data = jwt.verify(datatoken, process.env.JWT_SECRET)
    const admin = await Admin.findById(data.id)
    req.admin = admin
    next()
})

export const checkExpiredMembership = asyncHandler(async (req, res, next) => {
    const membership = await Membership.findById(req.params.id)
    if (!membership) throw new ApiError(`Membership not found`, 400)

    req.isExpired = membership.endDate < new Date()
    req.membership = membership
    next()
})
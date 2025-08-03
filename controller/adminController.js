import { Admin } from "../models/admin.js"
import { User } from "../models/user.js"
import { Trainer } from "../models/trainer.js"
import { Membership } from "../models/membership.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import bcrypt from 'bcrypt'
import { generateOTP } from "../utils/generateOTP.js"
import { sendVerificationEmail, sendForgetPasswordVerificationEmail } from "../email/emailService.js"
import { generateToken } from "../utils/generateToken.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// Admin registration (optional, can be restricted to initial setup)
export const registerAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword, phone } = req.body
    if (!name || !email || !password || !confirmPassword || !phone) {
        throw new ApiError(`All the fields are required.`, 400)
    }
    if (password !== confirmPassword) throw new ApiError(`Passwords do not match`, 400)
    const existingAdmin = await Admin.findOne({ email: email })
    if (existingAdmin) throw new ApiError(`Admin with this email already exists`, 400)
    const existingPhone = await Admin.findOne({ phone: phone })
    if (existingPhone) throw new ApiError(`Admin with this phone number already exists`, 400)
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const otp = generateOTP()
    const otpExpiry = Date.now() + 10 * 60 * 1000
    const admin = await Admin.create({
        ...req.body,
        password: hashedPassword,
        otp,
        otpExpiry
    })
    sendVerificationEmail(admin)
    return res.status(201).json(new ApiResponse(`Admin registered successfully`, admin))
})

// Admin login
export const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) throw new ApiError(`Email or password are required.`, 400)
    const admin = await Admin.findOne({ email: email })
    if (!admin) throw new ApiError(`Email is not registered.`, 400)
    const comparepassword = await bcrypt.compare(password, admin.password)
    if (!comparepassword) throw new ApiError(`Wrong password.`, 400)
    if (!admin.emailVerified) throw new ApiError(`Please verify your email.`, 400)
    const data = {
        id: admin._id,
        email: admin.email
    }
    const token = generateToken(data)
    const showdata = await Admin.findById(admin._id).select('-password')
    return res.json({ token, data: showdata })
})

// Verify OTP for admin
export const verifyAdminOTP = asyncHandler(async (req, res) => {
    let { email, otp } = req.body
    if (!email || !otp) throw new ApiError(`OTP is required.`, 400)
    const admin = await Admin.findOne({ email: email })
    if (!admin) throw new ApiError(`Invalid OTP.`, 400)
    if (admin.otp !== otp) throw new ApiError(`Invalid OTP.`, 400)
    if (admin.otpExpiry < Date.now()) throw new ApiError(`OTP has been expired.`, 400)
    admin.emailVerified = true
    admin.otp = null
    admin.otpExpiry = null
    await admin.save()
    return res.status(200).json(new ApiResponse(`OTP verification successful.`, admin.emailVerified))
})

// Resend OTP for admin
export const resendAdminOTP = asyncHandler(async (req, res) => {
    const { email } = req.body
    const admin = await Admin.findOne({ email: email })
    if (!admin) throw new ApiError(`Email is not registered.`, 400)
    admin.otp = generateOTP()
    admin.otpExpiry = Date.now() + 10 * 60 * 1000
    sendVerificationEmail(admin)
    await admin.save()
    res.status(201).json(new ApiResponse(`New OTP has been sent to your email.`, admin))
})

// Get admin details
export const adminDetails = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin._id).select('-password')
    if (!admin) throw new ApiError(`Unable to find the admin`, 400)
    return res.status(200).json(new ApiResponse(`Admin details`, admin))
})

// Update admin profile
export const updateAdmin = asyncHandler(async (req, res) => {
    const { _id } = req.admin
    const updatableFields = [
        'name',
        'phone'
    ]
    const updates = {}
    updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field]
        }
    })
    if (req.file) {
        updates.profileImage = req.file.filename
    }
    if (updates.phone) {
        const existingAdmin = await Admin.findOne({ phone: updates.phone, _id: { $ne: _id } })
        if (existingAdmin) throw new ApiError(`Phone number already in use.`, 400)
    }
    const updatedAdmin = await Admin.findByIdAndUpdate(_id, updates, { new: true }).select("-password")
    if (!updatedAdmin) throw new ApiError(`Admin not found`, 404)
    return res.status(200).json(new ApiResponse(`Admin updated successfully`, updatedAdmin))
})

// Admin password change
export const adminPasswordChange = asyncHandler(async (req, res) => {
    const { _id } = req.admin
    const { oldpassword, password, confirmPassword } = req.body
    const admin = await Admin.findById(_id)
    if (!admin) throw new ApiError('Something went wrong', 400)
    if (!oldpassword || !password || !confirmPassword) throw new ApiError(`One or more fields are empty`, 400)
    if (password !== confirmPassword) throw new ApiError(`Confirm password and password do not match`, 400)
    const comparepassword = await bcrypt.compare(oldpassword, admin.password)
    if (comparepassword) {
        const hash_password = await bcrypt.hash(password, 10)
        admin.password = hash_password
        await admin.save()
        return res.status(200).json(new ApiResponse(`Password changed successfully.`))
    }
    return res.status(400).json(new ApiResponse(`Old password is incorrect.`))
})

// Admin forget password
export const adminForgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    const admin = await Admin.findOne({ email: email })
    if (!admin) throw new ApiError(`Something went wrong`, 400)
    const otp = generateOTP()
    const otpExpiry = Date.now() + 10 * 60 * 1000
    admin.forgotPassword = {
        otp: otp,
        otpExpiry: otpExpiry,
        isVerified: false
    }
    await admin.save()
    await sendForgetPasswordVerificationEmail(admin)
    return res.status(201).json(new ApiResponse(`Password reset OTP has been sent to your email.`, admin.email))
})

// Admin verify forget password OTP
export const verifyAdminForgetPasswordOTP = asyncHandler(async (req, res) => {
    let { email, otp } = req.body
    if (!email || !otp) throw new ApiError(`OTP is required.`)
    const admin = await Admin.findOne({ email: email })
    if (!admin) throw new ApiError(`Admin not found`, 400)
    if (admin.forgotPassword.otp !== otp) throw new ApiError(`Invalid OTP.`, 400)
    if (admin.forgotPassword.otpExpiry < Date.now()) throw new ApiError(`OTP has been expired`, 400)
    admin.forgotPassword.isVerified = true
    admin.forgotPassword.otp = null
    admin.forgotPassword.otpExpiry = null
    await admin.save()
    return res.status(201).json(new ApiResponse(`OTP verification successful.`, admin.forgotPassword.isVerified))
})

// Admin forget password change
export const adminForgetPasswordChange = asyncHandler(async (req, res) => {
    const { email, password, confirmPassword } = req.body
    if (password !== confirmPassword) throw new ApiError(`Password does not match.`, 400)
    const admin = await Admin.findOne({ email: email })
    if (!admin) throw new ApiError(`Email is not registered`)
    if (!admin.forgotPassword.isVerified) throw new ApiError(`Please verify your OTP first.`, 400)
    const salt = await bcrypt.genSalt(10)
    const hash_password = await bcrypt.hash(password, salt)
    admin.password = hash_password
    await admin.save()
    return res.status(201).json(new ApiResponse(`Password has been changed successfully.`))
})

// Admin dashboard (basic stats)
export const getAdminDashboard = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments()
    const totalTrainers = await Trainer.countDocuments()
    const totalMemberships = await Membership.countDocuments()
    const dashboardData = {
        totalUsers,
        totalTrainers,
        totalMemberships
    }
    return res.status(200).json(new ApiResponse('Admin dashboard data retrieved successfully', dashboardData))
}) 
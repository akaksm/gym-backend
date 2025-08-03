import { Trainer } from "../models/trainer.js"
import { User } from "../models/user.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import bcrypt from 'bcrypt'
import { generateOTP } from "../utils/generateOTP.js"
import { sendVerificationEmail, sendForgetPasswordVerificationEmail } from "../email/emailService.js"
import { generateToken } from "../utils/generateToken.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { isStrongPassword, isValidEmail, isValidName, isValidPhone } from "../utils/validation.js"

// Trainer registration
export const registerTrainer = asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword, phone, specialization } = req.body

    if (!name || !email || !password || !confirmPassword || !phone) {
        throw new ApiError(`All the fields are required.`, 400)
    }
    if (!isValidName(name)) throw new ApiError(`Invalid name.`, 400)
    if (!isValidEmail(email)) throw new ApiError(`Invalid email format.`, 400)
    if (!isStrongPassword(password)) throw new ApiError(`Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.`, 400)
    if (!isValidPhone(phone)) throw new ApiError(`Phone number must be exactly 10 digits.`, 400)
    if (password !== confirmPassword) throw new ApiError(`Passwords do not match`, 400)

    // Check if trainer already exists
    const existingTrainer = await Trainer.findOne({ email: email })
    if (existingTrainer) throw new ApiError(`Trainer with this email already exists`, 400)
    const existingPhone = await Trainer.findOne({ phone: phone })
    if (existingPhone) throw new ApiError(`Trainer with this phone number already exists`, 400)

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const otp = generateOTP()
    const otpExpiry = Date.now() + 10 * 60 * 1000

    const trainer = await Trainer.create({
        ...req.body,
        password: hashedPassword,
        otp,
        otpExpiry,
        specialization: specialization || [],
    })

    sendVerificationEmail(trainer)

    return res.status(201).json(new ApiResponse(`Trainer registered successfully`, trainer))
})

// Trainer login
export const loginTrainer = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) throw new ApiError(`Email or password are required.`, 400)
    const trainer = await Trainer.findOne({ email: email })
    if (!trainer) throw new ApiError(`Email is not registered.`, 400)
    const comparepassword = await bcrypt.compare(password, trainer.password)
    if (!comparepassword) throw new ApiError(`Wrong password.`, 400)
    if (!trainer.emailVerified) throw new ApiError(`Please verify your email.`, 400)

    const data = {
        id: trainer._id,
        email: trainer.email
    }

    const token = generateToken(data)
    const showdata = await Trainer.findById(trainer._id).select('-password')
    return res.json({ token, data: showdata })
})

// Verify OTP for trainer
export const verifyTrainerOTP = asyncHandler(async (req, res) => {
    let { email, otp } = req.body
    if (!email || !otp) throw new ApiError(`OTP is required.`, 400)
    const trainer = await Trainer.findOne({ email })
    if (!trainer) throw new ApiError(`Invalid OTP.`, 400)
    if (trainer.otp !== otp) throw new ApiError(`Invalid OTP.`, 400)
    if (trainer.otpExpiry < Date.now()) throw new ApiError(`OTP has been expired.`, 400)
    trainer.emailVerified = true
    trainer.otp = null
    trainer.otpExpiry = null
    await trainer.save()
    return res.status(200).json(new ApiResponse(`OTP verification successful.`, trainer.emailVerified))
})

// Resend OTP for trainer
export const resendTrainerOTP = asyncHandler(async (req, res) => {
    const { email } = req.body
    const trainer = await Trainer.findOne({ email: email })
    if (!trainer) throw new ApiError(`Email is not registered.`, 400)
    trainer.otp = generateOTP()
    trainer.otpExpiry = Date.now() + 10 * 60 * 1000
    sendVerificationEmail(trainer)
    await trainer.save()
    res.status(201).json(new ApiResponse(`New OTP has been sent to your email.`, trainer))
})

// Get all trainers (for client selection)
export const getAllTrainers = asyncHandler(async (req, res) => {
    const trainers = await Trainer.find({ emailVerified: true })
        .select('-password -otp -otpExpiry -forgotPassword')
    return res.status(200).json(new ApiResponse('Trainers retrieved successfully', trainers))
})

// Get trainer details
export const trainerDetails = asyncHandler(async (req, res) => {
    const trainer = await Trainer.findById(req.params.id).select('-password')
    if (!trainer) throw new ApiError(`Unable to find the trainer`, 400)
    return res.status(200).json(new ApiResponse(`Trainer details`, trainer))
})

// Update trainer profile
export const updateTrainer = asyncHandler(async (req, res) => {
    const { _id } = req.trainer
    const updatableFields = [
        'name',
        'phone',
        'specialization',
        'certification',
        'experience',
        'hourlyRate',
        'bio',
        'schedule'
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
        const existingTrainer = await Trainer.findOne({ phone: updates.phone, _id: { $ne: _id } })
        if (existingTrainer) throw new ApiError(`Phone number already in use.`, 400)
    }
    const updatedTrainer = await Trainer.findByIdAndUpdate(_id, updates, { new: true }).select("-password")
    if (!updatedTrainer) throw new ApiError(`Trainer not found`, 404)
    return res.status(200).json(new ApiResponse(`Trainer updated successfully`, updatedTrainer))
})

// Get trainer's clients
export const getTrainerClients = asyncHandler(async (req, res) => {
    const trainer = await Trainer.findById(req.trainer._id).populate('clients', 'name email phone profileImage fitnessGoal')
    if (!trainer) throw new ApiError('Trainer not found', 404)
    return res.status(200).json(new ApiResponse('Clients retrieved successfully', trainer.clients))
})

// Update trainer schedule
export const updateTrainerSchedule = asyncHandler(async (req, res) => {
    const { schedule } = req.body
    const trainer = await Trainer.findById(req.trainer._id)
    if (!trainer) throw new ApiError('Trainer not found', 404)
    trainer.schedule = schedule
    await trainer.save()
    return res.status(200).json(new ApiResponse('Schedule updated successfully', trainer.schedule))
})

// Trainer password change
export const trainerPasswordChange = asyncHandler(async (req, res) => {
    const { _id } = req.trainer
    const { oldpassword, password, confirmPassword } = req.body
    const trainer = await Trainer.findById(_id)
    if (!trainer) throw new ApiError('Something went wrong', 400)
    if (!oldpassword || !password || !confirmPassword) throw new ApiError(`One or more fields are empty`, 400)
    if (password !== confirmPassword) throw new ApiError(`Confirm password and password do not match`, 400)
    const comparepassword = await bcrypt.compare(oldpassword, trainer.password)
    if (comparepassword) {
        const hash_password = await bcrypt.hash(password, 10)
        trainer.password = hash_password
        await trainer.save()
        return res.status(200).json(new ApiResponse(`Password changed successfully.`))
    }
    return res.status(400).json(new ApiResponse(`Old password is incorrect.`))
})

// Trainer forget password
export const trainerForgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    const trainer = await Trainer.findOne({ email: email })
    if (!trainer) throw new ApiError(`Something went wrong`, 400)
    const otp = generateOTP()
    const otpExpiry = Date.now() + 10 * 60 * 1000
    trainer.forgotPassword = {
        otp: otp,
        otpExpiry: otpExpiry,
        isVerified: false
    }
    await trainer.save()
    await sendForgetPasswordVerificationEmail(trainer)
    return res.status(201).json(new ApiResponse(`Password reset OTP has been sent to your email.`, trainer.email))
})

// Trainer verify forget password OTP
export const verifyTrainerForgetPasswordOTP = asyncHandler(async (req, res) => {
    let { email, otp } = req.body
    if (!email || !otp) throw new ApiError(`OTP is required.`)
    const trainer = await Trainer.findOne({ email: email })
    if (!trainer) throw new ApiError(`Trainer not found`, 400)
    if (trainer.forgotPassword.otp !== otp) throw new ApiError(`Invalid OTP.`, 400)
    if (trainer.forgotPassword.otpExpiry < Date.now()) throw new ApiError(`OTP has been expired`, 400)
    trainer.forgotPassword.isVerified = true
    trainer.forgotPassword.otp = null
    trainer.forgotPassword.otpExpiry = null
    await trainer.save()
    return res.status(201).json(new ApiResponse(`OTP verification successful.`, trainer.forgotPassword.isVerified))
})

// Trainer forget password change
export const trainerForgetPasswordChange = asyncHandler(async (req, res) => {
    const { email, password, confirmPassword } = req.body
    if (password !== confirmPassword) throw new ApiError(`Password does not match.`, 400)
    const trainer = await Trainer.findOne({ email })
    if (!trainer) throw new ApiError(`Email is not registered`)
    if (!trainer.forgotPassword.isVerified) throw new ApiError(`Please verify your OTP first.`, 400)
    const salt = await bcrypt.genSalt(10)
    const hash_password = await bcrypt.hash(password, salt)
    trainer.password = hash_password
    await trainer.save()
    return res.status(201).json(new ApiResponse(`Password has been changed successfully.`))
})

// Get trainer dashboard data
export const getTrainerDashboard = asyncHandler(async (req, res) => {
    const trainer = await Trainer.findById(req.trainer._id)
        .populate('clients', 'name email phone profileImage fitnessGoal')
        .select('-password')
    if (!trainer) throw new ApiError('Trainer not found', 404)
    const dashboardData = {
        trainer: trainer,
        clients: trainer.clients,
        schedule: trainer.schedule,
        specialization: trainer.specialization,
        experience: trainer.experience,
        hourlyRate: trainer.hourlyRate
    }
    return res.status(200).json(new ApiResponse('Trainer dashboard data retrieved successfully', dashboardData))
})

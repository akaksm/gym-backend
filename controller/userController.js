import { User } from "../models/user.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import bcrypt from 'bcrypt'
import { generateOTP } from "../utils/generateOTP.js"
import { sendForgetPasswordVerificationEmail, sendVerificationEmail } from "../email/emailService.js"
import { generateToken } from "../utils/generateToken.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { isValidEmail, isStrongPassword, isValidName, isValidPhone } from "../utils/validation.js"

// Common registration function
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, confirmPassword, phone, gender } = req.body

    if (!name || !email || !password || !confirmPassword || !phone || !gender) {
        throw new ApiError(`All the fields are required.`, 400)
    }

    if (!isValidName(name)) throw new ApiError(`Invalid name.`, 400)
    if (!isValidEmail(email)) throw new ApiError(`Invalid email format.`, 400)
    // if (!isStrongPassword(password)) throw new ApiError(`Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.`, 400)
    // if (!isValidPhone(phone)) throw new ApiError(`Phone number must be exactly 10 digits.`, 400)

    if (password !== confirmPassword) throw new ApiError(`Passwords do not match`, 400)

    // Check if user already exists
    const existingUser = await User.findOne({ email: email })
    if (existingUser) throw new ApiError(`User with this email already exists`, 400)
    const existingPhone = await User.findOne({ phone: phone })
    if (existingPhone) throw new ApiError(`User with this phone number already exists`, 400)

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const otp = generateOTP()
    const otpExpiry = Date.now() + 10 * 60 * 1000

    const user = await User.create({
        ...req.body,
        password: hashedPassword,
        otp: otp,
        otpExpiry: otpExpiry,
    })

    sendVerificationEmail(user)

    return res.status(201).json(new ApiResponse(`User registered successfully`, user))
})

export const verifyOTP = asyncHandler(async (req, res) => {
    // take otp front front end
    let { email, otp } = req.body

    if (!email || !otp) throw new ApiError(`OTP is required.`, 400)

    // check user is available
    const user = await User.findOne({ email: email })

    // verify otp is correct or not
    if (!user) throw new ApiError(`Invalid OTP.`, 400)

    if (user.otp !== otp) throw new ApiError(`Invalid OTP.`, 400)

    // verify weather the otp is expired or not
    if (user.otpExpiry < Date.now()) throw new ApiError(`OTP has been expired.`, 400)

    user.emailVerified = true
    user.otp = null
    user.otpExpiry = null
    await user.save()

    return res.status(200).json(new ApiResponse(`OTP verification seccessfull.`, user.emailVerified))
})

export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email: email })

    if (!user) throw new ApiError(`Email is not registered.`, 400)

    user.otp = generateOTP()
    user.otpExpiry = Date.now() + 10 * 60 * 1000

    sendVerificationEmail(user)
    await user.save()

    res.status(201).json(new ApiResponse(`New otp has been sent to your email.`, user))
})

export const searchUser = asyncHandler(async (req, res) => {
    if (req.query.name) {
        const user = await User.find({
            name: {
                $regex: req.query.name,
                $options: 'i'
            }
        })

        if (!user) throw new ApiError(`User not found`, 400)

        return res.status(201).json(new ApiResponse(`Available user`, user))
    } else {
        const user = await User.find()
        if (!user) throw new ApiError(`Unable to find users`, 400)
        return res.status(201).json(new ApiResponse(`Available users`, user))
    }
})

export const userDetails = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
    if (!user) throw new ApiError(`Unable to find the user`, 400)
    return res.status(201).json(new ApiResponse(`Available user details`, user))
})

export const updateUser = asyncHandler(async (req, res) => {
    const { _id } = req.user

    const updatableFields = [
        'name',
        'phone',
        'age',
        'height',
        'weight',
        'gender',
        'fitnessGoal',
        'medicalConditions'
    ]

    const updates = {}

    // Add allowed text fields from req.body
    updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field]
        }
    })

    // Handle profile image upload (single file)
    if (req.file) {
        updates.profileImage = req.file.filename
    }

    // Check if phone is being updated and already exists
    if (updates.phone) {
        const existingUser = await User.findOne({ phone: updates.phone, _id: { $ne: _id } })
        if (existingUser) throw new ApiError(`Phone number already in use.`, 400)
    }

    const updatedUser = await User.findByIdAndUpdate(_id, updates, { new: true }).select("-password")

    if (!updatedUser) throw new ApiError(`User not found`, 404)
    return res.status(200).json(new ApiResponse(`User updated successfully`, updatedUser))
})

export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    // Check for active membership
    const activeMembership = await Membership.findOne({
        user: user._id,
        isActive: true,
        endDate: { $gte: new Date() }
    });
    if (activeMembership) {
        throw new ApiError(400, "Cannot delete user with active membership");
    }

    // Soft delete (set isDeleted flag)
    user.isDeleted = true;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, null, "User deactivated (soft delete)")
    );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) throw new ApiError(`Email or password are required.`, 400)
    // if (!isValidEmail(email)) throw new ApiError(`Invalid email format.`, 400)
    // if (!isStrongPassword(password)) throw new ApiError(`Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.`, 400)
    const user = await User.findOne({ email: email })
    if (!user) throw new ApiError(`Email is not register.`, 400)
    const comparepassword = await bcrypt.compare(password, user.password)
    if (!comparepassword) throw new ApiError(`Wrong password.`, 400)
    if (!user.emailVerified) throw new ApiError(`Please verify your email.`, 400)

    const data = {
        id: user._id,
        email: user.email
    }

    const token = generateToken(data)
    const showdata = await User.findById(user._id).select('-password')
    return res.json({ token, data: showdata })
})

export const passwordChange = asyncHandler(async (req, res) => {
    const { _id } = req.user
    const { oldpassword, password, confirmPassword } = req.body
    const user = await User.findById(_id)
    if (!user) throw new ApiError('Something went wrong', 400)
    if (!oldpassword || !password || !confirmPassword) throw new ApiError(`One or more fields are empty`, 400)
    if (!isStrongPassword(password)) throw new ApiError(`Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.`, 400)
    if (password !== confirmPassword) throw new ApiError(`confirm password and password does not match`, 400)
    const comparepassword = await bcrypt.compare(oldpassword, user.password)
    if (comparepassword) {
        const hash_password = await bcrypt.hash(password, 10)
        user.password = hash_password
        await user.save()
        return res.status(200).json(new ApiResponse(`Password changed successfully.`))
    }
    return res.status(400).json(new ApiResponse(`Old password is incorrect.`))
})

export const forgetPassword = asyncHandler(async (req, res) => {
    const { email } = req.body
    if (!isValidEmail(email)) throw new ApiError(`Invalid email format.`, 400)
    const user = await User.findOne({ email: email })
    if (!user) throw new ApiError(`Something went wrong`, 400)
    const otp = generateOTP()
    const otpExpiry = Date.now() + 10 * 60 * 1000
    user.forgotPassword = {
        otp: otp,
        otpExpiry: otpExpiry,
        isVerified: false
    }
    await user.save()
    await sendForgetPasswordVerificationEmail(user)
    return res.status(201).json(new ApiResponse(`Password reset OTP has been sent to your email.`, user.email))
})

export const verifyForgetPasswordOTP = asyncHandler(async (req, res) => {
    let { email, otp } = req.body
    if (!email || !otp) throw new ApiError(`Otp is required.`)
    const user = await User.findOne({ email: email })
    if (!user) throw new ApiError(`User not found`, 400)
    if (user.forgotPassword.otp !== otp) throw new ApiError(`Invalid OTP.`, 400)
    if (user.forgotPassword.otpExpiry < Date.now()) throw new ApiError(`OTP has been expired`, 400)
    user.forgotPassword.isVerified = true
    user.forgotPassword.otp = null
    user.forgotPassword.otpExpiry = null
    await user.save()
    return res.status(201).json(new ApiResponse(`OTP verification successfull.`, user.forgotPassword.isVerified))
})

export const forgetPasswordChange = asyncHandler(async (req, res) => {
    const { email, password, confirmPassword } = req.body
    // if (!isStrongPassword(password)) throw new ApiError(`Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.`, 400)
    if (password !== confirmPassword) throw new ApiError(`Password does not match.`, 400)
    const user = await User.findOne({ email: email })
    if (!user) throw new ApiError(`Email is not registered`)
    if (!user.forgotPassword.isVerified) throw new ApiError(`Please verify your otp first.`, 400)
    const salt = await bcrypt.genSalt(10)
    const hash_password = await bcrypt.hash(password, salt)
    user.password = hash_password
    await user.save()
    return res.status(201).json(new ApiResponse(`Password has been changed successfully.`))
})

// Get user dashboard data
export const getUserDashboard = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('assignedTrainer', 'name email phone profileImage specialization experience hourlyRate bio')
        .populate({
            path: 'membership',
            populate: { path: 'membershipType' }
        })
        .select('-password')
    if (!user) {
        throw new ApiError('User not found', 404)
    }

    let membershipStatus = "inactive";
    if (user.membership) {
        const now = new Date();
        if (user.membership.isActive && user.membership.endDate >= now) {
            membershipStatus = "active";
        }
    }

    const dashboardData = {
        user: user,
        membership: user.membership,
        assignedTrainer: user.assignedTrainer,
        fitnessStats: {
            age: user.age,
            height: user.height,
            weight: user.weight,
            fitnessGoal: user.fitnessGoal
        }
    }
    return res.status(200).json(
        new ApiResponse('User dashboard data retrieved successfully', dashboardData)
    )
})
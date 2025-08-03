import { User } from '../models/user.js'
import { Attendance } from '../models/attendance.js'
import { ApiError } from './ApiError.js'

// Device configuration
const DEVICE_CONFIG = {
    ip: process.env.FINGERPRINT_DEVICE_IP || '192.168.1.100',
    port: process.env.FINGERPRINT_DEVICE_PORT || 4370,
    timeout: 5000,
    deviceId: process.env.FINGERPRINT_DEVICE_ID || 'DEVICE_001'
}

// Mock device interface (replace with actual SDK)
class FingerprintDevice {
    constructor(config) {
        this.config = config
        this.isConnected = false
        this.templates = new Map() // In-memory template storage
    }

    async connect() {
        try {
            // Replace with actual device connection logic
            console.log(`Connecting to fingerprint device at ${this.config.ip}:${this.config.port}`)

            // Simulate connection delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            this.isConnected = true
            console.log('Fingerprint device connected successfully')
            return true
        } catch (error) {
            console.error('Failed to connect to fingerprint device:', error)
            throw new ApiError(500, 'Device connection failed')
        }
    }

    async disconnect() {
        this.isConnected = false
        console.log('Fingerprint device disconnected')
    }

    async enrollFingerprint(userId, fingerIndex = 0) {
        try {
            if (!this.isConnected) {
                throw new ApiError(500, 'Device not connected')
            }

            console.log(`Starting fingerprint enrollment for user ${userId}, finger ${fingerIndex}`)

            // Simulate fingerprint capture process
            await new Promise(resolve => setTimeout(resolve, 3000))

            // Generate a mock template (replace with actual template generation)
            const template = this.generateMockTemplate(userId, fingerIndex)

            // Store template in device memory
            this.templates.set(`${userId}_${fingerIndex}`, template)

            console.log(`Fingerprint enrolled successfully for user ${userId}`)
            return {
                success: true,
                template: template,
                quality: Math.floor(Math.random() * 30) + 70 // 70-100 quality score
            }
        } catch (error) {
            console.error('Fingerprint enrollment failed:', error)
            throw new ApiError(500, 'Fingerprint enrollment failed')
        }
    }

    async verifyFingerprint(template, fingerIndex = 0) {
        try {
            if (!this.isConnected) {
                throw new ApiError(500, 'Device not connected')
            }

            console.log('Starting fingerprint verification')

            // Simulate fingerprint capture for verification
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Simulate template matching (replace with actual matching logic)
            const capturedTemplate = this.generateMockTemplate('verification', fingerIndex)
            const matchResult = this.matchTemplates(template, capturedTemplate)

            return {
                success: true,
                matched: matchResult.matched,
                confidence: matchResult.confidence,
                userId: matchResult.userId
            }
        } catch (error) {
            console.error('Fingerprint verification failed:', error)
            throw new ApiError(500, 'Fingerprint verification failed')
        }
    }

    async deleteFingerprint(userId, fingerIndex = 0) {
        try {
            if (!this.isConnected) {
                throw new ApiError(500, 'Device not connected')
            }

            const templateKey = `${userId}_${fingerIndex}`
            const deleted = this.templates.delete(templateKey)

            console.log(`Fingerprint deleted for user ${userId}: ${deleted}`)
            return { success: deleted }
        } catch (error) {
            console.error('Fingerprint deletion failed:', error)
            throw new ApiError(500, 'Fingerprint deletion failed')
        }
    }

    async getDeviceInfo() {
        try {
            if (!this.isConnected) {
                throw new ApiError(500, 'Device not connected')
            }

            return {
                deviceId: this.config.deviceId,
                ip: this.config.ip,
                port: this.config.port,
                status: 'online',
                templateCount: this.templates.size,
                firmware: '1.0.0',
                serialNumber: 'SN123456789'
            }
        } catch (error) {
            console.error('Failed to get device info:', error)
            throw new ApiError(500, 'Failed to get device info')
        }
    }

    // Helper methods
    generateMockTemplate(userId, fingerIndex) {
        // Generate a mock fingerprint template
        const template = {
            userId: userId,
            fingerIndex: fingerIndex,
            data: Buffer.from(`template_${userId}_${fingerIndex}_${Date.now()}`).toString('base64'),
            timestamp: new Date(),
            quality: Math.floor(Math.random() * 30) + 70
        }
        return template
    }

    matchTemplates(storedTemplate, capturedTemplate) {
        // Simulate template matching algorithm
        const similarity = Math.random() // 0-1 similarity score
        const threshold = 0.8 // Minimum similarity for a match

        return {
            matched: similarity >= threshold,
            confidence: Math.floor(similarity * 100),
            userId: storedTemplate.userId
        }
    }
}

// Main fingerprint service
class FingerprintService {
    constructor() {
        this.device = new FingerprintDevice(DEVICE_CONFIG)
        this.isInitialized = false
    }

    async initialize() {
        try {
            await this.device.connect()
            this.isInitialized = true
            console.log('Fingerprint service initialized successfully')
        } catch (error) {
            console.error('Failed to initialize fingerprint service:', error)
            throw error
        }
    }

    async enrollUser(userId, fingerIndex = 0) {
        try {
            if (!this.isInitialized) {
                await this.initialize()
            }

            // Check if user exists
            const user = await User.findById(userId)
            if (!user) {
                throw new ApiError(404, 'User not found')
            }

            // Check if already enrolled
            if (user.isFingerprintEnrolled) {
                throw new ApiError(400, 'User already enrolled for fingerprint')
            }

            // Enroll fingerprint on device
            const enrollmentResult = await this.device.enrollFingerprint(userId, fingerIndex)

            if (enrollmentResult.success) {
                // Update user record
                user.fingerprintTemplate = enrollmentResult.template.data
                user.isFingerprintEnrolled = true
                user.lastEnrollmentAttempt = new Date()
                await user.save()

                return {
                    success: true,
                    message: 'Fingerprint enrolled successfully',
                    quality: enrollmentResult.quality,
                    template: enrollmentResult.template
                }
            } else {
                throw new ApiError(500, 'Fingerprint enrollment failed')
            }
        } catch (error) {
            console.error('Enrollment error:', error)
            throw error
        }
    }

    async verifyAttendance(userId, fingerIndex = 0) {
        try {
            if (!this.isInitialized) {
                await this.initialize()
            }

            // Get user's stored template
            const user = await User.findById(userId)
            if (!user || !user.isFingerprintEnrolled) {
                throw new ApiError(400, 'User not enrolled for fingerprint')
            }

            // Create template object for verification
            const storedTemplate = {
                userId: userId,
                fingerIndex: fingerIndex,
                data: user.fingerprintTemplate
            }

            // Verify fingerprint
            const verificationResult = await this.device.verifyFingerprint(storedTemplate, fingerIndex)

            if (verificationResult.success && verificationResult.matched) {
                // Create attendance record
                const attendance = await Attendance.create({
                    user: userId,
                    date: new Date(),
                    checkInTime: new Date(),
                    status: 'present',
                    verificationMethod: 'fingerprint',
                    deviceId: DEVICE_CONFIG.deviceId
                })

                return {
                    success: true,
                    message: 'Attendance verified successfully',
                    confidence: verificationResult.confidence,
                    attendance: attendance
                }
            } else {
                throw new ApiError(401, 'Fingerprint verification failed')
            }
        } catch (error) {
            console.error('Verification error:', error)
            throw error
        }
    }

    async deleteEnrollment(userId, fingerIndex = 0) {
        try {
            if (!this.isInitialized) {
                await this.initialize()
            }

            // Delete from device
            const deviceResult = await this.device.deleteFingerprint(userId, fingerIndex)

            if (deviceResult.success) {
                // Update user record
                const user = await User.findById(userId)
                if (user) {
                    user.fingerprintTemplate = null
                    user.isFingerprintEnrolled = false
                    await user.save()
                }

                return {
                    success: true,
                    message: 'Fingerprint enrollment deleted successfully'
                }
            } else {
                throw new ApiError(500, 'Failed to delete fingerprint enrollment')
            }
        } catch (error) {
            console.error('Deletion error:', error)
            throw error
        }
    }

    async getDeviceStatus() {
        try {
            if (!this.isInitialized) {
                await this.initialize()
            }

            return await this.device.getDeviceInfo()
        } catch (error) {
            console.error('Device status error:', error)
            throw error
        }
    }

    async cleanup() {
        try {
            await this.device.disconnect()
            this.isInitialized = false
            console.log('Fingerprint service cleaned up')
        } catch (error) {
            console.error('Cleanup error:', error)
        }
    }
}

// Export singleton instance
export const fingerprintService = new FingerprintService()

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down fingerprint service...')
    await fingerprintService.cleanup()
    process.exit(0)
}) 
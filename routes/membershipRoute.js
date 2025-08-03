import express from 'express'
import {
    createMembership,
    getAllMemberships,
    getMembershipById,
    getMembershipsByUserId,
    updateMembership,
    deleteMembership,
    getActiveMemberships,
    checkUserActiveMembership,
    activateMembership
} from '../controller/membershipController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { adminAuthMiddleware, authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/create', authMiddleware, asyncHandler(createMembership))
router.post('/activate', asyncHandler(activateMembership))
router.get('/user/:userId', authMiddleware, asyncHandler(getMembershipsByUserId))
router.get('/check/active/:userId', authMiddleware, asyncHandler(checkUserActiveMembership))

router.put('/update/:id', authMiddleware, checkUserActiveMembership, asyncHandler((req, res, next) => {
    if (req.user._id.equals(req.membership.user._id) && req.isExpired) {
        return updateMembership(req, res, next)
    }

    adminAuthMiddleware(req, res, () => {
        return updateMembership(req, res, next)
    })
}))


router.get('/get', adminAuthMiddleware, asyncHandler(getAllMemberships))
router.get('/active', adminAuthMiddleware, asyncHandler(getActiveMemberships))
router.get('/get/:id', adminAuthMiddleware, asyncHandler(getMembershipById))
router.delete('/delete/:id', adminAuthMiddleware, asyncHandler(deleteMembership))

export default router 
import express from 'express'
import {
    createMembershipType,
    getAllMembershipTypes,
    getActiveMembershipTypes,
    getMembershipTypeById,
    updateMembershipType,
    deleteMembershipType,
    toggleMembershipTypeStatus
} from '../controller/membershipTypeController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { adminAuthMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/create', adminAuthMiddleware, asyncHandler(createMembershipType))
router.get('/getall', asyncHandler(getAllMembershipTypes))
router.get('/active', asyncHandler(getActiveMembershipTypes))
router.get('/get/:id', asyncHandler(getMembershipTypeById))
router.put('/update/:id', adminAuthMiddleware, asyncHandler(updateMembershipType))
router.delete('/delete/:id', adminAuthMiddleware, asyncHandler(deleteMembershipType))
router.patch('/toggle-status/:id', adminAuthMiddleware, asyncHandler(toggleMembershipTypeStatus))

export default router 
import { Router } from 'express'
import { getRooms, createRoomHandler, updateRoomHandler, deleteRoomHandler } from '../controllers/room.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/role.middleware'

const router = Router()

router.get('/floors/:floorId/rooms', authenticate, getRooms)
router.post('/floors/:floorId/rooms', authenticate, createRoomHandler)
router.put('/rooms/:id', authenticate, updateRoomHandler)
router.delete('/rooms/:id', authenticate, requireAdmin, deleteRoomHandler)

export default router
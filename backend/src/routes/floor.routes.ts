import { Router } from 'express'
import { getFloors, createFloorHandler, updateFloorHandler, deleteFloorHandler } from '../controllers/floor.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/role.middleware'

const router = Router()

router.get('/buildings/:buildingId/floors', authenticate, getFloors)
router.post('/buildings/:buildingId/floors', authenticate, createFloorHandler)
router.put('/floors/:id', authenticate, updateFloorHandler)
router.delete('/floors/:id', authenticate, requireAdmin, deleteFloorHandler)

export default router
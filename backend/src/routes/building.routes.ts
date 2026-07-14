import { Router } from 'express'
import {
  getBuildings, getBuildingById, createBuildingHandler, updateBuildingHandler,
  deleteBuildingHandler, assignManager, removeManager, getBuildingStats
} from '../controllers/building.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/role.middleware'

const router = Router()

router.get('/', authenticate, getBuildings)
router.post('/', authenticate, requireAdmin, createBuildingHandler)
router.get('/:id', authenticate, getBuildingById)
router.put('/:id', authenticate, updateBuildingHandler)
router.delete('/:id', authenticate, requireAdmin, deleteBuildingHandler)
router.get('/:id/stats', authenticate, getBuildingStats)
router.post('/:id/managers', authenticate, requireAdmin, assignManager)
router.delete('/:id/managers/:userId', authenticate, requireAdmin, removeManager)

export default router
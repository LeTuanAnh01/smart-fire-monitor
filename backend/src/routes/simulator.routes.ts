import { Router } from 'express'
import { triggerDevice, triggerAll } from '../controllers/simulator.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireSuperAdmin } from '../middleware/role.middleware'

const router = Router()

router.post('/trigger',     authenticate, requireSuperAdmin, triggerDevice)
router.post('/trigger-all', authenticate, requireSuperAdmin, triggerAll)

export default router
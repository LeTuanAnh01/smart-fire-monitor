import { Router } from 'express'
import { getAlerts, acknowledgeAlert, resolveAlert } from '../controllers/alert.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, getAlerts)
router.put('/:id/acknowledge', authenticate, acknowledgeAlert)
router.put('/:id/resolve', authenticate, resolveAlert)

export default router
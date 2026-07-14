import { Router } from 'express'
import { getOverview, getAlertsChart, getDeviceStatus } from '../controllers/stats.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/overview', authenticate, getOverview)
router.get('/alerts-chart', authenticate, getAlertsChart)
router.get('/device-status', authenticate, getDeviceStatus)

export default router
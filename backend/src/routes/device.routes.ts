import { Router } from 'express'
import {
  getDevices, getDeviceById, createDeviceHandler,
  updateDeviceHandler, deleteDeviceHandler, getDeviceLogs
} from '../controllers/device.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/role.middleware'

const router = Router()

router.get('/', authenticate, getDevices)
router.post('/', authenticate, requireAdmin, createDeviceHandler)
router.get('/:id', authenticate, getDeviceById)
router.put('/:id', authenticate, requireAdmin, updateDeviceHandler)
router.delete('/:id', authenticate, requireAdmin, deleteDeviceHandler)
router.get('/:id/logs', authenticate, getDeviceLogs)

export default router
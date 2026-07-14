import { Router } from 'express'
import {
  getTree, getLocation, createLocationHandler,
  updateLocationHandler, deleteLocationHandler,
  assignUser, removeUser
} from '../controllers/location.controller'
import { authenticate } from '../middleware/auth.middleware'
import { requireAdmin } from '../middleware/role.middleware'

const router = Router()

router.get('/',           authenticate, getTree)
router.get('/:id',        authenticate, getLocation)
router.post('/',          authenticate, requireAdmin, createLocationHandler)
router.put('/:id',        authenticate, requireAdmin, updateLocationHandler)
router.delete('/:id',     authenticate, requireAdmin, deleteLocationHandler)
router.post('/:id/users',            authenticate, requireAdmin, assignUser)
router.delete('/:id/users/:userId',  authenticate, requireAdmin, removeUser)

export default router
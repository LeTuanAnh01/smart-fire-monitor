import { Router } from 'express'
import { getUsers, createUserHandler, updateUserHandler, deleteUserHandler } from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.get('/', authenticate, getUsers)
router.post('/', authenticate, createUserHandler)      // bỏ requireAdmin
router.put('/:id', authenticate, updateUserHandler)
router.delete('/:id', authenticate, deleteUserHandler)  // bỏ requireAdmin

export default router
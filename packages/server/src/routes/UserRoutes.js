import { Router } from 'express';
const router = Router();
import { userController } from '../controllers/UserController.js';
import { authenticateToken } from '../../middleware.js';

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/profile', authenticateToken,userController.getUserById)
router.get('/edit-profile', authenticateToken, userController.editUser);
export default router;
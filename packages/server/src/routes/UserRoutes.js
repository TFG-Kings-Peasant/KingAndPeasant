import { Router } from 'express';
const router = Router();
import { userController } from '../controllers/UserController.js';

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
export default router;
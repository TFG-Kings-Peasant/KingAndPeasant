import { Router } from 'express';
const router = Router();
import { userController } from '../controllers/UserController.js';
import { authenticateToken } from '../../middleware.js';
import { validateBody } from '../middleware/validation.js';
import {
  validateRegisterBody,
  validateLoginBody,
  validateEditProfileBody,
} from '../validators/userValidators.js';

router.post('/register', validateBody(validateRegisterBody), userController.registerUser);
router.post('/login', validateBody(validateLoginBody), userController.loginUser);
router.get('/profile', authenticateToken,userController.getUserById);
router.get('/search', authenticateToken, userController.searchUsers);
router.put('/edit-profile', authenticateToken, validateBody(validateEditProfileBody), userController.editUser);
export default router;

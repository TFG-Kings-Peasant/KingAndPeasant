import { Router } from 'express';
const router = Router();
import { friendshipController } from '../controllers/FriendshipController.js';
import { authenticateToken } from '../../middleware.js';

router.post('/add', authenticateToken, friendshipController.addFriend);
router.post('/remove', authenticateToken, friendshipController.removeFriend);
router.get('/list', authenticateToken, friendshipController.listFriends);

export default router;
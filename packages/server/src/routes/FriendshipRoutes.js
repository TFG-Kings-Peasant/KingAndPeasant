import { Router } from 'express';
const router = Router();
import { friendshipController } from '../controllers/FriendshipController.js';
import { authenticateToken } from '../../middleware.js';

router.post('/add', authenticateToken, friendshipController.addFriend);
router.delete('/remove', authenticateToken, friendshipController.removeFriend);
router.get('/list', authenticateToken, friendshipController.listFriends);
router.get('/listFriendshipRequests', authenticateToken, friendshipController.listPendingFriendshipRequests);
router.put('/update', authenticateToken, friendshipController.changeFriendshipStatus);

export default router;
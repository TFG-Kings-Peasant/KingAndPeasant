import { Router } from 'express';
const router = Router();
import { lobbyController } from '../controllers/LobbyController.js';

router.get('/', lobbyController.getLobbies);
router.post('/', lobbyController.createLobby);
export default router;
import { Router } from 'express';
const router = Router();
import { lobbyController } from '../controllers/LobbyController.js';

router.get('/', lobbyController.getLobbies);
router.post('/', lobbyController.createLobby);
router.get('/:id', lobbyController.getLobbyById);
router.post('/:id/join', lobbyController.joinLobby);
router.post('/:id/leave', lobbyController.leaveLobby);
router.post('/:id/setReady', lobbyController.setPlayerReady);
export default router;
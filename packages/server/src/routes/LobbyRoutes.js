import { Router } from 'express';
import { lobbyController } from '../controllers/LobbyController.js';
import { authenticateToken } from "../../middleware.js";

const router = Router();


router.get('/', lobbyController.getLobbies);
router.post('/', lobbyController.createLobby);
router.get('/myLobby', authenticateToken, lobbyController.getMyLobby);
router.get('/:id', lobbyController.getLobbyById);
router.post('/:id/join', lobbyController.joinLobby);
router.post('/:id/leave', lobbyController.leaveLobby);
router.post('/:id/setReady', lobbyController.setPlayerReady);

export default router;
import { Router } from 'express';
import { lobbyController } from '../controllers/LobbyController.js';
import { authenticateToken } from "../../middleware.js";
import { validateCreateLobby, validateJoinLobby, validateSetReady } from '../validators/lobbyValidators.js';

const router = Router();


router.get('/', lobbyController.getLobbies);

router.post('/', authenticateToken, validateCreateLobby, lobbyController.createLobby);

router.get('/myLobby', authenticateToken, lobbyController.getMyLobby);
router.get('/:id', authenticateToken, lobbyController.getLobbyById);

router.post('/:id/join', authenticateToken, validateJoinLobby, lobbyController.joinLobby);
router.post('/:id/leave', authenticateToken, lobbyController.leaveLobby);
router.post('/:id/setReady', authenticateToken, validateSetReady, lobbyController.setPlayerReady);

export default router;
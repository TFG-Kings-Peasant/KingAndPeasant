import Router from "express";
const router = Router();
import { gameController } from '../controllers/GameController.js';
import { authenticateToken } from "../../middleware.js";

router.post('/start', authenticateToken, gameController.createGame);
router.get('/:id', authenticateToken, gameController.getGameStatus);
router.post('/:id/playHandCard', authenticateToken, gameController.playHandCard);
router.post('/:id/resolveAction', authenticateToken, gameController.resolveAction);
router.post('/:id/drawACard', authenticateToken, gameController.peasantDrawACard);
router.post('/:id/passTurn', authenticateToken, gameController.passTurn);



export default router;
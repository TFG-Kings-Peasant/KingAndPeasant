import Router from "express";
const router = Router();
import { gameController } from '../controllers/GameController.js';
import { authenticateToken } from "../../middleware.js";

router.post('/start', authenticateToken, gameController.createGame);
router.get('/:id', authenticateToken, gameController.getGameStatus);
router.post('/:id/playCard', authenticateToken, gameController.playCard);
router.post('/:id/resolveAction', authenticateToken, gameController.resolveAction);


export default router;
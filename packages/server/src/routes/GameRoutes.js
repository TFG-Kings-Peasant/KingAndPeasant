import Router from "express";
const router = Router();
import { gameController } from '../controllers/GameController.js';

router.post('/start', gameController.createGame);
router.get('/:id', gameController.getGameStatus);
router.post('/:id/playCard', gameController.playCard);
router.post('/:id/resolveAction', gameController.resolveAction);


export default router;
import Router from "express";
const router = Router();
import { gameController } from '../controllers/GameController.js';

router.post('/start', gameController.createGame);
router.get('/:id', gameController.getGameStateById);
router.post('/:id/playCard', gameController.exampleAction);

export default router;
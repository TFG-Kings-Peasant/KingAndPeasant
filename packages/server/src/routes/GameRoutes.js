import Router from "express";
const router = Router();
import { gameController } from '../controllers/GameController.js';

router.post('/start', gameController.createGame);
router.get('/:id', gameController.getGameStateById);

export default router;
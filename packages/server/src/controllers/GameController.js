import { gameService } from '../services/GameService.js';
import { io, userSockets } from '../../index.js';

const createGame = async (req, res) => {
    try {
        const { lobbyId, player1Id, player2Id } = req.body;
        const game = await gameService.createGame(lobbyId, player1Id, player2Id);
        res.status(201).json(game);
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getGameStateById = async (req, res) => {
    try {
        const { id } = req.params;
        const gameState = await gameService.getGameStateById(id);
        res.status(200).json(gameState);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const exampleAction = async (req, res) => {
    try{
        const { id } = req.params;
        const { playerId } = req.body;

        if (!id || !playerId) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        const gameState = await gameService.exampleAction(id, playerId)

        io.to(`game_${id}`).emit('action')

        res.status(201).json(gameState);
    }catch(error){
        res.status(500).json({ error: error.message});
    }
}

export const gameController = {
    createGame,
    getGameStateById,
    exampleAction
}
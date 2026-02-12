import { gameService } from '../services/GameService.js';

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
        console.log("Game state retrieved:", gameState); // Log para verificar el estado del juego
        res.status(200).json(gameState);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const gameController = {
    createGame,
    getGameStateById
}
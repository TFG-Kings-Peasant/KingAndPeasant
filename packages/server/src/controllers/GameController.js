import { gameService } from '../services/GameService.js';


const createGame = async (req, res) => {
    try {
        const { lobbyId, player1Id, player2Id } = req.body;
        const {dtoKing, dtoPeasant} = await gameService.createGame(lobbyId, player1Id, player2Id);

        const io = req.app.get('io');
        io.to(`lobby${lobbyId}`).emit('gameStarted'); 
        res.status(201).json({dtoKing, dtoPeasant});
    }catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getGameStatus = async (req, res) => {
    try {
        const gameId = req.params.id;
        const userId =req.user.id;

        const {dtoKing, dtoPeasant} = await gameService.getGameStateDTO(gameId);

        if (!dtoKing || !dtoPeasant) return res.status(404).send("Juego no encontrado");

        const gameState = userId === dtoKing.players.king.id ? dtoKing : userId === dtoPeasant.players.peasant.id ? dtoPeasant : null;
        res.status(200).json(gameState);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const playCard = async (req, res) => {
    try {
        const gameId = req.params.id;
        const { cardUid, targetData, isHand } = req.body;
        const userId  = Number(req.user.id);
        const io = req.app.get('io');

        const result = isHand 
        ? await gameService.playHandCard(gameId, cardUid, targetData, userId) 
        : await gameService.playTownCard(gameId, cardUid, targetData, userId);
    
        if (result.isGameOver) {
            io.to(`game_${gameId}`).emit('game:finished', result);
        } else {
            sendGameStateUpdate(req, result.dtoKing, result.dtoPeasant, gameId);
        }

        res.status(200).json({ message: "Carta jugada correctamente" });
    } catch (error) {
        console.error("Error al jugar la carta:", error.message);
        res.status(500).json({ error: error.message });
    }
}

function sendGameStateUpdate (req, dtoKing, dtoPeasant, gameId) {
    const io = req.app.get('io');
    
    const kingId = dtoKing.players.king.id;
    const peasantId = dtoPeasant.players.peasant.id;

    // Usamos Socket.IO nativo para enviar el estado exacto a cada jugador
    io.to(`game_${gameId}_user_${kingId}`).emit('gameState', dtoKing);
    io.to(`game_${gameId}_user_${peasantId}`).emit('gameState', dtoPeasant);
}

const resolveAction = async (req, res) => {
    try {
        const gameId = req.params.id;
        const { targetData } = req.body;
        const userId  = Number(req.user.id);
        const result = await gameService.resolvePendingAction(gameId, userId, targetData);
        const io = req.app.get('io');
        if (result.isGameOver) {
            io.to(`game_${gameId}`).emit('game:finished', result);
        } else {
            sendGameStateUpdate(req, result.dtoKing, result.dtoPeasant, gameId);
        }
        res.status(200).json({ message: "Acción resuelta correctamente" });
    } catch (error) {
        console.error("Error al resolver la acción:", error.message);
        res.status(500).json({ error: error.message });
    }
}

const condemnARebel = async (req, res) => {
    try {
        const gameId = req.params.id;
        const userId  = Number(req.user.id);
        const { isDeck, cardUid } = req.body;

        const result = await gameService.condemnARebel(gameId, isDeck, cardUid, userId);
        const io = req.app.get('io');

        if (result.isGameOver) {
            io.to(`game_${gameId}`).emit('game:finished', result);
        } else {
            sendGameStateUpdate(req, result.dtoKing, result.dtoPeasant, gameId);
        }

        res.status(200).json({ message: "Acción resuelta correctamente" });
    } catch (error) {
        console.error("Error al condenar rebelde:", error.message);
        res.status(500).json({ error: error.message });
    }
}

const peasantDrawACard = async (req, res) => {
    try {
        const gameId = req.params.id;
        const userId  = Number(req.user.id);
        const result = await gameService.peasantDrawACard(gameId, userId);
        const io = req.app.get('io');

        if (result.isGameOver) {
            io.to(`game_${gameId}`).emit('game:finished', result);
        } else {
            sendGameStateUpdate(req, result.dtoKing, result.dtoPeasant, gameId);
        }
        res.status(200).json({ message: "Acción resuelta correctamente" });
    } catch (error) {
        console.error("Error al robar carta:", error.message);
        res.status(500).json({ error: error.message });
    }
}

const passTurn = async (req, res) => {
    try {
        const gameId = req.params.id;
        const userId  = Number(req.user.id);
        const result = await gameService.passTurn(gameId, userId);
        const io = req.app.get('io');

        if (result.isGameOver) {
            io.to(`game_${gameId}`).emit('game:finished', result);
        } else {
            sendGameStateUpdate(req, result.dtoKing, result.dtoPeasant, gameId);
        }
        res.status(200).json({ message: "Acción resuelta correctamente" });
    } catch (error) {
        console.error("Error al pasar turno:", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const gameController = {
    createGame,
    getGameStatus,
    playCard,
    resolveAction,
    peasantDrawACard,
    passTurn,
    condemnARebel
}
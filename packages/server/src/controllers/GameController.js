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
        console.log("📊 Enviando estado del juego a usuario", userId, ":", gameState);
        res.status(200).json(gameState);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const playCard = async (req, res) => {
    try {
        const lobbyId = req.params.id;
        const { cardUid, targetData } = req.body;
        const userId  = Number(req.user.idUser);

        const {dtoKing, dtoPeasant} = await gameService.playCard(lobbyId, cardUid, targetData, userId);
    
        sendGameStateUpdate(dtoKing, dtoPeasant);

        res.status(200).json({ message: "Carta jugada correctamente" });
    } catch (error) {
        console.error("Error al jugar la carta:", error.message);
        res.status(500).json({ error: error.message });
    }
}

function sendGameStateUpdate (dtoKing, dtoPeasant) {
    if (userSockets[dtoKing.players.king.id]) {
        io.to(userSockets[dtoKing.players.king.id]).emit('gameState', dtoKing);
    }
    if (userSockets[dtoPeasant.players.peasant.id]) {
        io.to(userSockets[dtoPeasant.players.peasant.id]).emit('gameState', dtoPeasant);
    }
}

const resolveAction = async (req, res) => {
    try {
        const lobbyId = req.params.id;
        const { targetData } = req.body;
        const userId  = Number(req.user.idUser);
        const {dtoKing, dtoPeasant} = await gameService.resolvePendingAction(lobbyId, userId, targetData);
    
        sendGameStateUpdate(dtoKing, dtoPeasant);

        res.status(200).json({ message: "Acción resuelta correctamente" });
    } catch (error) {
        console.error("Error al resolver la acción:", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const gameController = {
    createGame,
    getGameStatus,
    playCard,
    resolveAction
}
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
        const {dtoKing, dtoPeasant} = isHand 
        ? await gameService.playHandCard(gameId, cardUid, targetData, userId) 
        : await gameService.playTownCard(gameId, cardUid, userId);
    
        sendGameStateUpdate(req, dtoKing, dtoPeasant);

        res.status(200).json({ message: "Carta jugada correctamente" });
    } catch (error) {
        console.error("Error al jugar la carta:", error.message);
        res.status(500).json({ error: error.message });
    }
}

function sendGameStateUpdate (req, dtoKing, dtoPeasant) {
    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');
    const kingId = dtoKing.players.king.id;
    const socketKing = userSockets.get(String(kingId)) || userSockets.get(Number(kingId));
    if (socketKing) {
        io.to(socketKing).emit('gameState', dtoKing);
    } else {
        console.log(`No se encontró socket activo para el REY (${kingId})`);
    }

    const peasantId = dtoPeasant.players.peasant.id;
    const socketPeasant = userSockets.get(String(peasantId)) || userSockets.get(Number(peasantId));
    if (peasantId) {
        io.to(socketPeasant).emit('gameState', dtoPeasant);
    } else {
        console.log(`No se encontró socket activo para el CAMPESINO (${peasantId})`); 
    }
}

const resolveAction = async (req, res) => {
    try {
        const gameId = req.params.id;
        const { targetData } = req.body;
        const userId  = Number(req.user.id);
        const {dtoKing, dtoPeasant} = await gameService.resolvePendingAction(gameId, userId, targetData);
    
        sendGameStateUpdate(req, dtoKing, dtoPeasant);

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
        const { cardUid } = req.body;

        const {dtoKing, dtoPeasant} = await gameService.condemnARebel(gameId, cardUid, userId);
    
        sendGameStateUpdate(req, dtoKing, dtoPeasant);

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
        const {dtoKing, dtoPeasant} = await gameService.peasantDrawACard(gameId, userId);
    
        sendGameStateUpdate(req, dtoKing, dtoPeasant);

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
        const {dtoKing, dtoPeasant} = await gameService.passTurn(gameId, userId);
    
        sendGameStateUpdate(req, dtoKing, dtoPeasant);

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
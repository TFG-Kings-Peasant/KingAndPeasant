import { lobbyService } from '../services/LobbyService.js';

const getLobbies = async (req, res) => {
    try {
        const lobbies = await lobbyService.getAllLobbies();
        res.status(200).json(lobbies);
    } catch (error) {
        console.error("🔴 ERROR CRÍTICO EN GET LOBBIES:");
        console.error(error);
        res.status(500).json({ error: 'Error al obtener lobbies', details: error.message });
    }
};

const getLobbyById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
        return res.status(400).json({ message: "No se ha proporcionado un ID de lobby" });
        }
        const lobbyId = Number(id);

        const lobby = await lobbyService.getLobbyById(lobbyId);
        if (!lobby) {
            return res.status(404).json({ message: 'Lobby no encontrado' });
        }
        res.status(200).json(lobby);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const createLobby = async (req, res) => {
    try {
        const { name, privacy, player1Id } = req.body;
        
        console.log("📥 Datos recibidos para crear lobby:", req.body);

        // Validación básica de entrada
        if (!name || !player1Id) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        const newLobby = await lobbyService.createLobby({ name, privacy, player1Id });
        res.status(201).json(newLobby);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const joinLobby = async (req, res) => {
    try {
        const { id } = req.params;
        const lobbyId = Number(id);
        const { player2Id } = req.body;

        if (!lobbyId || !player2Id) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        const updatedLobby = await lobbyService.joinLobby({ lobbyId, player2Id });

        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        const socketId = userSockets.get(player2Id);

        if (socketId) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(`lobby${lobbyId}`);
                io.to(`lobby${lobbyId}`).emit('lobbyUpdated');
            }
        }
        res.status(200).json(updatedLobby);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const leaveLobby = async (req, res) => {
    try {
        const { id } = req.params;
        const lobbyId = Number(id);
        const { playerId } = req.body;

        if (!lobbyId || !playerId) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        const updatedLobby = await lobbyService.leaveLobby({ lobbyId, playerId });

        const io = req.app.get('io');
        io.to(`lobby${lobbyId}`).emit('lobbyUpdated');
        res.status(200).json(updatedLobby);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const setPlayerReady = async (req, res) => { 
    try {
        const { id } = req.params;
        const lobbyId = Number(id);
        
        const { playerId, isReady } = req.body;
        console.log("📥 Datos recibidos para setPlayerReady:", req.body);
        if (!lobbyId || !playerId || isReady === undefined) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }
        const updatedLobby = await lobbyService.setPlayerReady({ lobbyId, playerId, isReady });

        const io = req.app.get('io');
        io.to(`lobby${lobbyId}`).emit('lobbyUpdated');
        res.status(200).json(updatedLobby);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export const lobbyController = {
    getLobbies,
    getLobbyById,
    createLobby,
    joinLobby,
    leaveLobby,
    setPlayerReady
};
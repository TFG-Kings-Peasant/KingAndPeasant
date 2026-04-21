import { lobbyService } from '../services/LobbyService.js';

// Función de ayuda para clasificar los errores del servicio y devolver el status HTTP correcto
const handleLobbyError = (res, error) => {
    const msg = error.message;

    // Errores de conflicto (409 Conflict)
    if (msg.includes('Ya existe una sala') || msg.includes('ya está lleno')) {
        return res.status(409).json({ error: msg });
    }
    
    // Errores de permisos/reglas de negocio (403 Forbidden)
    if (msg.includes('otra sala') || msg.includes('partida privada') || msg.includes('no está en el lobby')) {
        return res.status(403).json({ error: msg });
    }

    // Errores de recursos no encontrados (404 Not Found)
    if (msg.includes('Lobby no encontrado')) {
        return res.status(404).json({ error: msg });
    }

    // Por defecto, si es un error no controlado
    return res.status(500).json({ error: 'Error interno del servidor', details: msg });
};

const getLobbies = async (req, res) => {
    try {
        const lobbies = await lobbyService.getAllLobbies();
        res.status(200).json(lobbies);
    } catch (error) {
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
        handleLobbyError(res, error);
    }
};

const createLobby = async (req, res) => {
    try {
        const { name, privacy, player1Id } = req.body;

        if (!name || !player1Id) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        const newLobby = await lobbyService.createLobby({ name, privacy, player1Id });

        const io = req.app.get('io');
        io.emit('lobbyUpdated');

        res.status(201).json(newLobby);
    } catch (error) {
        handleLobbyError(res, error);
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
        io.emit('lobbyUpdated');

        res.status(200).json(updatedLobby);
    } catch (error) {
        handleLobbyError(res, error);
    }
};

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
        handleLobbyError(res, error);
    }
};

const setPlayerReady = async (req, res) => { 
    try {
        const { id } = req.params;
        const lobbyId = Number(id);
        const { playerId, isReady } = req.body;
        
        if (!lobbyId || !playerId || isReady === undefined) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }
        
        const updatedLobby = await lobbyService.setPlayerReady({ lobbyId, playerId, isReady });

        const io = req.app.get('io');
        io.to(`lobby${lobbyId}`).emit('lobbyUpdated');
        
        res.status(200).json(updatedLobby);
    } catch (error) {
        handleLobbyError(res, error);
    }
};

const getMyLobby = async (req, res) => {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json({ message: "No se ha proporcionado un ID de usuario" });
        }
        
        const lobby = await lobbyService.getUserActiveLobby(userId);
        res.status(200).json(lobby || null); 
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener tu lobby', details: error.message });
    }
};

export const lobbyController = {
    getLobbies,
    getLobbyById,
    createLobby,
    joinLobby,
    leaveLobby,
    setPlayerReady,
    getMyLobby
};
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

const createLobby = async (req, res) => {
    try {
        const { name, status, privacy, player1 } = req.body;
        
        // Validación básica de entrada
        if (!name || !status || !privacy || !player1) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        const newLobby = await lobbyService.createLobby({ name, status, privacy, player1 });
        res.status(201).json(newLobby);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const lobbyController = {
    getLobbies,
    createLobby
};
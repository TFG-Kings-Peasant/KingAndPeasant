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

export const lobbyController = {
    getLobbies,
    createLobby
};
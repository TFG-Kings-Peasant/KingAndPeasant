import { lobbyService } from '../services/LobbyService.js';


const pendingLeaves = new Map();

export const registerLobbyHandlers = (io, socket, userSockets) => {
    
    socket.on('joinLobby', (roomName) => {
        const userId = socket.userId;

        if (userId && pendingLeaves.has(userId)) {
            clearTimeout(pendingLeaves.get(userId));
            pendingLeaves.delete(userId);
            console.log(`Salida cancelada para el usuario ${userId}`);
        }

        socket.join(roomName);
        console.log(`Socket ${socket.id} se unió a la sala: ${roomName}`);
    });

    socket.on('leaveLobby', async (userId, lobbyId) => {
        console.log(`El nootas sa salio de llobby enove`);
        AuxLeaveLobby(userId, lobbyId, socket, io);
    });

    socket.on('disconnecting', async () => {
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        for (const room of rooms) {
            if (room.startsWith('lobby')) {
                const lobbyId = room.replace('lobby', '');
                const userId = socket.userId;

                if (userId) {
                    AuxLeaveLobby(userId, lobbyId, socket, io);
                }
            }
        }
    });
};

const AuxLeaveLobby = async (userId, lobbyId, socket, io) => {
    // Lo sacamos de la sala de socket para que no reciba más mensajes
        socket.leave(`lobby${lobbyId}`);

        const timeoutId = setTimeout(async () => {
            try {
                await lobbyService.leaveLobby({ lobbyId: Number(lobbyId), playerId: Number(userId) });
                
                io.to(`lobby${lobbyId}`).emit('lobbyUpdated');
            } catch (error) {
                console.error("Error al procesar salida del lobby:", error);
            } finally {
                // Limpiamos el mapa
                pendingLeaves.delete(userId);
            }
        }, 3000); // 3 segundos de margen

        pendingLeaves.set(userId, timeoutId);
}
    
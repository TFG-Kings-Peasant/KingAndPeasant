import { lobbyService } from '../services/LobbyService.js';


const pendingLeaves = new Map();

export const lobbySocket = (io, socket) => {
    
    socket.on('joinLobby', (roomName) => {
        const userId = socket.userId;

        if (userId && pendingLeaves.has(userId)) {

            clearTimeout(pendingLeaves.get(userId));
            pendingLeaves.delete(userId);

            console.log(`Salida cancelada para el usuario ${userId}`);
        }

        socket.join(roomName);
        io.to(roomName).emit('lobbyUpdated');

    });

    socket.on('leaveLobby', async (userId, lobbyId) => {
        AuxLeaveLobby(userId, lobbyId, socket, io);
    });

    socket.on('disconnecting', async () => {
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        for (const room of rooms) {
           if (typeof room === 'string' && room.startsWith('lobby')) {
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
    socket.leave(`lobby${lobbyId}`);

    const timeoutId = setTimeout(async () => {
        try {
            await lobbyService.leaveLobby({ lobbyId: Number(lobbyId), playerId: Number(userId) });
            io.to(`lobby${lobbyId}`).emit('lobbyUpdated');
            io.emit('lobbyUpdated');

        } catch (error) {
            // Silenciamos los errores de "Jugador no está en el lobby" o "Lobby no encontrado"
            // ya que ocurren normalmente cuando el juego ya ha empezado o el usuario navega.
            const message = error.message;
            if (message !== 'El jugador no está en el lobby' && message !== 'Lobby no encontrado') {
                console.error("Error al procesar salida del lobby:", error);
            }
        } finally {
            pendingLeaves.delete(userId);
        }
    }, 5000);

    pendingLeaves.set(userId, timeoutId);
}
    
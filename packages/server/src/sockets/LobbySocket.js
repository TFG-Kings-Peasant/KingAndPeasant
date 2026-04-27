import { lobbyService } from '../services/LobbyService.js';

const pendingLeaves = new Map();

export const cancelLobbyLeave = (userId) => {
    const numId = Number(userId);
    if (numId && pendingLeaves.has(numId)) {
        clearTimeout(pendingLeaves.get(numId));
        pendingLeaves.delete(numId);
        console.log(`Salida cancelada para el usuario ${numId} (Entró a partida o volvió al lobby)`);
    }
};

export const lobbySocket = (io, socket) => {
    
    // 1. Aceptamos userId del cliente directamente para no depender solo de socket.userId
    socket.on('joinLobby', (roomName, clientUserId) => {
        // Forzamos a Número para que coincida siempre con la clave del Map
        const numId = Number(clientUserId || socket.userId);

        if (numId && pendingLeaves.has(numId)) {
            clearTimeout(pendingLeaves.get(numId));
            pendingLeaves.delete(numId);
            console.log(`Salida cancelada para el usuario ${numId}`);
        }

        // Lo guardamos en el socket por si hay una desconexión abrupta luego
        if (numId) socket.userId = numId;

        socket.join(roomName);
        io.to(roomName).emit('lobbyUpdated');
    });

    socket.on('leaveLobby', async (userId, lobbyId, isExplicit = false) => {
        const numId = Number(userId);

        if (isExplicit) {
            socket.leave(`lobby${lobbyId}`);
            
            if (pendingLeaves.has(numId)) {
                clearTimeout(pendingLeaves.get(numId));
                pendingLeaves.delete(numId);
            }

            try {
                await lobbyService.leaveLobby({ lobbyId: Number(lobbyId), playerId: numId });
                io.to(`lobby${lobbyId}`).emit('lobbyUpdated');
                io.emit('lobbyUpdated');
            } catch (error) {
                if (error.message !== 'El jugador no está en el lobby' && error.message !== 'Lobby no encontrado') {
                    console.error("Error al procesar salida inmediata del lobby:", error);
                }
            }
        } else {
            AuxLeaveLobby(numId, lobbyId, socket, io);
        }
    });

    socket.on('disconnecting', async () => {
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        for (const room of rooms) {
           if (typeof room === 'string' && room.startsWith('lobby')) {
                const lobbyId = room.replace('lobby', '');
                const numId = Number(socket.userId);

                if (numId) {
                    AuxLeaveLobby(numId, lobbyId, socket, io);
                }
            }
        }
    });
};

const AuxLeaveLobby = async (numId, lobbyId, socket, io) => {
    socket.leave(`lobby${lobbyId}`);

    const timeoutId = setTimeout(async () => {
        try {
            await lobbyService.leaveLobby({ lobbyId: Number(lobbyId), playerId: numId });
            io.to(`lobby${lobbyId}`).emit('lobbyUpdated');
            io.emit('lobbyUpdated');

        } catch (error) {
            if (error.message !== 'El jugador no está en el lobby' && error.message !== 'Lobby no encontrado') {
                console.error("Error al procesar salida del lobby:", error);
            }
        } finally {
            pendingLeaves.delete(numId);
        }
    }, 5000);

    pendingLeaves.set(numId, timeoutId);
}
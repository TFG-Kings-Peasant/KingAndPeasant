import { gameService } from '../services/GameService.js';



const disconnectTimers = new Map();
// Guardamos los deadlines activos por SALA para que sean persistentes
const activeDeadlines = new Map(); 

export const gameSocket = (io, socket) => {

    socket.on('joinGame', ({ roomName, userId }) => {
        const numericUserId = Number(userId); // Forzamos que sea número
        socket.join(roomName);
        socket.join(`${roomName}_user_${numericUserId}`);
        socket.userId = numericUserId; 
        socket.roomName = roomName;

        console.log(`Socket ${socket.id} (Usuario ${userId}) se unió a: ${roomName}`);

        // 1. Si EL OTRO jugador estaba desconectado, enviamos su cronómetro al que acaba de entrar
        // 2. Si YO era el que estaba desconectado, cancelamos mi timer
        const timerKey = `${roomName}-${userId}`;
        
        if (disconnectTimers.has(timerKey)) {
            clearTimeout(disconnectTimers.get(timerKey));
            disconnectTimers.delete(timerKey);
            activeDeadlines.delete(timerKey);
            
            // Avisar a todos que el usuario volvió
            io.to(roomName).emit('playerReconnected', { userId });
        }

        // Sincronización: Enviamos al usuario que entra todos los deadlines activos en esta sala
        // Esto arregla que el cronómetro desaparezca al recargar
        activeDeadlines.forEach((deadline, key) => {
            if (key.startsWith(`${roomName}-`)) {
                const dUserId = parseInt(key.split('-')[1]);
                socket.emit('playerDisconnected', { userId: dUserId, deadline });
            }
        });
    });

    // Usamos 'disconnecting' en lugar de 'disconnect' porque aún tenemos acceso a las rooms
    socket.on('disconnecting', () => {
        const userId = socket.userId;
        const roomName = socket.roomName;

        if (userId && roomName) {
            const deadline = Date.now() + 120000;
            const timerKey = `${roomName}-${userId}`;

            // Guardar para persistencia
            activeDeadlines.set(timerKey, deadline);

            // Avisar a la sala
            socket.to(roomName).emit('playerDisconnected', { userId, deadline });

            const timerId = setTimeout(async () => {
                const gameId = roomName.replace('game_', '');
                
                // 1. Verificamos quién está conectado en la sala actualmente
                const roomSockets = await io.in(roomName).fetchSockets();
                
                // 2. Obtenemos el estado para identificar al rival
                const state = await gameService.getGameStateById(gameId).catch(() => null);
                if (!state) return; // Si la partida ya se borró, no hacemos nada

                const rivalId = state.players.king.id === userId ? state.players.peasant.id : state.players.king.id;
                
                // 3. Comprobamos si el rival está entre los sockets conectados
                const isRivalConnected = roomSockets.some(s => s.userId === rivalId);
                
                // Si el rival está conectado, él gana. Si no, nadie gana.
                const winnerId = isRivalConnected ? rivalId : null;

                // 4. Ejecutamos el fin de partida en el servicio (DB + Redis)
                const finalResult = await gameService.endGameByTimeout(gameId, winnerId);

                if (finalResult) {
                    // 5. Avisamos a todos los que queden (si queda alguien) que la partida acabó
                    io.to(roomName).emit('game:finished', finalResult);
                    console.log(`Partida ${gameId} finalizada por tiempo. Ganador: ${winnerId || 'Ninguno'}`);
                }
                
                activeDeadlines.delete(timerKey);
                disconnectTimers.delete(timerKey);
            }, 120000);

            disconnectTimers.set(timerKey, timerId);
        }
    });

    socket.on('sendChatMessage', (data) => {
        const { room, sender, text } = data;
        socket.to(room).emit('receiveChatMessage', { sender, text });
    });
};



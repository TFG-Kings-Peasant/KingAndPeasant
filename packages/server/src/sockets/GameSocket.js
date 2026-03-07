
export const gameSocket = (io, socket) => {

    socket.on('joinGame', (roomName) => {
        socket.join(roomName);
        console.log(`Socket ${socket.id} se unió a la partida: ${roomName}`);
    });

    socket.on('sendChatMessage', (data) => {
        const { room, sender, text } = data;
        
        socket.to(room).emit('receiveChatMessage', { sender, text });
    });

};
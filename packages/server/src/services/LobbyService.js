import { prisma } from '../../config/db.js';

const getAllLobbies = async () => {
    // Aquí usas Prisma para buscar en la BD
    return await prisma.lobby.findMany();
};

const getLobbyById = async (id) => {
    return await prisma.lobby.findUnique({
        where: { id : id },
    });
};

const createLobby = async (data) => {
    // Aquí podrías añadir validaciones de negocio antes de guardar
    // Por ejemplo: verificar si el rey ya existe
    return await prisma.lobby.create({
        data: {
            name: data.name,
            status: data.status,
            privacy: data.privacy,
            player1Id: data.player1Id
        },
    });
};

const joinLobby = async ({ lobbyId, player2Id }) => {
    const lobby = await getLobbyById(lobbyId);

    if (!lobby) {
        throw new Error('Lobby no encontrado');
    }

    if (lobby.player2Id) {
        throw new Error('El lobby ya está lleno');
    }

    return await prisma.lobby.update({
        where: { id: lobbyId },
        data: { player2Id: player2Id },
    });
};

const leaveLobby = async ({ lobbyId, playerId }) => {
    const lobby = await getLobbyById(lobbyId);

    if (!lobby) {
        throw new Error('Lobby no encontrado');
    }

    if (lobby.player1Id !== playerId && lobby.player2Id !== playerId) {
        throw new Error('El jugador no está en el lobby');
    }

    let updateData = {};

    if(lobby.player1Id === playerId){
        if(lobby.player2Id !== null){
            updateData = {
                player1Id: lobby.player2Id,
                player1Ready: lobby.player2Ready,
                player2Ready: false,
                player2Id: null,}
        }else{
            return await prisma.lobby.delete({ where: { id: lobbyId } });
        }
    }else{
        updateData = { player2Id: null, player2Ready: false };
    }
    

    return await prisma.lobby.update({
        where: { id: lobbyId },
        data: updateData,
    });
}

const setPlayerReady = async ({ lobbyId, playerId, isReady }) => {
    const lobby = await getLobbyById(lobbyId);

    if (!lobby) {
        throw new Error('Lobby no encontrado');
    }

    let updateData = {};

    if(lobby.player1Id === playerId){
        updateData = { player1Ready: isReady };
    }else if(lobby.player2Id === playerId){
        updateData = { player2Ready: isReady };
    }else{
        throw new Error('El jugador no está en el lobby');
    }

    return await prisma.lobby.update({
        where: { id: lobbyId },
        data: updateData,
    });
}

export const lobbyService = {
    getAllLobbies,
    getLobbyById,
    createLobby,
    joinLobby,
    leaveLobby,
    setPlayerReady
};
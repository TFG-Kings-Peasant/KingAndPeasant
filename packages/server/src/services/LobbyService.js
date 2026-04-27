import { prisma } from '../../config/db.js';

const getAllLobbies = async () => {
    return await prisma.lobby.findMany();
};

const getLobbyById = async (id) => {
    return await prisma.lobby.findUnique({
        where: { id: id },
    });
};

const getUserActiveLobby = async (userId) => {
    return await prisma.lobby.findFirst({
        where: {
            OR: [
                { player1Id: Number(userId) },
                { player2Id: Number(userId) }
            ]
        }
    });
};

const createLobby = async (data) => {
    // 1. Comprobar si el usuario ya está en un lobby
    const activeLobby = await getUserActiveLobby(data.player1Id);
    if (activeLobby) {
        throw new Error('El usuario ya se encuentra en otra sala.');
    }

    // 2. Comprobar si el nombre ya existe
    const existingLobby = await prisma.lobby.findUnique({
        where: { name: data.name },
    });

    if (existingLobby) {
        throw new Error('Ya existe una sala con ese nombre. Por favor elige otro nombre.');
    }

    return await prisma.lobby.create({
        data: {
            name: data.name,
            status: data.status || 'WAITING',
            privacy: data.privacy,
            player1Id: data.player1Id
        },
    });
};

const joinLobby = async ({ lobbyId, player2Id }) => {
    // 1. Comprobar si el jugador que se une ya está en un lobby
    const activeLobby = await getUserActiveLobby(player2Id);
    if (activeLobby) {
        throw new Error('Ya perteneces a otra sala.');
    }

    const lobby = await getLobbyById(lobbyId);

    if (!lobby) {
        throw new Error('Lobby no encontrado');
    }

    // 2. Comprobar si el lobby es privado
    if (lobby.privacy === 'PRIVATE') {
        throw new Error('No puedes unirte a una partida privada sin invitación.');
    }

    // 3. Comprobar si el lobby ya está lleno
    if (lobby.player2Id) {
        throw new Error('El lobby ya está lleno');
    }

    if (lobby.player1Id === player2Id) {
        throw new Error("Ya formas parte de esta sala como creador.");
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

    if (lobby.status === 'ONGOING') {
        return lobby; 
    }

    let updateData = {};

    if (lobby.player1Id === playerId) {
        if (lobby.player2Id !== null) {
            updateData = {
                player1Id: lobby.player2Id,
                player1Ready: lobby.player2Ready,
                player2Ready: false,
                player2Id: null,
            }
        } else {
            return await prisma.lobby.delete({ where: { id: lobbyId } });
        }
    } else {
        updateData = { player2Id: null, player2Ready: false };
    }

    return await prisma.lobby.update({
        where: { id: lobbyId },
        data: updateData,
    });
};

const setPlayerReady = async ({ lobbyId, playerId, isReady }) => {
    const lobby = await getLobbyById(lobbyId);

    if (!lobby) {
        throw new Error('Lobby no encontrado');
    }

    let updateData = {};

    if (lobby.player1Id === playerId) {
        updateData = { player1Ready: isReady };
    } else if (lobby.player2Id === playerId) {
        updateData = { player2Ready: isReady };
    } else {
        throw new Error('El jugador no está en el lobby');
    }

    return await prisma.lobby.update({
        where: { id: lobbyId },
        data: updateData,
    });
};

const setLobbyOngoing = async (id) => {
    const lobby = await getLobbyById(id);
    if (!lobby) throw new Error('Lobby no encontrado');

    return await prisma.lobby.update({
        where: { id: id },
        data: { status: 'ONGOING' }
    });
};

const setLobbyWaiting = async (id) => {
    const lobby = await getLobbyById(id);
    if (!lobby) throw new Error('Lobby no encontrado');

    return await prisma.lobby.update({
        where: { id: id },
        data: { status: 'WAITING' }
    });
};

export const lobbyService = {
    getAllLobbies,
    getLobbyById,
    createLobby,
    joinLobby,
    leaveLobby,
    setPlayerReady,
    setLobbyOngoing,
    getUserActiveLobby,
    setLobbyWaiting
};
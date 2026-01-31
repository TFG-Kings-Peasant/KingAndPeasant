import { prisma } from '../../config/db.js';

const getAllLobbies = async () => {
    // Aquí usas Prisma para buscar en la BD
    return await prisma.lobby.findMany();
};

const createLobby = async (data) => {
    // Aquí podrías añadir validaciones de negocio antes de guardar
    // Por ejemplo: verificar si el rey ya existe
    return await prisma.lobby.create({
        data: {
            name: data.name,
            status: data.status,
            privacy: data.privacy,
            player1: data.player1
        },
    });
};

export const lobbyService = {
    getAllLobbies,
    createLobby,
};
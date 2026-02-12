import { redisClient } from '../../config/redis.js';

const createGame = async ( lobbyId, player1Id, player2Id) => {

    const initialState = {
        era: 1, 
        turnNumber: 1,
        turn: "peasant",
        deck: [1,2,3,4,5,6,7,8,9,10],
        discardPile: [],
        players:{
            king: {
                id: player1Id,
                hand: [11,12,13],
                town: []
            },
            peasant: {
                id: player2Id,
                hand:[14,15,16],
                town: []
            }
        }
    }
    return await redisClient.set(`game:${lobbyId}`, JSON.stringify(initialState))

};

const getGameStateById = async (id) => {
    const gameState = await redisClient.get(`game:${id}`);
    return JSON.parse(gameState);
}

export const gameService = {
    createGame,
    getGameStateById
};
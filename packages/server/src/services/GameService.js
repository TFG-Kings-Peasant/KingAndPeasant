import { redisClient } from '../../config/redis.js';

const CreateGame = async (gameData) => {

    const initialState = {
        era: 1, 
        turnNumber: 1,
        turn: "peasant",
        deck: gameData.deck,
        discardPile: gameData.discardPile,
        players:{
            king: {
                id: gameData.player1Id,
                hand: gameData.player1Hand,
                town: gameData.player1Town
            },
            peasant: {
                id: gameData.player2Id,
                hand: gameData.player2Hand,
                town: gameData.player2Town
            }
        }
    }
    return await redisClient.set(`game:${gameData.lobbyId}`, JSON.stringify(initialState))

};

export const GameService = {
    CreateGame
};
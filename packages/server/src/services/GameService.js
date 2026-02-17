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

const exampleAction = async (id, playerId) => {
    var gameState = await getGameStateById(id)

    if(gameState.turn == "peasant" && playerId==gameState.players.peasant.id){
        gameState.turn = "king"
        console.log("Cambio a king"+ gameState.turn)
    }else if(gameState.turn == "king" && playerId==gameState.players.king.id){
        gameState.turn = "peasant"
        console.log("Cambio a peasant: " + gameState.turn)
    }else{
        throw new Error('No es el turno del jugador');
    }

    return await redisClient.set(`game:${id}`, JSON.stringify(gameState))
}

export const gameService = {
    createGame,
    getGameStateById,
    exampleAction
};
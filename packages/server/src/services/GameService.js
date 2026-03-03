import { redisClient } from '../../config/redis.js';
import { prisma } from '../../config/db.js';

function shuffleArray(array) {
    for (let i = array.length -1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i +1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const createGame = async ( lobbyId, player1Id, player2Id) => {
    const catalog = await prisma.card.findMany();
    const deck = [];
    catalog.forEach(card => {
        for(let i = 0; i < card.copies; i++) {
            deck.push({
                uid: `game_${lobbyId}_card_${card.id}_copy_${i}`,
                templateId: card.id,
                isRevealed: false
            })
        }
    })
    shuffleArray(deck);
    const handKing = deck.splice(0,5);
    const handPeasant = deck.splice(0,5);
    const initialState = {
        era: 1, 
        turnNumber: 1,
        turn: "peasant",
        deck: deck,
        discardPile: [],
        players:{
            king: {
                id: player1Id,
                hand: handKing,
                town: []
            },
            peasant: {
                id: player2Id,
                hand:handPeasant,
                town: []
            }
        }
    }
    await redisClient.set(`game:${lobbyId}`, JSON.stringify(initialState))
    return initialState;
};

const getGameStateById = async (id) => {
    const gameState = await redisClient.get(`game:${id}`);
    return JSON.parse(gameState);
}

const exampleAction = async (id, playerId) => {
    var gameState = await getGameStateById(id);

    if(gameState.turn == "peasant" && playerId==gameState.players.peasant.id){
        gameState.turn = "king"
        console.log("Cambio a king: "+ gameState.turn)
    }else if(gameState.turn == "king" && playerId==gameState.players.king.id){
        gameState.turn = "peasant"
        console.log("Cambio a peasant: " + gameState.turn)
    }else{
        throw new Error('No es el turno del jugador');
    }

    return await redisClient.set(`game:${id}`, JSON.stringify(gameState))
}

const getGameStateDTO = async (gameState, userId) => {
    const dto = JSON.parse(JSON.stringify(gameState));

    dto.deckCount = dto.deck.length;
    delete dto.deck;

    const isKing = userId === dto.players.king.id;
    const isPeasant = userId === dto.players.peasant.id;

    if (isKing) {
        dto.players.peasant.hand = dto.players.peasant.hand.map(card => ({
            uid: card.uid
        }));
        dto.players.peasant.town = dto.players.peasant.town.map(card => 
            card.isRevealed ? card : {uid: card.uid}
        );
    } else if (isPeasant) {
        dto.players.king.hand = dto.players.king.hand.map(card => 
            card.isRevealed ? card : {uid: card.uid}
        );
    }

    return dto;
};

export const gameService = {
    createGame,
    getGameStateById,
    exampleAction,
    getGameStateDTO,
    shuffleArray
};
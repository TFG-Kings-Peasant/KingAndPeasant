import { redisClient } from '../../config/redis.js';
import { prisma } from '../../config/db.js';
import { peasantActionCards } from '../game/cards/peasantActionCards.js';
import { pendingActionResolvers } from '../game/cards/peasantPendingActions.js';

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
                type: card.type,
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
            //Si queremos asignar los roles random, habria que cambiar esto
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
        },
        pendingAction: null
    }
    return await saveAndFormatGameState(lobbyId, initialState);
};

const getGameStateById = async (id) => {
    const gameState = await redisClient.get(`game:${id}`);
    if (!gameState) {
        throw new Error('La partida no existe o ha expirado');
    }
    return JSON.parse(gameState);
}

const saveAndFormatGameState = async (lobbyId, gameState) => {
    const result = await redisClient.set(`game:${lobbyId}`, JSON.stringify(gameState));
    if (result !== 'OK') {
        throw new Error('Error al guardar el estado del juego');
    }
    return transformGameStateDTO(gameState);
}

const getGameStateDTO = async (lobbyId) => {
    const gameState = await getGameStateById(lobbyId);
    return transformGameStateDTO(gameState);
}

//Obtiene el GameState y devuelve los DTOs
const transformGameStateDTO = (gameState) => {
    const dtoKing = JSON.parse(JSON.stringify(gameState));
    dtoKing.deckCount = dtoKing.deck.length;
    delete dtoKing.deck;
    const dtoPeasant = JSON.parse(JSON.stringify(gameState));
    dtoPeasant.deckCount = dtoPeasant.deck.length;
    delete dtoPeasant.deck;

    dtoKing.players.peasant.hand = dtoKing.players.peasant.hand.map(card => ({
        uid: card.uid
    }));
    dtoKing.players.peasant.town = dtoKing.players.peasant.town.map(card => 
        card.isRevealed ? card : {uid: card.uid}
    );

    dtoPeasant.players.king.hand = dtoPeasant.players.king.hand.map(card => ({
        uid: card.uid
    }));
    dtoPeasant.players.king.town = dtoPeasant.players.king.town.map(card => 
        card.isRevealed ? card : {uid: card.uid}
    );
    
    return {dtoKing, dtoPeasant};
};

const playCard = async (lobbyId, cardUid, targetData, userId) => {
    let gameState = await getGameStateById(lobbyId);
    const userRol = gameState.players.king.id === userId ? "king" : "peasant";
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    const cardIndex = gameState.players[userRol].hand.findIndex(card => card.uid === cardUid);
    if (cardIndex === -1) {
        throw new Error('Carta no encontrada en la mano del jugador');
    }
    const [playedCard] = gameState.players[userRol].hand.splice(cardIndex, 1);
    if (playedCard.type === 'Action') {
        return await playActionCard(lobbyId, targetData, playedCard, userRol, gameState);
    }
    else {
        throw new Error('Solo se pueden jugar cartas de acción por ahora');
    }
}


const playActionCard = async (lobbyId,targetData, playedCard, userRol, gameState) => {
    playedCard.isRevealed = true;
    gameState.discardPile.push(playedCard);
    //Ejecutar efecto de carta
    if (userRol === "peasant") {
        const action = peasantActionCards[playedCard.templateId];
        if (!action) {
        throw new Error('Carta de acción no existe');
        }
        //Actualizar estado del juego
        gameState = action(gameState, targetData);
    } else {
        //Aquí se implementarían las cartas de acción del rey
        throw new Error('Las cartas de acción del rey aún no están implementadas');
    }   
    //Guardar estado actualizado
    return await saveAndFormatGameState(lobbyId, gameState);
}

const resolvePendingAction = async (lobbyId, userId, targetData) => {
    let gameState = await getGameStateById(lobbyId);
    /* Formato del pendingAction
    gameState.pendingAction = {
        player: 'peasant',
        type: 'RALLY',
    };
    */
    const userRol = gameState.players.king.id === userId ? "king" : "peasant";
    const pendingAction = gameState.pendingAction;
    //Comprobacion de acción pendiente para el jugador
    if (pendingAction && pendingAction.player === userRol) {
        if (userRol === 'peasant') {
            const resolver = pendingActionResolvers[pendingAction.type];
            if (!resolver) {
                throw new Error(`Resolutor no encontrado para la acción: ${pendingAction.type}`);
            }
            gameState = resolver(gameState, targetData);
        } else {
            throw new Error('Acciones pendientes del rey aún no implementadas');
        }    
    } else {
        throw new Error('No hay acciones pendientes para este jugador');
    }
    gameState.pendingAction = null;
    return await saveAndFormatGameState(lobbyId, gameState);
}

export const gameService = {
    createGame,
    getGameStateById,
    playActionCard,
    getGameStateDTO,
    shuffleArray,
    resolvePendingAction,
    playCard
};
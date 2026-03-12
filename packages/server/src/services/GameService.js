import { redisClient } from '../../config/redis.js';
import { prisma } from '../../config/db.js';
import { peasantActionCards } from '../game/cards/peasantActionCards.js';
import { peasantPendingActions } from '../game/cards/peasantPendingActions.js';
import { canInfiltrate, changeTurn, drawCardFromDeck, getCardType, getUserRol, shuffleArray } from '../utils/helpers.js';
import { kingActionCards } from '../game/cards/kingActionCards.js';
import { kingPendingActions } from '../game/cards/kingPendingActions.js';
import {rebelCards} from '../game/cards/rebelCards.js'
import {guardCards} from '../game/cards/guardCards.js'


const createGame = async ( gameId, player1Id, player2Id) => {
    const catalog = await prisma.card.findMany();
    const deck = [];
    catalog.forEach(card => {
        for(let i = 0; i < card.copies; i++) {
            deck.push({
                uid: `game_${gameId}_card_${card.id}_copy_${i}`,
                templateId: card.id,
                typeKing: card.typeKing,
                typePeasant: card.typePeasant,
                isRevealed: false
            })
        }
    })
    shuffleArray(deck);
    const handKing = deck.splice(0,5);
    const handPeasant = deck.splice(0,5);

    /*Forzar la carta de acción
    const targetCardId = 15; 
    
    const cardIndex = deck.findIndex(card => card.templateId === targetCardId);
    
    if (cardIndex !== -1) {
        const [testCard] = deck.splice(cardIndex, 1);
        handPeasant[0] = testCard; 
    }
    */
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
    return await saveAndFormatGameState(gameId, initialState);
};

const getGameStateById = async (id) => {
    const gameState = await redisClient.get(`game:${id}`);
    if (!gameState) {
        throw new Error('La partida no existe o ha expirado');
    }
    return JSON.parse(gameState);
}

const saveAndFormatGameState = async (gameId, gameState) => {
    const result = await redisClient.set(`game:${gameId}`, JSON.stringify(gameState));
    if (result !== 'OK') {
        throw new Error('Error al guardar el estado del juego');
    }
    return transformGameStateDTO(gameState);
}

const getGameStateDTO = async (gameId) => {
    const gameState = await getGameStateById(gameId);
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

const playTownCard = async (gameId, cardUid, targetData, userId) => {
    let gameState = await getGameStateById(gameId);
    const userRol = getUserRol(gameState, userId);
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    const cardIndex = gameState.players[userRol].town.findIndex(card => card.uid === cardUid);

    if (cardIndex === -1) {
        throw new Error('Carta no encontrada en el pueblo del jugador');
    }
    const playedCard = gameState.players[userRol].town[cardIndex];

    if(userRol==='king'){
        return await activateCard(gameId, targetData, playedCard, userRol, gameState);
    }else{
        if(playedCard.isRevealed){
            return await returnRebeldToHand(gameId, gameState, cardIndex)
        }else{
            return await activateCard(gameId, targetData, playedCard, userRol, gameState);
        }
    }
}

const activateCard = async (gameId, targetData, playedCard, userRol, gameState) => {
    playedCard.isRevealed = true;
    if (userRol === "peasant") {
        const action = rebelCards[playedCard.templateId];
        if (!action) {
            throw new Error('Carta de Rebel no existe');
        }
        gameState = action(gameState, playedCard);
    } else {
        const action = guardCards[playedCard.templateId];
        if (!action) {
            throw new Error('Carta de Guard no existe');
        }
        gameState = action(gameState, playedCard)
    }   
    changeTurn(gameState); // Esto no va aqui, deberia depender de si se ha acabado la pending action.

    return await saveAndFormatGameState(gameId, gameState);
}

const returnRebeldToHand = async (gameId, gameState, cardIndex) => {
    const [card] = gameState.players.peasant.town.splice(cardIndex, 1);
    gameState.players.peasant.hand.push(card)
    changeTurn(gameState);

    return await saveAndFormatGameState(gameId, gameState);
}

const passTurn = async (gameId, userId) => {
    let gameState = await getGameStateById(gameId);
    const userRol = getUserRol(gameState, userId);
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    gameState = changeTurn(gameState);
    return await saveAndFormatGameState(gameId, gameState);
}

const playHandCard = async (gameId, cardUid, targetData, userId) => {
    let gameState = await getGameStateById(gameId);
    const userRol = getUserRol(gameState, userId);
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    const cardIndex = gameState.players[userRol].hand.findIndex(card => card.uid === cardUid);
    if (cardIndex === -1) {
        throw new Error('Carta no encontrada en la mano del jugador');
    }
    const [playedCard] = gameState.players[userRol].hand.splice(cardIndex, 1);
    const cardType = getCardType(playedCard, userRol);
    if (cardType === 'Action') {
        return await playActionCard(gameId, targetData, playedCard, userRol, gameState);
    }else {
        return await placeCardInTown(gameId, playedCard, userRol, gameState)
    }
}

const playActionCard = async (gameId,targetData, playedCard, userRol, gameState) => {
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
        const action = kingActionCards[playedCard.templateId];
        if (!action) {
            throw new Error('Carta de acción no existe');
        }
        gameState = action(gameState, targetData)
    }   
    //Guardar estado actualizado
    return await saveAndFormatGameState(gameId, gameState);
}

const resolvePendingAction = async (gameId, userId, targetData) => {
    let gameState = await getGameStateById(gameId);
    /* Formato del pendingAction
    gameState.pendingAction = {
        player: 'peasant',
        type: 'RALLY',
    };
    */
    const userRol = Number(gameState.players.king.id) === Number(userId) ? "king" : "peasant";
    const pendingAction = gameState.pendingAction;
    //Comprobacion de acción pendiente para el jugador
    if (pendingAction && pendingAction.player === userRol) {
        if (userRol === 'peasant') {
            const resolver = peasantPendingActions[pendingAction.type];
            if (!resolver) {
                throw new Error(`Resolutor no encontrado para la acción: ${pendingAction.type}`);
            }
            gameState = resolver(gameState, targetData);
        } else {
            const resolver = kingPendingActions[pendingAction.type];
            if (!resolver) {
                throw new Error(`Resolutor no encontrado para la acción: ${pendingAction.type}`)
            }
            gameState = resolver(gameState, targetData); 
        }    
    } else {
        throw new Error('No hay acciones pendientes para este jugador');
    }
    gameState.pendingAction = null;
    changeTurn(gameState);
    return await saveAndFormatGameState(gameId, gameState);
}

const placeCardInTown = async (gameId, playedCard, userRol, gameState) => {
        if(userRol=== 'peasant'){
            playedCard.isRevealed = false
            gameState.players.peasant.town.push(playedCard);
        }else{
            playedCard.isRevealed = true
            gameState.players.king.town.push(playedCard);
        }
        gameState.pendingAction = null;
        changeTurn(gameState);

        return await saveAndFormatGameState(gameId, gameState);
}

const condemnARebel = async (gameId, isDeck, cardUid, userId) => {
    let gameState = await getGameStateById(gameId);
    const userRol = getUserRol(gameState, userId);
    if(userRol==='peasant'){
        throw new Error('El campesino no puede condenar rebeldes');
    }
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    let cardIndex = null
    let card = null
    if(isDeck){
        card = gameState.deck.splice(gameState.deck.length - 1, 1)[0];
    }else{  
        cardIndex = gameState.players.peasant.town.findIndex(card => card.uid === cardUid);
        card = gameState.players.peasant.town.splice(cardIndex, 1)[0];
    }
    if(!card)
    {
        throw new Error('Carta no encontrada');
    }else if(card.isRevealed)
    {
        throw new Error('No se puede condenar a un rebelde revelado');
    }
    card.isRevealed = true;
    //TODO: CONDICIÓN DE VICTORIA: Si la carta condenada es el Asesino, el rey gana, en caso contrario, el rey pierde.
    console.log("Un rebelde a sido condenado, esta era ha acabado. TODO: Evaluar de quien es la victoria")
    return await saveAndFormatGameState(gameId, gameState);

}

const peasantDrawACard = async (gameId, userId) => {
    let gameState = await getGameStateById(gameId);
    const userRol = Number(gameState.players.king.id) === Number(userId) ? "king" : "peasant";
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    if(userRol !== "peasant"){
        throw new Error('Solo el campesino puede realizar la acción de robar carta');
    }
    gameState = drawCardFromDeck(gameState, userRol)
    changeTurn(gameState);
    return await saveAndFormatGameState(gameId, gameState);
}



export const gameService = {
    createGame,
    getGameStateById,
    playActionCard,
    getGameStateDTO,
    shuffleArray,
    resolvePendingAction,
    playHandCard,
    playTownCard,
    peasantDrawACard,
    passTurn,
    condemnARebel
};
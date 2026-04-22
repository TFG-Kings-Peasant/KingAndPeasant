import { redisClient } from '../../config/redis.js';
import { prisma } from '../../config/db.js';
import { lobbyService } from './LobbyService.js';
import { peasantActionCards } from '../game/cards/peasantActionCards.js';
import { peasantPendingActions } from '../game/cards/peasantPendingActions.js';
import { canInfiltrate, changeTurn, drawCardFromDeck, getCardType, getUserRol, shuffleArray, checkTownGuards } from '../utils/helpers.js';
import { kingActionCards } from '../game/cards/kingActionCards.js';
import { kingPendingActions } from '../game/cards/kingPendingActions.js';
import {rebelCards} from '../game/cards/rebelCards.js'
import {guardCards} from '../game/cards/guardCards.js'

const setupNewEra = async (gameId, nextKingId, nextPeasantId, currentEra, currentScores, startedAt) => {
    const catalog = await prisma.card.findMany();

    let deck = [];
    let handKing = [];
    let handPeasant = [];

    catalog.forEach(card => {
        for(let i = 0; i < card.copies; i++) {
            const newCard = {
                uid: `game_${gameId}_card_${card.id}_copy_${i}`,
                templateId: card.id,
                typeKing: card.typeKing,
                typePeasant: card.typePeasant,
                isRevealed: false
            };

            if (card.id === 9) handKing.push(newCard);
            else if (card.id === 13 || card.id === 16) handPeasant.push(newCard);
            else deck.push(newCard);
        }
    });
    shuffleArray(deck);
    handKing.push(...deck.splice(0,4));
    handPeasant.push(...deck.splice(0,3));
    return {
        startedAt: startedAt,
        era: currentEra + 1,
        scores: currentScores, 
        turnNumber: 1,
        turn: "peasant", 
        deck: deck,
        discardPile: [],
        players: {
            king: { id: nextKingId, hand: handKing, town: [] },
            peasant: { id: nextPeasantId, hand: handPeasant, town: [] }
        },
        pendingAction: null,
        lastEvent: null
    };
}

const createGame = async ( lobbyId, player1Id, player2Id) => {
    const initialScores = {
        [player1Id]: 0,
        [player2Id]: 0
    };

    await lobbyService.setLobbyOngoing(lobbyId);

    const initialState = await setupNewEra(lobbyId, player1Id, player2Id, 0, initialScores, new Date());
    
    return await saveAndFormatGameState(lobbyId, initialState);
};

const getGameStateById = async (id) => {
    const gameState = await redisClient.get(`game:${id}`);
    if (!gameState) {
        throw new Error('La partida no existe o ha expirado');
    }
    return JSON.parse(gameState);
}

const saveAndFormatGameState = async (gameId, gameState) => {
    const winStatus = await checkWinCondition(gameState); 

    if (winStatus && winStatus.isGameOver) {
        const kingId = gameState.players.king.id;
        const peasantId = gameState.players.peasant.id;
        const winnerId = winStatus.winnerId;
        const loserId = winnerId === kingId? peasantId : kingId;

        gameState.scores[winnerId] += 1;
        

        if(gameState.scores[winnerId] >= 2) {
            await prisma.game.create({
                data: {
                    player1Id: kingId,
                    player2Id: peasantId,
                    winnerId: winnerId,
                    reason: winStatus.reason,
                    startedAt: new Date(gameState.startedAt)
                }
            });

            await prisma.user.update({
                where: { idUser: winnerId },
                data: { games: {increment: 1}, wins: {increment: 1} }
            });

            await prisma.user.update({
                where: {idUser: loserId},
                data: { games: {increment: 1}, losses: {increment: 1}}
            });

            await lobbyService.setLobbyWaiting(Number(gameId));

            await redisClient.del(`game:${gameId}`);
            return winStatus;
        } else {
            gameState = await setupNewEra(
                gameId, 
                winnerId, 
                loserId, 
                gameState.era, 
                gameState.scores, 
                gameState.startedAt
            );
        }
    }

    if (!gameState.pendingAction) {
        // Buscamos si el Rey tiene el Decoy (templateId === 13) en la mano
        const decoyIndex = gameState.players.king.hand.findIndex(card => Number(card.templateId) === 13);
        
        if (decoyIndex !== -1) {
            // Exiliar el DECOY: Lo eliminamos directamente de la partida
            gameState.players.king.hand.splice(decoyIndex, 1);
            
            // Le damos una acción obligatoria al campesino para que elimine un guardia
            gameState.pendingAction = {
                type: 'DECOY',
                player: 'peasant'
            };
            
            // Aseguramos que el turno lo tiene el campesino para que pueda actuar
            gameState.turn = 'peasant';
        }
    }

    delete gameState.lastEvent;
    
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
    const dtoPeasant = JSON.parse(JSON.stringify(gameState));

    const deck = dtoKing.deck.map(card => card.isRevealed ? card : {uid: card.uid});

    dtoKing.deck = deck;
    dtoPeasant.deck = deck;

    dtoKing.players.peasant.hand = dtoKing.players.peasant.hand.map(card => 
        card.isRevealed ? card : {uid: card.uid}
    );
    dtoKing.players.peasant.town = dtoKing.players.peasant.town.map(card => 
        card.isRevealed ? card : {uid: card.uid}
    );

    dtoPeasant.players.king.hand = dtoPeasant.players.king.hand.map(card =>
        card.isRevealed ? card : {uid: card.uid}
    );
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

    if (gameState.pendingAction) {
        throw new Error('Debes resolver la acción pendiente antes de realizar otra acción');
    }

    const cardIndex = gameState.players[userRol].town.findIndex(card => card.uid === cardUid);

    if (cardIndex === -1) {
        throw new Error('Carta no encontrada en el pueblo del jugador');
    }
    const playedCard = gameState.players[userRol].town[cardIndex];

    if(userRol==='king'){
        gameState.players[userRol].town.splice(cardIndex, 1);

        return await activateCard(gameId, playedCard, cardIndex, userRol, gameState);
    }else{
        if(playedCard.isRevealed){
            return await returnRebeldToHand(gameId, gameState, cardIndex);

        }else if(canInfiltrate(playedCard) && !(playedCard.templateId === 16 && gameState.players.king.town.length === 0)){
            
            return await infiltrateRebel(gameId, cardIndex, gameState);
        }else{
            return await activateCard(gameId, playedCard, cardIndex, userRol, gameState);
        }
    }
}

const infiltrateRebel = async (gameId, cardIndex, gameState) => {
    gameState.pendingAction = {
        type: "INFILTRATE",
        player: "peasant"
    };
    
    return await saveAndFormatGameState(gameId, gameState);
}

const activateCard = async (gameId, playedCard, cardIndex, userRol, gameState) => {
    if (userRol === "peasant") {
        const action = rebelCards[playedCard.templateId];
        if (!action) {
            throw new Error('Carta de Rebel no existe');
        }
        gameState.players.peasant.town[cardIndex].isRevealed = true;
        gameState = action(gameState, playedCard);

    } else {
        const action = guardCards[playedCard.templateId];
        if (!action) {
            throw new Error('Carta de Guard no existe');
        }
        gameState = action(gameState, playedCard)
        if(playedCard.templateId !== 9){
            gameState.discardPile.push(playedCard); 
        }
    }   
    if (!gameState.pendingAction) {
        gameState = changeTurnAndCheckDraw(gameState, userRol);
    }
    return await saveAndFormatGameState(gameId, gameState);
}

const returnRebeldToHand = async (gameId, gameState, cardIndex) => {
    const [card] = gameState.players.peasant.town.splice(cardIndex, 1);
    card.isRevealed = false;
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
    if (gameState.pendingAction) {
        throw new Error('Debes resolver la acción pendiente antes de realizar otra acción');
    }
    gameState = changeTurnAndCheckDraw(gameState, userRol);
    return await saveAndFormatGameState(gameId, gameState);
}

const playHandCard = async (gameId, cardUid, targetData, userId) => {
    let gameState = await getGameStateById(gameId);
    const userRol = getUserRol(gameState, userId);
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    if (gameState.pendingAction) {
        throw new Error('Debes resolver la acción pendiente antes de realizar otra acción');
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
    playedCard.isRevealed = true;
    gameState.discardPile.push(playedCard); 
    if (!gameState.pendingAction) {
        gameState.turn = gameState.turn === 'king' ? 'peasant' : 'king';
    }
    //Guardar estado actualizado
    return await saveAndFormatGameState(gameId, gameState);
}

const resolvePendingAction = async (gameId, userId, targetData) => {
    let gameState = await getGameStateById(gameId);

    const userRol = getUserRol(gameState, userId);
    const pendingAction = gameState.pendingAction;
    //Comprobacion de acción pendiente para el jugador
    if (pendingAction && pendingAction.player === userRol) {
        targetData = pendingAction.amount ? {...targetData, amount: pendingAction.amount} : targetData;
        gameState.pendingAction = null;
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
            if(pendingAction.type === 'INQUISITOR'){
                const result = resolver(gameState, targetData);
                const cardIndex = gameState.players[userRol].town.findIndex(card => card.uid === result.handCard);

                gameState.players[userRol].town.splice(cardIndex, 1);


                return await activateCard(gameId, result.handCard, cardIndex, userRol, result.gameState);
            }else{
                gameState = resolver(gameState, targetData);
            }
        }    
    } else {
        throw new Error('No hay acciones pendientes para este jugador');
    }
    if (!gameState.pendingAction) {
        gameState = changeTurnAndCheckDraw(gameState, userRol);
    }
    return await saveAndFormatGameState(gameId, gameState);
}

const checkWinCondition = async (gameState) => {
    const deckCount = gameState.deck.length;
    const discardPile = gameState.discardPile;
    const kingHand = gameState.players.king.hand;
    const kingTown = gameState.players.king.town;
    const peasantTown = gameState.players.peasant.town;
    if (gameState.lastEvent === 'KING_REVEALED_ASSASSIN') {
        return { isGameOver: true, winnerId: gameState.players.king.id, reason: 'ASSASSIN_EXPOSED' };
    }

    if (discardPile.some(card => Number(card.templateId) === 16)) {
        return { isGameOver: true, winnerId: gameState.players.king.id, reason: 'ASSASSIN_EXPOSED' };
    } 
    if (deckCount === 0 && !gameState.pendingAction) {
        return { isGameOver: true, winnerId: gameState.players.king.id, reason: 'PEASANT_DECK_EMPTY' };
    }
    if (kingHand.some(card => Number(card.templateId) === 16) || 
        peasantTown.some(card => Number(card.templateId) === 16 && card.isRevealed && kingTown.length === 0)) {
        return { isGameOver: true, winnerId: gameState.players.peasant.id, reason: 'ASSASSIN_STRIKE' };
    }
    if (gameState.lastEvent === 'CONDEMN_FAIL') {
        return { isGameOver: true, winnerId: gameState.players.peasant.id, reason: 'ASSASSIN_STRIKE' };
    }
    return { isGameOver: false};
}

const placeCardInTown = async (gameId, playedCard, userRol, gameState) => {
        if(userRol=== 'peasant'){
            playedCard.isRevealed = false
            gameState.players.peasant.town.push(playedCard);
        }else{
            checkTownGuards(gameState);
            playedCard.isRevealed = true
            gameState.players.king.town.push(playedCard);
        }
        gameState.pendingAction = null;
        gameState = changeTurnAndCheckDraw(gameState, userRol);

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
    if (gameState.pendingAction) {
        throw new Error('Debes resolver la acción pendiente antes de realizar otra acción');
    }
    let cardIndex = null
    let card = null
    if(isDeck){
        card = gameState.deck.splice(gameState.deck.length - 1, 1)[0];
    }else{  
        cardIndex = gameState.players.peasant.town.findIndex(card => card.uid === cardUid);
        if (cardIndex === -1) {
            throw new Error('Carta no encontrada en el pueblo');
        }
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
    gameState.discardPile.push(card);

    if (Number(card.templateId) !== 16) {
        gameState.lastEvent = 'CONDEMN_FAIL';
    }

    return await saveAndFormatGameState(gameId, gameState);

}

const peasantDrawACard = async (gameId, userId) => {
    let gameState = await getGameStateById(gameId);
    const userRol = Number(gameState.players.king.id) === Number(userId) ? "king" : "peasant";
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    if (gameState.pendingAction) {
        throw new Error('Debes resolver la acción pendiente antes de realizar otra acción');
    }
    if(userRol !== "peasant"){
        throw new Error('Solo el campesino puede realizar la acción de robar carta');
    }
    gameState = drawCardFromDeck(gameState, userRol)
    changeTurn(gameState);
    return await saveAndFormatGameState(gameId, gameState);
}

const changeTurnAndCheckDraw = (gameState, userRol) => {
    if(userRol !== "peasant"){
        gameState = drawCardFromDeck(gameState, userRol)
    }   
    changeTurn(gameState);
    return gameState;
}

const endGameByTimeout = async (gameId, winnerId) => {
    // Intentamos obtener el estado actual para saber quiénes eran los jugadores
    let gameState;
    try {
        gameState = await getGameStateById(gameId);
    } catch (error) {
        return null; // La partida ya no existe
    }

    const kingId = gameState.players.king.id;
    const peasantId = gameState.players.peasant.id;
    
    // Definimos el resultado
    const result = {
        isGameOver: true,
        winnerId: winnerId, // Si es null, es un empate por abandono mutuo
        reason:'DISCONNECT_TIMEOUT'
    };

    // Si hay un ganador, actualizamos estadísticas en la DB
    if (winnerId) {
        const loserId = winnerId === kingId ? peasantId : kingId;

        await prisma.game.create({
            data: {
                player1Id: kingId,
                player2Id: peasantId,
                winnerId: winnerId,
                reason: result.reason,
                startedAt: new Date(gameState.startedAt)
            }
        });

        // Sumar victoria al ganador
        await prisma.user.update({
            where: { idUser: winnerId },
            data: { games: { increment: 1 }, wins: { increment: 1 } }
        });

        // Sumar derrota al perdedor
        await prisma.user.update({
            where: { idUser: loserId },
            data: { games: { increment: 1 }, losses: { increment: 1 } }
        });
    } else {
        // Registro de partida terminada sin ganador (ambos se fueron)
        await prisma.game.create({
            data: {
                player1Id: kingId,
                player2Id: peasantId,
                winnerId: null,
                reason: result.reason,
                startedAt: new Date(gameState.startedAt)
            }
        });
    }

    // Borramos la partida de Redis definitivamente
    await redisClient.del(`game:${gameId}`);
    await lobbyService.setLobbyWaiting(Number(gameId));

    return result;
};

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
    condemnARebel,
    endGameByTimeout
};
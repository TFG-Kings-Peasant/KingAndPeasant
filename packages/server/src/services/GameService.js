import { redisClient } from '../../config/redis.js';
import { prisma } from '../../config/db.js';
import { peasantActionCards } from '../game/cards/peasantActionCards.js';
import { peasantPendingActions } from '../game/cards/peasantPendingActions.js';
import { canInfiltrate, changeTurn, drawCardFromDeck, getCardType, getUserRol, shuffleArray } from '../utils/helpers.js';
import { kingActionCards } from '../game/cards/kingActionCards.js';
import { kingPendingActions } from '../game/cards/kingPendingActions.js';
import {rebelCards} from '../game/cards/rebelCards.js'
import {guardCards} from '../game/cards/guardCards.js'

const setupNewEra = async (gameId, nextKingId, nextPeasantId, currentEra, currentScores, startedAt) => {
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
            });
        }
    });
    shuffleArray(deck);
    const handKing = deck.splice(0,5);
    const handPeasant = deck.splice(0,5);
    return {
        startedAt: startedAt,
        era: currentEra + 1,
        scores: currentScores, // Novedad: Llevamos el conteo de victorias
        turnNumber: 1,
        turn: "peasant", // Las reglas dicen que empieza el campesino
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

    const initialState = await setupNewEra(lobbyId, player1Id, player2Id, 0, initialScores, new Date());
    
    // =========================================================
    // 🛠️ HACK PARA DESARROLLO: MESA DE PRUEBAS GLOBAL 🛠️
    // =========================================================
    
    // 1. SOBRESCRIBIR LA MANO DEL REY
    initialState.players.king.hand = [
        { uid: "cheat_king_strike", templateId: 10, typeKing: "Action", isRevealed: false },
        { uid: "cheat_king_arrest", templateId: 11, typeKing: "Action", isRevealed: false },
        { uid: "cheat_king_raid", templateId: 12, typeKing: "Action", isRevealed: false },
        { uid: "cheat_king_reassemble", templateId: 14, typeKing: "Action", isRevealed: false },
        // Guardias en mano para la segunda fase de REASSEMBLE (Preparar guardia de la mano)
        { uid: "cheat_king_guard_hand_1", templateId: 1, typeKing: "Guard", isRevealed: false }, 
        { uid: "cheat_king_guard_hand_2", templateId: 3, typeKing: "Guard", isRevealed: false }  
    ];

    // 2. SOBRESCRIBIR LA MANO DEL CAMPESINO
    initialState.players.peasant.hand = [
        { uid: "cheat_peasant_brawl", templateId: 3, typePeasant: "Action", isRevealed: false },       
        { uid: "cheat_peasant_revolt", templateId: 11, typePeasant: "Action", isRevealed: false },     
        { uid: "cheat_peasant_scatter", templateId: 12, typePeasant: "Action", isRevealed: false },    
        { uid: "cheat_peasant_reassemble", templateId: 14, typePeasant: "Action", isRevealed: false }, 
        { uid: "cheat_peasant_rally", templateId: 15, typePeasant: "Action", isRevealed: false },      
        // Rebeldes en mano para esconder con RALLY o la segunda fase de REASSEMBLE
        { uid: "cheat_peasant_rebel_hand_1", templateId: 1, typePeasant: "Rebel", isRevealed: false }, 
        { uid: "cheat_peasant_rebel_hand_2", templateId: 2, typePeasant: "Rebel", isRevealed: false }  
    ];

    // 3. SOBRESCRIBIR EL PUEBLO DEL REY
    // Ponemos 3 guardias: 2 para que el rey los use con STRIKE, y 1 extra para que el Campesino le pegue con BRAWL
    initialState.players.king.town = [
        { uid: "cheat_king_guard_town_1", templateId: 4, typeKing: "Guard", isRevealed: true }, 
        { uid: "cheat_king_guard_town_2", templateId: 5, typeKing: "Guard", isRevealed: true }, 
        { uid: "cheat_king_guard_town_3", templateId: 6, typeKing: "Guard", isRevealed: true }  
    ];

    // 4. SOBRESCRIBIR EL PUEBLO DEL CAMPESINO
    // Ponemos un infiltrador para REVOLT, y dos rebeldes normales para SCATTER, BRAWL o ARREST
    initialState.players.peasant.town = [
        { uid: "cheat_peasant_infiltrator", templateId: 13, typePeasant: "Rebel", isRevealed: false }, // Decoy
        { uid: "cheat_peasant_rebel_town_1", templateId: 4, typePeasant: "Rebel", isRevealed: false }, 
        { uid: "cheat_peasant_rebel_town_2", templateId: 7, typePeasant: "Rebel", isRevealed: false }  
    ];

    // 5. SOBRESCRIBIR DESCARTES
    // Llenamos el mazo con cartas de ambos para que la primera fase de REASSEMBLE funcione
    initialState.discardPile = [
        { uid: "cheat_discard_1", templateId: 6, typePeasant: "Rebel", isRevealed: true }, 
        { uid: "cheat_discard_2", templateId: 8, typePeasant: "Rebel", isRevealed: true },
        { uid: "cheat_discard_3", templateId: 1, typeKing: "Guard", isRevealed: true },
        { uid: "cheat_discard_4", templateId: 3, typeKing: "Guard", isRevealed: true }
    ];
    // =========================================================
    
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
//    dtoKing.deckCount = dtoKing.deck.length;
//    delete dtoKing.deck;
    const dtoPeasant = JSON.parse(JSON.stringify(gameState));
//    dtoPeasant.deckCount = dtoPeasant.deck.length;
//    delete dtoPeasant.deck;

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
            return await returnRebeldToHand(gameId, gameState, cardIndex)
        }else if (canInfiltrate(playedCard)){
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
    gameState = changeTurnAndCheckDraw(gameState, userRol);
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

    if (Number(card.templateId !== 16)) {
        gameState.discardPile.push(card);
        return {
            isGameOver: true,
            winnerId: gameState.players.peasant.id,
            reason: 'CONDEMN_FAIL'
        }
    }

    gameState.discardPile.push(card);

    console.log("Un rebelde a sido condenado, esta era ha acabado.")
    gameState = changeTurnAndCheckDraw(gameState, userRol);
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

const changeTurnAndCheckDraw = (gameState, userRol) => {
    if(userRol !== "peasant"){
        gameState = drawCardFromDeck(gameState, userRol)
    }   
    changeTurn(gameState);
    return gameState;
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
import { redisClient } from '../../config/redis.js';
import { prisma } from '../../config/db.js';
import { peasantActionCards } from '../game/cards/peasantActionCards.js';
import { peasantPendingActions } from '../game/cards/peasantPendingActions.js';
import { shuffleArray } from '../utils/helpers.js';
import { kingActionCards } from '../game/cards/kingActionCards.js';
import { kingPendingActions } from '../game/cards/kingPendingActions.js';

const setupNewEra = async (lobbyId, nextKingId, nextPeasantId, currentEra, currentScores, startedAt) => {
    const catalog = await prisma.card.findMany();
    const deck = [];
    catalog.forEach(card => {
        for(let i = 0; i < card.copies; i++) {
            deck.push({
                uid: `game_${lobbyId}_card_${card.id}_copy_${i}`,
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
    // 🛠️ HACK PARA DESARROLLO: FORZAR ESCENARIO DE PRUEBAS 🛠️
    // =========================================================
    
    // 1. SOBRESCRIBIR la mano del Campesino (Usamos '=' para borrar las 5 cartas aleatorias previas)
    initialState.players.peasant.hand = [
        { uid: "cheat_action_brawl", templateId: 3, typePeasant: "Action", isRevealed: true },       // BRAWL (ID: 3)
        { uid: "cheat_action_revolt", templateId: 11, typePeasant: "Action", isRevealed: true },     // REVOLT (ID: 11)
        { uid: "cheat_action_scatter", templateId: 12, typePeasant: "Action", isRevealed: true },    // SCATTER (ID: 12)
        { uid: "cheat_action_reassemble", templateId: 14, typePeasant: "Action", isRevealed: true }, // REASSEMBLE (ID: 14)
        { uid: "cheat_action_rally", templateId: 15, typePeasant: "Action", isRevealed: true },      // RALLY (ID: 15)
        
        { uid: "cheat_rebel_hand_1", templateId: 1, typePeasant: "Rebel", isRevealed: true }, // Heretic (ID: 1)
        { uid: "cheat_rebel_hand_2", templateId: 2, typePeasant: "Rebel", isRevealed: true }  // Smuggler (ID: 2)
    ];

    // 2. SOBRESCRIBIR el pueblo del Campesino
    initialState.players.peasant.town = [
        { uid: "cheat_infiltrator_1", templateId: 13, typePeasant: "Rebel", isRevealed: true }, // Decoy (ID: 13)
        { uid: "cheat_infiltrator_2", templateId: 16, typePeasant: "Rebel", isRevealed: true }, // Assassin (ID: 16)
        { uid: "cheat_normal_rebel", templateId: 4, typePeasant: "Rebel", isRevealed: true }    // Thug (ID: 4)
    ];

    // 3. SOBRESCRIBIR el pueblo del Rey
    initialState.players.king.town = [
        { uid: "cheat_guard_1", templateId: 1, typeKing: "Guard", isRevealed: true }, // Crier (ID: 1)
        { uid: "cheat_guard_2", templateId: 3, typeKing: "Guard", isRevealed: true }  // Inquisitor (ID: 3)
    ];

    // 4. SOBRESCRIBIR el mazo de Descartes
    initialState.discardPile = [
        { uid: "cheat_discard_1", templateId: 6, typePeasant: "Rebel", isRevealed: true }, // Mob (ID: 6)
        { uid: "cheat_discard_2", templateId: 8, typePeasant: "Rebel", isRevealed: true }  // Rat (ID: 8)
    ];
    // =========================================================
    
    return await saveAndFormatGameState(lobbyId, initialState);
};

/*
const createGame = async ( lobbyId, player1Id, player2Id) => {
    
    const initialScores = {
        [player1Id]: 0,
        [player2Id]: 0
    };

    const initialState = await setupNewEra(lobbyId, player1Id, player2Id, 0, initialScores, new Date());
    
    // =========================================================
    // 🛠️ HACK PARA DESARROLLO: FORZAR ESCENARIO DE PRUEBAS 🛠️
    // =========================================================
    
    // 1. Añadir TODAS las cartas de Acción a la mano del Campesino (IDs reales)
    initialState.players.peasant.hand.push(
        { uid: "cheat_action_brawl", templateId: 3, typePeasant: "Action", isRevealed: true },       // BRAWL (ID: 3)
        { uid: "cheat_action_revolt", templateId: 11, typePeasant: "Action", isRevealed: true },     // REVOLT (ID: 11)
        { uid: "cheat_action_scatter", templateId: 12, typePeasant: "Action", isRevealed: true },    // SCATTER (ID: 12)
        { uid: "cheat_action_reassemble", templateId: 14, typePeasant: "Action", isRevealed: true }, // REASSEMBLE (ID: 14)
        { uid: "cheat_action_rally", templateId: 15, typePeasant: "Action", isRevealed: true },      // RALLY (ID: 15)
        
        // Rebeldes en mano para poder usar RALLY y REASSEMBLE (te piden esconder Rebeldes de tu mano)
        { uid: "cheat_rebel_hand_1", templateId: 1, typePeasant: "Rebel", isRevealed: true }, // Heretic (ID: 1)
        { uid: "cheat_rebel_hand_2", templateId: 2, typePeasant: "Rebel", isRevealed: true }  // Smuggler (ID: 2)
    );

    // 2. Poblar el pueblo del Campesino para REVOLT, BRAWL y SCATTER
    initialState.players.peasant.town.push(
        { uid: "cheat_infiltrator_1", templateId: 13, typePeasant: "Rebel", isRevealed: true }, // Decoy (Infiltrador válido, ID: 13)
        { uid: "cheat_infiltrator_2", templateId: 16, typePeasant: "Rebel", isRevealed: true }, // Assassin (Infiltrador válido, ID: 16)
        { uid: "cheat_normal_rebel", templateId: 4, typePeasant: "Rebel", isRevealed: true }    // Thug (Rebelde normal para Brawl)
    );

    // 3. Poblar el pueblo del Rey para que el Campesino tenga objetivos en BRAWL
    initialState.players.king.town.push(
        { uid: "cheat_guard_1", templateId: 1, typeKing: "Guard", isRevealed: true }, // Crier (ID: 1)
        { uid: "cheat_guard_2", templateId: 3, typeKing: "Guard", isRevealed: true }  // Inquisitor (ID: 3)
    );

    // 4. Añadir cartas al mazo de Descartes para la acción REASSEMBLE (Recuperar del descarte)
    initialState.discardPile.push(
        { uid: "cheat_discard_1", templateId: 6, typePeasant: "Rebel", isRevealed: true }, // Mob (ID: 6)
        { uid: "cheat_discard_2", templateId: 8, typePeasant: "Rebel", isRevealed: true }  // Rat (ID: 8)
    );
    // =========================================================
    return await saveAndFormatGameState(lobbyId, initialState);
};
*/

const getGameStateById = async (id) => {
    const gameState = await redisClient.get(`game:${id}`);
    if (!gameState) {
        throw new Error('La partida no existe o ha expirado');
    }
    return JSON.parse(gameState);
}

const saveAndFormatGameState = async (lobbyId, gameState) => {
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
            await redisClient.del(`game:${lobbyId}`);
            return winStatus;
        } else {
            gameState = await setupNewEra(
                lobbyId, 
                winnerId, 
                loserId, 
                gameState.era, 
                gameState.scores, 
                gameState.startedAt
            );
        }
    }

    delete gameState.lastEvent;
    
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
    const userRol = Number(gameState.players.king.id) === Number(userId) ? "king" : "peasant";
    if (gameState.turn !== userRol) {
        throw new Error('No es el turno del jugador');
    }
    const cardIndex = gameState.players[userRol].hand.findIndex(card => card.uid === cardUid);
    if (cardIndex === -1) {
        throw new Error('Carta no encontrada en la mano del jugador');
    }
    const [playedCard] = gameState.players[userRol].hand.splice(cardIndex, 1);
    const cardType = userRol==="king"? playedCard.typeKing : playedCard.typePeasant;
    if (cardType === 'Action') {
        return await playActionCard(lobbyId, targetData, playedCard, userRol, gameState);
    }
    else {
        throw new Error('Solo se pueden jugar cartas de acción por ahora');
    }
}


const playActionCard = async (lobbyId,targetData, playedCard, userRol, gameState) => {
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
    const userRol = Number(gameState.players.king.id) === Number(userId) ? "king" : "peasant";
    const pendingAction = gameState.pendingAction;
    //Comprobacion de acción pendiente para el jugador
    if (pendingAction && pendingAction.player === userRol) {
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
            gameState = resolver(gameState, targetData); 
        }    
    } else {
        throw new Error('No hay acciones pendientes para este jugador');
    }
    if (!gameState.pendingAction) {
        gameState.turn = gameState.turn === 'king' ? 'peasant' : 'king';
    }
    return await saveAndFormatGameState(lobbyId, gameState);
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
    if (deckCount === 0) {
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

export const gameService = {
    createGame,
    getGameStateById,
    playActionCard,
    getGameStateDTO,
    shuffleArray,
    resolvePendingAction,
    playCard
};
import {changeTurn, drawCardFromDeck, shuffleArray } from "../../utils/helpers.js";

export const rebelPendingCards = {
    "THUG": (gameState, targetData) => {
        //"Remove a Guard, then draw 1 card"

        const { targetUid } = targetData; 

        // // 1. Eliminar al Guardia seleccionado
        const cardIndex = gameState.players.king.town.findIndex(card => card.uid === targetUid);
        if (cardIndex === -1) {
            throw new Error('Carta no encontrada en el pueblo del jugador');
        }

        const [targetCard] = gameState.players.king.town.splice(cardIndex, 1);
        targetCard.isRevealed = true
        gameState.discardPile.push(targetCard)

        // // 2. Robar 1 carta para el Peasant
        drawCardFromDeck(gameState, 'peasant')

        changeTurn(gameState)
        return gameState;
    },
    "COURTESAN": (gameState, targetData) => {
        //"Look at the top 3 cards of the deck, then take 1 and put the others back in any order"
        const { targetUid, firstUid, secondUid} = targetData; 

        const targetCardIndex = gameState.deck.findIndex(card => card.uid === targetUid);
        const firstCardIndex = gameState.deck.findIndex(card => card.uid === firstUid);
        const secondCardIndex = gameState.deck.findIndex(card => card.uid === secondUid);

        if (targetCardIndex === -1 || firstCardIndex === -1 || secondCardIndex === -1) {
            throw new Error('Carta no encontrada en el mazo');
        }

        const [targetCard] = gameState.deck.splice(targetCardIndex, 1);
        const [firtsCard] = gameState.deck.splice(firstCardIndex, 1);
        const [secondCard] = gameState.deck.splice(secondCardIndex, 1);


        targetCard.isRevealed = false
        firtsCard.isRevealed = false
        secondCard.isRevealed = false
        
        gameState.players.peasant.hand.push(targetCard)
        gameState.deck.push(firtsCard)
        gameState.deck.push(secondCard)

        changeTurn(gameState)
        return gameState;
    },
    "CHARLATAN": (gameState, targetData) => {
        //"Draw up to 3 cards, then put the same number of cards on top of the deck in any order"
        const deckUids = targetData?.deckUids || [];
        deckUids.forEach(uid => {
            const index = gameState.deck.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en el mazo`);
            }
            
            const [deckCard] = gameState.deck.splice(index, 1);
            
            deckCard.isRevealed = false; 
            
            gameState.players.peasant.hand.push(deckCard);
        });

        gameState.pendingAction = {
            type: "CHARLATAN2",
            player: "peasant",
            amount: deckUids.length
        };
        return gameState;
    },
    "CHARLATAN2": (gameState, targetData) => {
        //"Draw up to 3 cards, then put the same number of cards on top of the deck in any order"
        const handUids = targetData?.handUids || [];
        handUids.forEach(uid => {
            const index = gameState.players.peasant.hand.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en la mano del campesino`);
            }
            
            const [handCard] = gameState.players.peasant.hand.splice(index, 1);
            
            gameState.deck.push(handCard);
        });
        changeTurn(gameState)
        return gameState;
    },
    "RAT": (gameState, targetData) => {
        //"Return up to 2 other Rebels back to hand, then Hide up to 2 Rebels"
        const townUids = targetData?.townUids || [];
        if (townUids.length > 2) {
                throw new Error(`Solo se puede seleccionar 2 cartas como máximo`);
        }
        townUids.forEach(uid => {
            const index = gameState.players.peasant.town.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en el pueblo del campesino`);
            }
            const [townCard] = gameState.players.peasant.town.splice(index, 1);
            gameState.players.peasant.hand.push(townCard);
        });
        const amount = Math.min(2, gameState.players.peasant.town.length);

        gameState.pendingAction = {
            type: "RAT2",
            player: "peasant",
            amount: amount
        };
        return gameState;
    },
    "RAT2": (gameState, targetData) => {
        //"Return up to 2 other Rebels back to hand, then Hide up to 2 Rebels"
        const handUids = targetData?.townUids || [];
        if (handUids.length > 2) {
                throw new Error(`Solo se puede seleccionar 2 cartas como máximo`);
        }
        handUids.forEach(uid => {
            const index = gameState.players.peasant.hand.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en la mano del campesino`);
            }
            const [handCard] = gameState.players.peasant.hand.splice(index, 1);
            handCard.isRevealed = false
            gameState.players.peasant.town.push(handCard);
        });

        changeTurn(gameState)
        return gameState;
    },
    "THIEF2": (gameState, targetData) => {
        //"King discards 2 cards, then Peasant takes 1 of them"
        const targetUid = targetData?.targetUid || -1;
        if (targetUid === -1) {
            throw new Error(`No se ha seleccionado ninguna carta`);
        }
        const index = gameState.discardPile.findIndex(c => c.uid === uid);
        if (index === -1) {
            throw new Error(`La carta con UID ${uid} no se ha encontrado en la pila de descartes`);
        }
        const [targetCard] = gameState.discardPile.splice(index, 1);
        targetCard.isRevealed = false
        gameState.players.peasant.hand.push(targetCard);

        changeTurn(gameState)
        return gameState;
    },
    "DECOY": (gameState, targetData) => {
        //"Infiltrate: Peasant removes a Guard. EXILE"
        const targetUid = targetData?.targetUid || -1;
        if (targetUid === -1) {
            throw new Error(`No se ha seleccionado ninguna carta`);
        }
        const index = gameState.players.king.town.findIndex(c => c.uid === uid);
        if (index === -1) {
            throw new Error(`La carta con UID ${uid} no se ha encontrado en el pueblo del rey`);
        }
        const [targetCard] = gameState.players.king.town.splice(index, 1);
        targetCard.isRevealed = false
        gameState.discardPile.push(targetCard);

        changeTurn(gameState)
        return gameState;
    },
}

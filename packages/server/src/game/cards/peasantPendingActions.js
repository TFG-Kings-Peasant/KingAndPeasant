import {changeTurn, drawCardFromDeck, shuffleArray } from "../../utils/helpers.js";


export const peasantPendingActions = {
// INFILTRATE
    'INFILTRATE': (gameState, targetData) => {
        const { targetUid , deckPositions = [] } = targetData
        if (deckPositions.length !== 1 || !targetUid) {
            throw new Error('Debes seleccionar exactamente una posición en el mazo para infiltrar la carta');
        }
        const index = gameState.players.peasant.town.findIndex(c => c.uid === targetUid);
        const [card] = gameState.players.peasant.town.splice(index, 1);
        card.isRevealed = false;
        gameState.deck.splice(deckPositions[0], 0, card);
        return gameState;
    },
    'RALLY': (gameState, targetData) => {
        const { selectedCardsUid = [] } = targetData || {};
        if (selectedCardsUid.length > 2) {
            throw new Error('No se pueden seleccionar más de 2 cartas');
        }
        selectedCardsUid.forEach(uid => {
            const index = gameState.players.peasant.hand.findIndex(c => c.uid === uid);
            if (index !== -1) {
                const [card] = gameState.players.peasant.hand.splice(index, 1);
                card.isRevealed = false; // "Hide" implica boca abajo
                gameState.players.peasant.town.push(card);
            }
        });
        return gameState;
    },
    'REASSEMBLE1': (gameState, targetData) => {
        const discardUids = targetData?.discardUids || [];
        
        if (discardUids.length > 2 || discardUids.length > gameState.discardPile.length) {
            throw new Error('Solo puedes recuperar hasta 2 cartas del descarte');
        }
        discardUids.forEach(uid => {
            const index = gameState.discardPile.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en el descarte`);
            }
            
            const [recoveredCard] = gameState.discardPile.splice(index, 1);
            
            recoveredCard.isRevealed = false; 
            
            gameState.players.peasant.hand.push(recoveredCard);
        });
        gameState.pendingAction = {
            player: 'peasant',
            type: 'REASSEMBLE2' 
        };
        return gameState;
    },
    'REASSEMBLE2': (gameState, targetData) => {
        if (!targetData || !targetData.rebelUid) {
            return gameState;
        }
        const rebelIndex = gameState.players.peasant.hand.findIndex(c => c.uid === targetData.rebelUid);
        if (rebelIndex === -1) throw new Error('Rebelde no encontrado en la mano del jugador');
        const [card] = gameState.players.peasant.hand.splice(rebelIndex,1); 
        card.isRevealed = false;
        gameState.players.peasant.town.push(card);
        return gameState;                                                           
    },
    'BRAWL': (gameState, targetData) => {
        const {rebelUid, guardUid} = targetData;
        if (!rebelUid || !guardUid) {
            throw new Error('Faltan los objetivos para realizar la Acción');
        }
        const rebelIndex = gameState.players.peasant.town.findIndex(card => card.uid === rebelUid);
        const guardIndex = gameState.players.king.town.findIndex(card => card.uid === guardUid);
        
        if (rebelIndex === -1 || guardIndex === -1) {
            throw new Error('Carta no encontrada en el pueblo');
        }

        const [rebelCard] = gameState.players.peasant.town.splice(rebelIndex, 1);
        const [guardCard] = gameState.players.king.town.splice(guardIndex, 1);
        
        rebelCard.isRevealed = true;
        guardCard.isRevealed = true;
        
        gameState.discardPile.push(rebelCard, guardCard);

        return gameState;
    },
    'REVOLT': (gameState, targetData) => {
        const { rebelUids = [], deckPositions = [] } = targetData;
        if (rebelUids.length !== deckPositions.length) {
            throw new Error('La cantidad de cartas rebeldes y posiciones en el mazo debe ser la misma');
        }
        if (rebelUids.length !== 0) {
            const insertions = rebelUids.map((uid, index) => ({
                uid: uid,
                position: deckPositions[index]
            }));
            insertions.sort((a, b) => b.position - a.position);
            for (const item of insertions) {
                const townIndex = gameState.players.peasant.town.findIndex(card => card.uid === item.uid);
                
                if (townIndex === -1) {
                    throw new Error(`Carta ${item.uid} no encontrada en el pueblo`);
                }
                
                const [card] = gameState.players.peasant.town.splice(townIndex, 1);
                
                gameState.deck.splice(item.position, 0, card);
            }
        }
        gameState.players.peasant.town.forEach(card => {
            if (!card.isRevealed) {
                card.isRevealed = true;
                //Aquí se llamara a la función de efectos de cartas
            }
        });
        return gameState;
    },
//REBEL Cards

    "EXECUTOR": (gameState, targetData) => {
        //"Peasant Removes 1 hidden Rebel"
        const { targetUid } = targetData; 
        const cardIndex = gameState.players.peasant.town.findIndex(card => card.uid === targetUid);
        if (cardIndex === -1) {
            throw new Error('Carta no encontrada en el pueblo del jugador');
        }
        const [targetCard] = gameState.players.peasant.town.splice(cardIndex, 1);
        if(targetCard.isRevealed === true){
            throw new Error('La carta ya estaba revelada');
        }
        targetCard.isRevealed = true;
        gameState.discardPile.push(targetCard)
        
        return gameState;
    },
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

        return gameState;
    },
    "COURTESAN": (gameState, targetData) => {
        //"Look at the top 3 cards of the deck, then take 1 and put the others back in any order"
        const {targetUid} = targetData; 
        gameState.deck.slice(-3).forEach(card => {
            card.isRevealed = false;
        });
        
        const targetCardIndex = gameState.deck.findIndex(card => card.uid === targetUid);

        if (targetCardIndex === -1) {
            throw new Error('Carta no encontrada en el mazo');
        }

        const [targetCard] = gameState.deck.splice(targetCardIndex, 1);
        gameState.players.peasant.hand.push(targetCard)

        return gameState;
    },
    "CHARLATAN": (gameState, targetData) => {
        //"Draw up to 3 cards, then put the same number of cards on top of the deck in any order"
        const amountToDraw = targetData?.amountToDraw || 0;
        // Robar siempre desde "arriba" del mazo (el final del array)
        for (let i = 0; i < amountToDraw; i++) {
            if (gameState.deck.length === 0) break; // Por seguridad, si el mazo se vacía

            const deckCard = gameState.deck.pop(); 
            deckCard.isRevealed = false; 
            gameState.players.peasant.hand.push(deckCard);
        }

        gameState.pendingAction = {
            type: "CHARLATAN2",
            player: "peasant",
            amount: amountToDraw
        };
        return gameState;
    },
    "CHARLATAN2": (gameState, targetData) => {
        //"Draw up to 3 cards, then put the same number of cards on top of the deck in any order"
        const handUids = targetData?.handUids || [];
        const expectedAmount = targetData?.amount || 0;
        if (handUids.length !== expectedAmount) {
            throw new Error(`Acción inválida: Debes devolver exactamente ${expectedAmount} carta(s).`);
        }

        handUids.forEach(uid => {
            const index = gameState.players.peasant.hand.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en la mano del campesino`);
            }
            
            const [handCard] = gameState.players.peasant.hand.splice(index, 1);
            
            gameState.deck.push(handCard);
        });
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

        gameState.pendingAction = {
            type: "RAT2",
            player: "peasant",
        };
        return gameState;
    },
    "RAT2": (gameState, targetData) => {
        //"Return up to 2 other Rebels back to hand, then Hide up to 2 Rebels"
        const handUids = targetData?.handUids || [];
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

        return gameState;
    },
    "THIEF2": (gameState, targetData) => {
        //"King discards 2 cards, then Peasant takes 1 of them"
        const targetUid = targetData?.targetUid || -1;
        if (targetUid === -1) {
            throw new Error(`No se ha seleccionado ninguna carta`);
        }
        const index = gameState.discardPile.findIndex(c => c.uid === targetUid);
        if (index === -1) {
            throw new Error(`La carta con UID ${uid} no se ha encontrado en la pila de descartes`);
        }
        const [targetCard] = gameState.discardPile.splice(index, 1);
        targetCard.isRevealed = false
        gameState.players.peasant.hand.push(targetCard);

        return gameState;
    },
    "DECOY": (gameState, targetData) => {
        //"Infiltrate: Peasant removes a Guard. EXILE"
        const targetUid = targetData?.targetUid || -1;
        if (targetUid === -1) {
            throw new Error(`No se ha seleccionado ninguna carta`);
        }
        const index = gameState.players.king.town.findIndex(c => c.uid === targetUid);
        if (index === -1) {
            throw new Error(`La carta con UID ${uid} no se ha encontrado en el pueblo del rey`);
        }
        const [targetCard] = gameState.players.king.town.splice(index, 1);
        if(targetCard.typeKing !== "Guard"){
            throw new Error(`La carta seleccionada no es un Guard`);
        }
        targetCard.isRevealed = true
        gameState.discardPile.push(targetCard);
        
        gameState.turn = 'king';
        return gameState;
    }
}

export const kingPendingActions = {
    'REASSEMBLE1': (gameState, targetData) => {
        const discardUids = targetData?.discardUids || [];
        
        if (discardUids.length > 2) {
            throw new Error('Solo puedes recuperar hasta 2 cartas del descarte');
        }
        discardUids.forEach(uid => {
            const index = gameState.discardPile.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en el descarte`);
            }
            
            const [recoveredCard] = gameState.discardPile.splice(index, 1);
            
            recoveredCard.isRevealed = false; 
            
            gameState.players.king.hand.push(recoveredCard);
        });
        gameState.pendingAction = {
            player: 'king',
            type: 'REASSEMBLE2' 
        };
        return gameState;
    },
    'REASSEMBLE2': (gameState, targetData) => {
        if (!targetData || !targetData.guardUid) {
            return gameState;
        }
        const guardIndex = gameState.players.king.hand.findIndex(c => c.uid === targetData.guardUid);
        if (guardIndex === -1) throw new Error('Guardia no encontrado en la mano del jugador');
        const [card] = gameState.players.king.hand.splice(guardIndex,1); 
        card.isRevealed = true;
        gameState.players.king.town.push(card);
        return gameState;                                                           
    },
    'STRIKE': (gameState, targetData) => {
        const {guardUid1, guardUid2} = targetData;
        if (guardUid1 === guardUid2) {
            throw new Error('No puedes seleccionar la misma carta dos veces');
        }
        const guardIndex1 = gameState.players.king.hand.findIndex(card => card.uid === guardUid1);
        const guardIndex2 = gameState.players.king.hand.findIndex(card => card.uid === guardUid2);
        if (guardIndex1 === -1 || guardIndex2 === -1) {
            throw new Error('Carta no encontrada en la mano del rey');
        }
        
        const indices = [guardIndex1, guardIndex2].sort((a, b) => b - a);

        const [guardCard1] = gameState.players.king.hand.splice(indices[0], 1);
        const [guardCard2] = gameState.players.king.hand.splice(indices[1], 1);
        guardCard1.isRevealed = true;
        guardCard2.isRevealed = true;
        
        gameState.discardPile.push(guardCard1, guardCard2);
        //Aquí se llamaría a la función de efectos de cartas
        return gameState;
    },
    'ARREST': (gameState, targetData) => {
        if (!targetData || !targetData.option) {
            throw new Error('Debes elegir una opción: descartar del pueblo o del mazo');
        }
        if (targetData.option === 'DECK') {
            if (gameState.deck.length === 0) {
                throw new Error('No hay cartas en el mazo para descartar');
            }
            const card = gameState.deck.shift();
            card.isRevealed = true;
            gameState.discardPile.push(card);
        } else if (targetData.option === 'TOWN') {
            if (gameState.players.peasant.town.length === 0) {
                throw new Error('No hay cartas en el pueblo para descartar');
            }
            if (!targetData.targetUid) {
                throw new Error('No se ha proporcionado la carta objetivo');
            }
            const cardIndex = gameState.players.peasant.town.findIndex(card => card.uid === targetData.targetUid);
            if (cardIndex === -1) {
                throw new Error('La carta objetivo no está en el pueblo');
            }
            const card = gameState.players.peasant.town.splice(cardIndex, 1)[0];
            card.isRevealed = true;
            gameState.discardPile.push(card);
        }
        else {
            throw new Error('Opción no válida');
        }
        return gameState
    }
}



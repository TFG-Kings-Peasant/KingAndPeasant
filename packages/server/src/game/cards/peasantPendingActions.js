export const peasantPendingActions = {
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
    }
}

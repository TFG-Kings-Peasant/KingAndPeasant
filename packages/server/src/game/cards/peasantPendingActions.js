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
    'REASSEMBLE': (gameState, targetData) => {
        if (!targetData || !targetData.rebelUid) {
            return gameState;
        }
        const rebelIndex = gameState.players.peasant.hand.findIndex(c => c.uid === targetData.rebelUid);
        if (rebelIndex === -1) throw new Error('Rebelde no encontrado en la mano del jugador');
        const [card] = gameState.players.peasant.hand.splice(rebelIndex,1); 
        card.isRevealed = false;
        gameState.players.peasant.town.push(card);
        return gameState;                                                           
    }
}

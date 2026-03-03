export const pendingActionResolvers = {
    'RALLY': (gameState, targetData) => {
        const { selectedCardsUid = [] } = targetData;
        if (selectedCardsUid.length > 2) {
            throw new Error('No se pueden seleccionar más de 2 cartas');
        }
        selectedUids.forEach(uid => {
            const index = gameState.players.peasant.hand.findIndex(c => c.uid === uid);
            if (index !== -1) {
                const [card] = gameState.players.peasant.hand.splice(index, 1);
                card.isRevealed = false; // "Hide" implica boca abajo
                gameState.players.peasant.town.push(card);
            }
        });
        return gameState;
    }
}
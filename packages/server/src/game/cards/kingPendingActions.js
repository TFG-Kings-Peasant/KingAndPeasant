export const kingPendingActions = {
    'REASSEMBLE': (gameState, targetData) => {
        if (!targetData || !targetData.guardUid) {
            return gameState;
        }
        const guardIndex = gameState.players.king.hand.findIndex(c => c.uid === targetData.guardUid);
        if (guardIndex === -1) throw new Error('Guardia no encontrado en la mano del jugador');
        const [card] = gameState.players.king.hand.splice(guardIndex,1); 
        card.isRevealed = true;
        gameState.players.king.town.push(card);
        return gameState;                                                           
    }
}



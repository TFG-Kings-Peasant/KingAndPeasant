export const kingActionCards = {
    10: (gameState, targetData) => {
        const kingHand = gameState.players.king.hand;
        const guardsInHand = false; 
        const countGuards = 0;
        for (let card in kingHand) {
            if (card.typeKing == "Guard") {
                countGuards = countGuards + 1;
                if(countGuards >= 2) {
                    guardsInHand = true;
                    break
                }
            }
        }
        if (!guardsInHand) {
            throw new Error('No hay guardias suficientes en el pueblo')
        }
        gameState.pendingAction = {
            player: 'king',
            type: 'STRIKE' 
        };
        return gameState;
    },
    11: (gameState, targetData) => {
        gameState.pendingAction = {
            player: 'king',
            type: 'ARREST' 
        };
        return gameState;
    },
    12: (gameState) => {
        const peasantHand = gameState.players.peasant.hand;
        if (peasantHand.length === 0) {
            return gameState;
        }
        const randomIndex = Math.floor(Math.random() * peasantHand.length);
        const [card] = peasantHand.splice(randomIndex, 1);
        card.isRevealed = true;
        gameState.discardPile.push(card);
        return gameState;
    },
    14: (gameState) => {
        gameState.pendingAction = {
            player: 'king',
            type: 'REASSEMBLE1' 
        };
        return gameState;
    }
}

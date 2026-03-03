import {gameService} from "../../services/GameService";

export const peasantActionCards = {
    3: (gameState, targetData) => {
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
    11: (gameState, targetData) => {
        const { rebelUids = [], deckPositions = [] } = targetData;
        if (rebelUids.length !== deckPositions.length) {
            throw new Error('La cantidad de cartas rebeldes y posiciones en el mazo debe ser la misma');
        }
        if (rebelUids.length !== 0) {
            for (const uid of rebelUids) {
                const index = gameState.players.peasant.town.findIndex(card => card.uid === uid);
                if (index === -1) {
                    throw new Error('Carta no encontrada en el pueblo');
                }
                const [card] = gameState.players.peasant.town.splice(index, 1);
                const indexDeck = deckPositions.shift();
                if (indexDeck === undefined) { throw new Error('Faltan posiciones en el mazo para infiltrar estas cartas'); }
                gameState.deck.splice(indexDeck, 0, card);
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
    12: (gameState) => {
        const cardsTown = gameState.players.peasant.town.splice(0, gameState.players.peasant.town.length); 
        cardsTown.forEach(card => card.isRevealed = false);
        gameState.players.peasant.hand.push(...cardsTown);
        const cardsDiscard = gameState.discardPile.splice(0, gameState.discardPile.length);
        cardsDiscard.forEach(card => card.isRevealed = false);
        gameState.deck.push(...cardsDiscard);
        gameService.shuffleArray(gameState.deck);
        return gameState;
    },
    14: (gameState, targetData) => {
        const { rebel1Uid, rebel2Uid } = targetData;
        for (let i = 0; i < 2; i++) {
            if (gameState.deck.length > 0){
                const card = gameState.deck.shift();
                gameState.players.peasant.hand.push(card);
            }
        }
        gameState.pendingAction = {
            player: 'peasant',
            type: 'RALLY',
        };
        return gameState;
    }
}

import { shuffleArray } from "../../utils/helpers.js";

export const peasantActionCards = {
    3: (gameState) => {
        const peasantTown = gameState.players.peasant.town;
        const kingTown = gameState.players.king.town;
        const rebelInTown = false;
        const guardInTown = false;
        for (let card in peasantTown) {
            if (card.typePeasant == "Rebel") {
                rebelInTown = true;
                break;
            }
        } for (let card in kingTown) {
            if (card.typeKing == "Guard") {
                guardInTown = true;
                break;
            }
        }
        if (!rebelInTown || !guardInTown) {
            throw new Error('No existen las cartas suficientes en el pueblo para realizar esta accion');
        }
        gameState.pendingAction = {
            player: 'peasant',
            type: 'BRAWL',
        };
        return gameState;
    },
    11: (gameState) => {
        if (!gameState.players.peasant.town) {
            throw new Error('No existen las cartas suficientes en el pueblo para realizar esta acción');
        }
        gameState.pendingAction = {
            player: 'peasant',
            type: 'REVOLT',
        };
        return gameState;
    },
    12: (gameState) => {
        if (gameState.players.peasant.town === 0) {
            throw new Error('No existen las cartas suficientes en el pueblo para realizar esta acción');
        }
        const cardsTown = gameState.players.peasant.town.splice(0, gameState.players.peasant.town.length); 
        cardsTown.forEach(card => card.isRevealed = false);
        gameState.players.peasant.hand.push(...cardsTown);
        const cardsDiscard = gameState.discardPile.splice(0, gameState.discardPile.length);
        cardsDiscard.forEach(card => card.isRevealed = false);
        gameState.deck.push(...cardsDiscard);
        shuffleArray(gameState.deck);
        return gameState;
    },
    14: (gameState) => {
        gameState.pendingAction = {
            player: 'peasant',
            type: 'REASSEMBLE1' 
        };
        return gameState;
    },
    15: (gameState) => {
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

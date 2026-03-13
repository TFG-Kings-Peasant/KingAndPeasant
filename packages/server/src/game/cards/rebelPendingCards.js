import {drawCardFromDeck, shuffleArray } from "../../utils/helpers.js";

export const rebelPendingCards = {
    "THUG": (gameState, targetData) => {
        //"Remove a Guard, then draw 1 card"

        // const { targetUid } = targetData; 

        // // 1. Eliminar al Guardia seleccionado
        // const cardIndex = gameState.players.king.town.findIndex(card => card.uid === targetUid);
        // gameState.players.king.town.town.splice(cardIndex, 1);


        // // 2. Robar 1 carta para el Peasant
        // drawCardFromDeck(gameState, 'peasant')

        return gameState;
    },
    "COURTESAN": (gameState, targetData) => {
        //"Look at the top 3 cards of the deck, then take 1 and put the others back in any order"

    },
    "CHARLATAN": (gameState, targetData) => {
        //"Draw up to 3 cards, then put the same number of cards on top of the deck in any order"

        return gameState;
    },
    "RAT": (gameState, targetData) => {
        //"Return up to 2 other Rebels back to hand, then Hide up to 2 Rebels"

        return gameState;
    },
    "THIEF": (gameState, targetData) => {
        //"King discards 2 cards, then Peasant takes 1 of them"

        return gameState;
    },
    "DECOY": (gameState, targetData) => {
        //"Infiltrate: Peasant removes a Guard. EXILE"

        return gameState;
    },
}

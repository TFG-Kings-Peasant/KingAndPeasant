import { changeTurn, drawCardFromDeck } from "../../utils/helpers.js";

export const guardPendingCards = {
    "CRIER": (gameState, targetData) => {
        //"Draw 1 card, then Ready up to 1 Guard"

        return gameState;
    },
    "INQUISITOR": (gameState, targetData) => {
        //"Ready a Guard, then Mobilize it"

        return gameState;
    },
    "SPY": (gameState, targetData) => {
        //"Reveal a Rebel"

        return gameState;
    },
    "ADVISOR": (gameState, targetData) => {
        //"Shuffle the deck and look at the top card, you may put it on the bottom of the deck"

        return gameState;
    },
    "GUARDIAN": (gameState, targetData) => {
        //"Look at any 1 card in the deck, if it is the ASSASSIN discard it, otherwise put it back in order",

        return gameState;
    },
    "EXECUTOR": (gameState, targetData) => {
        //"Peasant Removes 1 hidden Rebel"

        return gameState;
    },
    "SENTINEL": (gameState, targetData) => {
        //"Look at the top 3 cards of the deck, then put them back in any order"

        return gameState;
    },
    "WATCHMAN": (gameState, targetData) => {
        //"Look at Peasant's hand cards"
        for (let i = gameState.players.peasant.hand.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.hand[i];
            card.isRevealed = false;
        }
        return gameState;
    }
}

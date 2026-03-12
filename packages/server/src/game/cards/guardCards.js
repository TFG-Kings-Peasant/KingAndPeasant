import { drawCardFromDeck } from "../../utils/helpers";

export const guardCards = {
    1: (gameState, targetData) => {
        //"Draw 1 card, then Ready up to 1 Guard"

        drawCardFromDeck(gameState, 'king')

        // 2. Ocultar hasta 2 Rebeldes (de la mano al Town)
        gameState.pendingAction = {
                type: "READY_GUARDS",
                player: "king",
                maxAmount: 1
        };
        return gameState;
    },
    2: (gameState) => {
        //"Discard the top 2 cards of the deck"
        if(gameState.deck.lenght > 0){
            const card = gameState.deck.pop()
            card.isRevealed = true
            gameState.discardPile.push(card)
        }
        if(gameState.deck.lenght > 0){
            const card = gameState.deck.pop()
            card.isRevealed = true
            gameState.discardPile.push(card)
        }

        return gameState;
    },
    3: (gameState) => {
        //"Ready a Guard, then Mobilize it"
        gameState.pendingAction = {
            type: "READY_A_GUARD",
            player: "king"
        };
        return gameState;
    },
    4: (gameState) => {
        //"Reveal a Rebel"
        gameState.pendingAction = {
            type: "REVEAL_A_REBEL",
            player: "king"
        };
        return gameState;
    },
    5: (gameState) => {
        //"Shuffle the deck and look at the top card, you may put it on the bottom of the deck"
        shuffleArray(gameState.deck);
        const topCard = gameState.deck[gameState.deck.length - 1]
        //TODO: Mostrar la carta al jugador
        gameState.pendingAction = {
            type: "SHOW_CARD",
            player: "king",
            card: topCard.uid
        };
        return gameState;
    },
    6: (gameState) => {
        //"Reveal all Rebels"

        for (let i = gameState.players.peasant.town.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.town[i];
            card.isRevealed = true
        }

        return gameState;
    },
    7: (gameState) => {
        //"Look at any 1 card in the deck, if it is the ASSASSIN discard it, otherwise put it back in order",

        gameState.pendingAction = {
            type: "SELECT_DECK_CARD",
            player: "king"
        };
        //TODO: Mostrar la carta seleccionada
        return gameState;
    },
    8: (gameState) => {
        //"Peasant Removes 1 hidden Rebel"

        gameState.pendingAction = {
            type: "REMOVE_HIDDEN_REBEL",
            player: "peasant"
        };

        return gameState;
    },
    9: (gameState) => {
        //"Look at the top 3 cards of the deck, then put them back in any order"
        const amountToTake = Math.min(3, gameState.deck.length);
        const topThreeCards = gameState.deck.splice(-amountToTake);

        gameState.pendingAction = {
            type: "SHOW_CARDS",
            player: "peasant",
            cards: topThreeCards
        };
        return gameState;
    },
    15: (gameState) => {
        //"Look at Peasant's hand cards"
        for (let i = gameState.players.peasant.hand.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.hand[i];
            card.isRevealed = true;
        }

        gameState.pendingAction = {
            type: "CANCEL_SHOW_CARDS",
            player: "king",
        };
        return gameState;
    }
}

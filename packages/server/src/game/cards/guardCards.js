import {changeTurn, drawCardFromDeck, shuffleArray } from "../../utils/helpers.js";

export const guardCards = {
    1: (gameState) => {
        //"Draw 1 card, then Ready up to 1 Guard"

        drawCardFromDeck(gameState, 'king')
        gameState.pendingAction = {
            player: "king",
            type: "CRIER",
        };
        return gameState;
    },
    2: (gameState) => {
        //"Discard the top 2 cards of the deck"
        console.log("Discard the top 2 cards of the deck")
        if(gameState.deck.length > 0){
            const card = gameState.deck.pop()
            card.isRevealed = true
            gameState.discardPile.push(card)
        }
        if(gameState.deck.length > 0){
            const card = gameState.deck.pop()
            card.isRevealed = true
            gameState.discardPile.push(card)
        }

        return gameState;
    },
    3: (gameState) => {
        //"Ready a Guard, then Mobilize it"
        let guardsInHand = false
        console.log(gameState.players.king.hand.length)
        for (let i = gameState.players.king.hand.length - 1; i >= 0; i--) {
            const card = gameState.players.king.hand[i];
            if (card.typeKing === "Guard") {
                guardsInHand = true
                break;
            }
        }
        if(!guardsInHand){
            throw new Error('No hay guardias en la mano');
        }
        gameState.pendingAction = {
            type: "INQUISITOR",
            player: "king"
        };
        return gameState;
    },
    4: (gameState) => {
        //"Reveal a Rebel"
        const peasantTown = gameState.players.peasant.town;
        let rebelInTown = false;
        for (let card of peasantTown) {
            if (card.typePeasant == "Rebel" && card.isRevealed == false) {
                rebelInTown = true;
                break;
            }
        }
        if (!rebelInTown) {
            throw new Error('No hay rebeldes en el pueblo para revelar');
        }
        gameState.pendingAction = {
            player: "king",
            type: "SPY",
        };
        return gameState;
    },
    5: (gameState) => {
        //"Shuffle the deck and look at the top card, you may put it on the bottom of the deck"
        shuffleArray(gameState.deck);
        gameState.deck[gameState.deck.length - 1].isRevealed = true;

        //TODO: Logica de mostrar cartas de la deck
        gameState.pendingAction = {
            player: "king",
            type: "ADVISOR"
        };
        return gameState;
    },
    6: (gameState) => {
        //"Reveal all Rebels"

        const peasantTown = gameState.players.peasant.town;
        let rebelInTown = false;
        for (let card of peasantTown) {
            if (card.typePeasant == "Rebel") {
                rebelInTown = true;
                break;
            }
        }
        if (!rebelInTown) {
            throw new Error('No hay rebeldes en el pueblo para revelar');
        }
        for (let i = gameState.players.peasant.town.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.town[i];
            card.isRevealed = true;
            if (Number(card.templateId) === 16) {
                gameState.lastEvent = 'KING_REVEALED_ASSASSIN';
            }
        }

        return gameState;
    },
    7: (gameState) => {
        //"Look at any 1 card in the deck, if it is the ASSASSIN discard it, otherwise put it back in order",
        
        gameState.pendingAction = {
            player: "king",
            type: "GUARDIAN",
        };
        return gameState;
    },
    8: (gameState) => {
        //"Peasant Removes 1 hidden Rebel"
        const peasantTown = gameState.players.peasant.town;
        let rebelInTown = false;
        for (let card of peasantTown) {
            if (card.typePeasant == "Rebel" && card.isRevealed == false) {
                rebelInTown = true;
                break;
            }
        }
        if (!rebelInTown) {
            throw new Error('No hay rebeldes en el pueblo para revelar');
        }

        gameState.pendingAction = {
            player: "peasant",
            type: "EXECUTOR"
        };
        changeTurn(gameState)
        return gameState;
    },
    9: (gameState) => {
        //"Look at the top 3 cards of the deck, then put them back in any order"
        for (let i = gameState.deck.length -1 ; i >= gameState.deck.length - 3; i--) {
            if (gameState.deck.length > 0) {
                gameState.deck[i].isRevealed = true;
            }
        }
        gameState.pendingAction = {
            player: "king",
            type: "SENTINEL"
        };
        return gameState;
    },
    15: (gameState) => {
        //"Look at Peasant's hand cards"

        for (let i = gameState.players.peasant.hand.length - 1; i >= 0; i--) {
            gameState.players.peasant.hand[i].isRevealed = true;
        }
        gameState.pendingAction = {
            player: "king",
            type: "WATCHMAN"
        };
        return gameState;
    }
}

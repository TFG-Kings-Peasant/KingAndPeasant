import {changeTurn, drawCardFromDeck, shuffleArray } from "../../utils/helpers.js";

export const rebelCards = {
    1: (gameState) => {
        //Take all Rebels from the discard pile, then Hide them
        let rebelsInDiscardPile = false
        console.log("Take all Rebels from the discard pile, then Hide them")
        for (let i = gameState.discardPile.length - 1; i >= 0; i--) {
            const card = gameState.discardPile[i];

            if (card.typePeasant === "Rebel") {
                card.isRevealed = false;
                rebelsInDiscardPile = true;
                gameState.players.peasant.town.push(card);

                gameState.discardPile.splice(i, 1);
            }
        }
        if(!rebelsInDiscardPile){
            throw new Error('No hay rebeldes en la pila de descartes');
        }
        
        return gameState;
    },
    2: (gameState, playedCard) => {
        //"Shuffle all other Rebels in Town and cards in hand into the deck, then draw 3 cards"
        console.log("Shuffle all other Rebels in Town and cards in hand into the deck, then draw 3 cards")
        console.log("Played card:", playedCard)
        // 1. Mover los "otros" Rebeldes del Town al mazo
        for (let i = gameState.players.peasant.town.length - 1; i >= 0; i--) {
            const [card] = gameState.players.peasant.town.splice(i, 1);

            if (card.typePeasant === "Rebel" && card.uid !== playedCard.uid) {
                card.isRevealed = false; 
                gameState.deck.push(card); 
            }else{
                gameState.players.peasant.town.push(card);
            }
        }

        // 2. Mover TODAS las cartas de la mano al mazo
        for (let i = gameState.players.peasant.hand.length - 1; i >= 0; i--) {
            const [card] = gameState.players.peasant.hand.splice(i, 1);
            gameState.deck.push(card);
        }

        // 3. Barajar el mazo 
        shuffleArray(gameState.deck);

        // 4. Robar 3 cartas
        for (let i = 0; i < 3; i++) {
            if (gameState.deck.length > 0) {
                const drawnCard = gameState.deck.pop();
                console.log("Carta robada:", drawnCard)
                gameState.players.peasant.hand.push(drawnCard);
            }
        }

        return gameState;
    },
    4: (gameState) => {
        //"Remove a Guard, then draw 1 card"
        gameState.pendingAction = {
            type: "THUG",
            player: "peasant"
        };

        return gameState;
    },
    5: (gameState) => {
        //"Look at the top 3 cards of the deck, then take 1 and put the others back in any order"

        //TODO: Logica de mostrar cartas de la deck y dejar que sean seleccionables
        gameState.pendingAction = {
            type: "COURTESAN",
            player: "peasant"
        };

        return gameState;
    },
    6: (gameState) => {
        //"Remove all Rebels and Guards"
        console.log("Remove all Rebels and Guards")
        let rebelsInTown = false;
        let guardsInTown = false;

        for (let i = gameState.players.king.town.length - 1; i >= 0; i--) {
            const card = gameState.players.king.town[i];
            
            if (card.typeKing === "Guard") {
                guardsInTown = true;
                card.isRevealed = true;     
                gameState.discardPile.push(card);     
                gameState.players.king.town.splice(i, 1);     

            }
        }

        for (let i = gameState.players.peasant.town.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.town[i];

            if (card.typePeasant === "Rebel") {
                rebelsInTown = true;
                card.isRevealed = true;     
                gameState.discardPile.push(card);     
                gameState.players.peasant.town.splice(i, 1);   

            }
        }

        if (!rebelsInTown && !guardsInTown) {
            throw new Error('No cartas en el pueblo para eliminar');
        }

        return gameState;
    },
    7: (gameState) => {
        //"Draw up to 3 cards, then put the same number of cards on top of the deck in any order"

        const deckLength = gameState.deck.length
        if (deckLength === 0) {
            throw new Error('No cartas en el mazo para robar');
        }

        // Nos aseguramos de no intentar robar más cartas de las que hay en el mazo
        const amount = Math.min(3, deckLength);

        gameState.pendingAction = {
            type: "CHARLATAN",
            player: "peasant",
            amount: amount
        };

        return gameState;
    },
    8: (gameState) => {
        //"Return up to 2 other Rebels back to hand, then Hide up to 2 Rebelss
        gameState.pendingAction = {
            type: "RAT",
            player: "peasant",
        };
        return gameState;
    },
    10: (gameState) => {
        //"King discards 2 cards, then Peasant takes 1 of them"
        const kingHandLength = gameState.players.king.hand.lenth;

        if (kingHandLength === 0) {
            throw new Error('El rey no tiene cartas en la mano');

        }
        // Calculamos cuántas descarta (2, o 1 si solo le queda esa en la mano)
        //const cardsToDiscard = Math.min(2, kingHandLength);

        // Le pasamos la "patata caliente" al King
        gameState.pendingAction = {
            type: "THIEF",
            player: "king",
            //amount: cardsToDiscard
        };
        changeTurn(gameState)
        return gameState;
    },
    13: (gameState) => {
        //"Infiltrate: Peasant removes a Guard. EXILE"
        //TODO: Mostrar cartas del pueblo del rey
        gameState.pendingAction = {
            type: "DECOY",
            player: "peasant"
        };
        return gameState;
    },
    16: (gameState) => {
        //Infiltrate: Peasant wins. Dispatch: Peasant wins if there are no Guards in Town"
        
        //TODO: CONDICION DE VICTORIA: El peasant gana, el rey a pillado el Asesino
        console.log("CONDICION DE VICTORIA: El peasant gana, el rey a pillado el Asesino")
        return gameState;
    }
}

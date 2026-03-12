import { drawCardFromDeck } from "../../utils/helpers";

export const rebelCards = {
    1: (gameState) => {
        //Take all Rebels from the discard pile, then Hide them
       for (let i = gameState.discardPile.length - 1; i >= 0; i--) {
            const card = gameState.discardPile[i];

            if (card.typePeasant === "Rebel") {
                card.isRevealed = false;

                gameState.players.peasant.town.push(card);

                gameState.discardPile.splice(i, 1);
            }
        }
        return gameState;
    },
    2: (gameState, targetData) => {
        //"Shuffle all other Rebels in Town and cards in hand into the deck, then draw 3 cards"
        const { playedCardUid } = targetData 

        // 1. Mover los "otros" Rebeldes del Town al mazo
        for (let i = gameState.players.peasant.town.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.town[i];
            
            // Verificamos que sea Rebelde y que NO sea la carta que estamos jugando
            if (card.typePeasant === "Rebel" && card.uid !== playedCardUid) {
                gameState.deck.push(card); // La metemos al mazo
                gameState.players.peasant.town.splice(i, 1); // La sacamos del town
            }
        }

        // 2. Mover TODAS las cartas de la mano al mazo
        for (let i = gameState.players.peasant.hand.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.hand.splice(i, 1);
            gameState.deck.push(card);
        }

        // 3. Barajar el mazo 
        shuffleArray(gameState.deck);

        // 4. Robar 3 cartas
        for (let i = 0; i < 3; i++) {
            if (gameState.deck.length > 0) {
                const drawnCard = gameState.deck.pop();
                gameState.players.peasant.hand.push(drawnCard);
            }
        }

        return gameState;
    },
    4: (gameState, targetData) => {
        //"Remove a Guard, then draw 1 card"
        const { targetUid } = targetData; 

        // 1. Eliminar al Guardia seleccionado
        const cardIndex = gameState.players.king.town.findIndex(card => card.uid === targetUid);
        gameState.players.king.town.town.splice(cardIndex, 1);


        // 2. Robar 1 carta para el Peasant
        drawCardFromDeck(gameState, 'peasant')

        return gameState;
    },
    5: (gameState) => {
        //"Look at the top 3 cards of the deck, then take 1 and put the others back in any order"
        const amountToTake = Math.min(3, gameState.deck.length);
        const topThreeCards = gameState.deck.splice(-amountToTake);

        gameState.pendingAction = {
            type: "LOOK_ AND_SELECT_CARDS",
            player: "peasant",
            cards: topThreeCards
        };
        return gameState;
    },
    6: (gameState) => {
        //"Remove all Rebels and Guards"

        // 1. Recorrer el town del King buscando Guardias
        for (let i = gameState.players.king.town.length - 1; i >= 0; i--) {
            const card = gameState.players.king.town[i];
            
            if (card.typeKing === "Guard") {

                card.isRevealed = true;     
                gameState.discardPile.push(card);     
                gameState.players.king.town.splice(i, 1);     

            }
        }

        // 2. Recorrer el town del Peasant buscando Rebeldes
        for (let i = gameState.players.peasant.town.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.town[i];

            if (card.typePeasant === "Rebel") {

                card.isRevealed = true;     
                gameState.discardPile.push(card);     
                gameState.players.peasant.town.splice(i, 1);   

            }
        }

        return gameState;
    },
    7: (gameState) => {
        //"Draw up to 3 cards, then put the same number of cards on top of the deck in any order"
        // targetData.drawAmount debería ser 1, 2 o 3 (elegido por el jugador en la UI)
        const drawAmount = targetData.drawAmount || 3; 

        // Nos aseguramos de no intentar robar más cartas de las que hay en el mazo
        const actualDraws = Math.min(drawAmount, deck.length);

        for (let i = 0; i < actualDraws; i++) {
            gameState.players.peasant.hand.push(gameState.deck.pop()); // Robamos la carta superior
        }

        // Pausamos el juego pidiendo al jugador que devuelva las cartas
        gameState.pendingAction = {
            type: "DRAW_CARDS",
            player: "peasant",
            maxAmount: 3 // Tiene que devolver exactamente las mismas que robó
        };

        return gameState;
    },
    8: (gameState) => {
        //"Return up to 2 other Rebels back to hand, then Hide up to 2 Rebels"

        // 1. Devolver hasta 2 "otros" Rebeldes del Town a la mano
        gameState.pendingAction = {
                type: "RETURN_REBELS",
                player: "peasant",
                maxAmount: 2 
        };
        return gameState;
    },
    10: (gameState) => {
        //"King discards 2 cards, then Peasant takes 1 of them"
        const kingHand = gameState.players.king.hand;

        // Si el rey no tiene cartas, la acción se cancela y no pasa nada
        if (kingHand.length === 0) {
            return gameState;
        }

        // Calculamos cuántas descarta (2, o 1 si solo le queda esa en la mano)
        const cardsToDiscard = Math.min(2, kingHand.length);

        // Le pasamos la "patata caliente" al King
        gameState.pendingAction = {
            type: "KING_DISCARD_FOR_THIEF",
            player: "king",
            amount: cardsToDiscard
        };
        return gameState;
    },
    13: (gameState) => {
        //"Infiltrate: Peasant removes a Guard. EXILE"
        gameState.pendingAction = {
            type: "REMOVE_GUARD_INFILTRATE", // Tu UI sabrá que el Peasant debe elegir un guardia
            player: "peasant", // El Peasant toma el control
            sourceCard: "Decoy", // Para que la UI pueda mostrar "¡El señuelo ha funcionado!"
            amount: 1
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

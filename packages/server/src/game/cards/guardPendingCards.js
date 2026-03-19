import { changeTurn, drawCardFromDeck } from "../../utils/helpers.js";

export const guardPendingCards = {
    "THIEF": (gameState, targetData) => {
        //"King discards 2 cards, then Peasant takes 1 of them"
        const discardUids = targetData?.discardUids || [];
        if (discardUids.length !== 2) {
                throw new Error(`El rey debe descartar exactamente 2 cartas, se han proporcionado ${discardUids.length}`);
        }
        discardUids.forEach(uid => {
            const index = gameState.players.king.hand.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en la mano del rey`);
            }
            const [handCard] = gameState.players.king.hand.splice(index, 1);
            handCard.isRevealed = true
            gameState.discardPile.push(handCard);
        });
        const amount = discardUids.length
        gameState.pendingAction = {
            type: "THIEF2",
            player: "peasant",
            amount: amount
        };

        return gameState;
    },
    "CRIER": (gameState, targetData) => {
        //"Draw 1 card, then Ready up to 1 Guard"
        const targetUid = targetData.targetUid || -1
        if(targetUid !== -1){
            const index = gameState.players.king.hand.findIndex(c => c.uid === targetUid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en la mano del rey`);
            }
            const [handCard] = gameState.players.king.hand.splice(index, 1);
            handCard.isRevealed = true
            gameState.players.king.town.push(handCard);
        }

        changeTurn(gameState)
        return gameState;
    },
    "INQUISITOR": (gameState, targetData) => {
        //"Ready a Guard, then Mobilize it"
        const targetUid = targetData.targetUid || -1
        if(targetUid === -1){
            throw new Error(`No se ha seleccionado una carta`);
        }
        const index = gameState.players.king.hand.findIndex(c => c.uid === targetUid);
        if (index === -1) {
            throw new Error(`La carta con UID ${uid} no está en la mano del rey`);
        }
        const [handCard] = gameState.players.king.hand.splice(index, 1);
        handCard.isRevealed = true
        gameState.players.king.town.push(handCard);
        //TODO: Accionar la carta, opciones: accionarla llamando desde aqui el service, accionarla haciendo una llamada a la api desde el frontend

        changeTurn(gameState)
        return gameState;
    },
    "SPY": (gameState, targetData) => {
        //"Reveal a Rebel"
        const targetUid = targetData.targetUid || -1
        if(targetUid === -1){
            throw new Error(`No se ha seleccionado una carta`);
        }
        const index = gameState.players.peasant.town.findIndex(c => c.uid === targetUid);
        if (index === -1) {
            throw new Error(`La carta con UID ${uid} no está en la mano del rey`);
        }
        const [handCard] = gameState.players.king.hand.splice(index, 1);
        handCard.isRevealed = true

        changeTurn(gameState)
        return gameState;
    },
    "ADVISOR": (gameState, targetData) => {
        //"Shuffle the deck and look at the top card, you may put it on the bottom of the deck"
        const bottom = targetData.bottom
        const card = gameState.deck.pop();
        if(bottom){
            gameState.deck.unshift(card)
        }else{
            gameState.deck.push(card)
        }

        changeTurn(gameState)
        return gameState;
    },
    "GUARDIAN": (gameState, targetData) => {
        //"Look at any 1 card in the deck, if it is the ASSASSIN discard it, otherwise put it back in order",
        const { cardIndex} = targetData.cardIndex || -1
        if(cardIndex === -1){
            throw new Error(`No se ha seleccionado el indice de la carta a mostrar`);
        }
        const [card] = gameState.deck.splice(cardIndex, 1);
        card.isRevealed = true
        //TODO: Logica de mostrar cartas de la deck
        if(card.namePeasant === 'Assassin'){
            //TODO: Condicion de victoria. El rey a desvelado al asesino
            console.log("TODO: Condicion de victoria. El rey a desvelado al asesino")
        }else{
            gameState.deck.splice(cardIndex, 0, card);
            changeTurn(gameState)
        }

        return gameState;
    },
    "SENTINEL": (gameState, targetData) => {
        //"Look at the top 3 cards of the deck, then put them back in any order"
        const { selectedUids} = targetData; 
        selectedUids.forEach(uid => {
            const index = gameState.deck.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en el mazo`);
            }
            
            const [deckCard] = gameState.deck.splice(index, 1);
            
            deckCard.isRevealed = false; 
            
            gameState.deck.push(deckCard);
        });
        
        changeTurn(gameState)
        return gameState;
    },
    "WATCHMAN": (gameState, targetData) => {
        //"Look at Peasant's hand cards"
        for (let i = gameState.players.peasant.hand.length - 1; i >= 0; i--) {
            const card = gameState.players.peasant.hand[i];
            card.isRevealed = false;
        }

        changeTurn(gameState)
        return gameState;
    }
}

import {changeTurn, drawCardFromDeck, shuffleArray } from "../../utils/helpers.js";


export const kingPendingActions = {
    'REASSEMBLE1': (gameState, targetData) => {
        const discardUids = targetData?.discardUids || [];
        
        if (discardUids.length > 2) {
            throw new Error('Solo puedes recuperar hasta 2 cartas del descarte');
        }
        discardUids.forEach(uid => {
            const index = gameState.discardPile.findIndex(c => c.uid === uid);
            if (index === -1) {
                throw new Error(`La carta con UID ${uid} no está en el descarte`);
            }
            
            const [recoveredCard] = gameState.discardPile.splice(index, 1);
            
            recoveredCard.isRevealed = false; 
            
            gameState.players.king.hand.push(recoveredCard);
        });
        gameState.pendingAction = {
            player: 'king',
            type: 'REASSEMBLE2' 
        };
        return gameState;
    },
    'REASSEMBLE2': (gameState, targetData) => {
        if (!targetData || !targetData.guardUid) {
            return gameState;
        }
        const guardIndex = gameState.players.king.hand.findIndex(c => c.uid === targetData.guardUid);
        if (guardIndex === -1) throw new Error('Guardia no encontrado en la mano del jugador');
        const [card] = gameState.players.king.hand.splice(guardIndex,1); 
        card.isRevealed = true;
        gameState.players.king.town.push(card);
        return gameState;                                                           
    },
    'STRIKE': (gameState, targetData) => {
        const {guardUid1, guardUid2} = targetData;
        if (guardUid1 === guardUid2) {
            throw new Error('No puedes seleccionar la misma carta dos veces');
        }
        const guardIndex1 = gameState.players.king.town.findIndex(card => card.uid === guardUid1);
        const guardIndex2 = gameState.players.king.town.findIndex(card => card.uid === guardUid2);
        if (guardIndex1 === -1 || guardIndex2 === -1) {
            throw new Error('Carta no encontrada en el pueblo del rey');
        }
        
        const indices = [guardIndex1, guardIndex2].sort((a, b) => b - a);

        const [guardCard1] = gameState.players.king.town.splice(indices[0], 1);
        const [guardCard2] = gameState.players.king.town.splice(indices[1], 1);
        guardCard1.isRevealed = true;
        guardCard2.isRevealed = true;
        
        gameState.discardPile.push(guardCard1, guardCard2);
        //Aquí se llamaría a la función de efectos de cartas
        return gameState;
    },
    'ARREST': (gameState, targetData) => {
        if (!targetData || !targetData.option) {
            throw new Error('Debes elegir una opción: descartar del pueblo o del mazo');
        }
        if (targetData.option === 'DECK') {
            if (gameState.deck.length === 0) {
                throw new Error('No hay cartas en el mazo para descartar');
            }
            const card = gameState.deck.pop();
            card.isRevealed = true;
            gameState.discardPile.push(card);
        } else if (targetData.option === 'TOWN') {
            if (gameState.players.peasant.town.length === 0) {
                throw new Error('No hay cartas en el pueblo para descartar');
            }
            if (!targetData.targetUid) {
                throw new Error('No se ha proporcionado la carta objetivo');
            }
            const cardIndex = gameState.players.peasant.town.findIndex(card => card.uid === targetData.targetUid);
            if (cardIndex === -1) {
                throw new Error('La carta objetivo no está en el pueblo');
            }
            const card = gameState.players.peasant.town.splice(cardIndex, 1)[0];
            card.isRevealed = true;
            gameState.discardPile.push(card);
        }
        else {
            throw new Error('Opción no válida');
        }
        return gameState
    },
//GUARD Cards


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
        const amount = discardUids
        gameState.pendingAction = {
            type: "THIEF2",
            player: "peasant",
            amount: amount
        };
        changeTurn(gameState)

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
        return {gameState, handCard};
    },
    "SPY": (gameState, targetData) => {
        //"Reveal a Rebel"
        const targetUid = targetData.targetUid || -1
        if(targetUid === -1){
            throw new Error(`No se ha seleccionado una carta`);
        }
        const index = gameState.players.peasant.town.findIndex(c => c.uid === targetUid);
        if (index === -1) {
            throw new Error(`La carta con UID ${targetUid} no está en la mano del rey`);
        }
        const townCard = gameState.players.peasant.town[index];
        townCard.isRevealed = true

        if (Number(townCard.templateId) === 16) {
            gameState.lastEvent = 'KING_REVEALED_ASSASSIN';
        }

        return gameState;
    },
    "ADVISOR": (gameState, targetData) => {
        //"Shuffle the deck and look at the top card, you may put it on the bottom of the deck"
        const bottom = targetData.bottom
        const card = gameState.deck.pop();
        card.isRevealed = false
        if(bottom){
            gameState.deck.unshift(card)
        }else{
            gameState.deck.push(card)
        }

        return gameState;
    },
    "GUARDIAN": (gameState, targetData) => {
        //"Look at any 1 card in the deck, if it is the ASSASSIN discard it, otherwise put it back in order",
        const targetUid = targetData.targetUid || -1
        if(targetUid === -1){
            throw new Error(`No se ha seleccionado el UID de la carta a mostrar`);
        }
        const cardIndex = gameState.deck.findIndex(c => c.uid === targetUid);
        if (cardIndex === -1) {
            throw new Error(`La carta con UID ${targetUid} no está en el mazo`);
        }
        gameState.deck[cardIndex].isRevealed = true;
        if(Number(gameState.deck[cardIndex].templateId) === 16){
            const [assassinCard] = gameState.deck.splice(cardIndex, 1);
            gameState.discardPile.push(assassinCard);
            gameState.lastEvent = 'KING_REVEALED_ASSASSIN';
            gameState.pendingAction = null;
            return gameState;
        }

        gameState.pendingAction = {
            player: "king",
            type: "GUARDIAN2",
        };
        return gameState;
    },
    "GUARDIAN2": (gameState, targetData) => {
        gameState.deck.map(card => card.isRevealed = false);
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
        
        return gameState;
    },
    "WATCHMAN": (gameState) => {
        //"Look at Peasant's hand cards"
        for (let i = gameState.players.peasant.hand.length - 1; i >= 0; i--) {
            gameState.players.peasant.hand[i].isRevealed = false;

        }

        return gameState;
    }
}



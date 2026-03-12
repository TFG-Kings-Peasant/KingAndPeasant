export function shuffleArray(array) {
    for (let i = array.length -1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i +1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function changeTurn(gameState) {
    gameState.turn = gameState.turn === "king" ? "peasant" : "king";
    return gameState;
}

export function getUserRol(gameState, userId) {
    return Number(gameState.players.king.id) === Number(userId) ? "king" : "peasant";
}


export function getCardType(playedCard, userRol){
    return userRol==="king"? playedCard.typeKing : playedCard.typePeasant;
}

export function canInfiltrate(card){
    return card.descPeasant.includes("Infiltrate:")
}


export function drawCardFromDeck(gameState, userRol){
    if (gameState.deck.length <= 0) {
        //TODO: CONDICION DE VICTORIA: No quedan cartas en la deck, condicion de victoria
        console.log("CONDICION DE VICTORIA: No quedan cartas en la deck")
    }
    const card = gameState.deck.pop();
    if(userRol==='king'){
        gameState.players.king.hand.push(card);
    }else{
        gameState.players.peasant.hand.push(card);
    }
    return gameState;
}
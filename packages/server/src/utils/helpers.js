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
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
    return card.templateId === 13 || card.templateId === 16;
}


export function drawCardFromDeck(gameState, userRol){
    const card = gameState.deck.pop();
    if(userRol==='king'){
        gameState.players.king.hand.push(card);
    }else{
        gameState.players.peasant.hand.push(card);
    }
    return gameState;
}

export function checkTownGuards(gameState){
    const currentGuards = gameState.players.king.town.filter(c => c.typeKing === 'Guard').length;
    if (currentGuards >= 3) throw new Error('El rey no puede tener más de 3 guardias en el pueblo');
}
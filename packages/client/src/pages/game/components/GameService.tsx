export interface CardState {
    uid: string;
    templateId?: number;
    isRevealed: boolean;
}

export interface GameState {
    id: number;
    turnNumber: number;
    turn: 'king' | 'peasant';
    deckCount: number;
    discardPile: CardState[];
    players: {
        king: {
            id: number;
            hand: CardState[];
            town: CardState[];
        },
        peasant: {
            id: number;
            hand: CardState[];
            town: CardState[];
        }
    }
}

const API_URL = import.meta.env.VITE_API_URL+"/api/game";

export const startGame = async (lobbyId: number, player1Id: number, player2Id: number) => {
    const response = await fetch(API_URL + "/start", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            lobbyId,
            player1Id, 
            player2Id 
        }),
    });
    if (!response.ok) { 
        const error = await response.json();    
        throw new Error(error.error || "Failed to start game");
    }
    return await response.json();
};

export const getGameStateById = async (gameId: number) => {
    const response = await fetch(API_URL + `/${gameId}`);
    if (!response.ok) { 
        const errorText = await response.text(); // Leemos qué nos ha respondido el servidor
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

export const makeExampleAction = async (gameId: number, playerId: number) => {
    const response = await fetch(API_URL + `/${gameId}`+ `/example-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            playerId
        })
    });
    if(!response.ok){
        const errorText = await response.text(); // Leemos qué nos ha respondido el servidor
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
}
export type CardPosition = 'hand' | 'town' | 'myTown' | 'rivalTown' | 'rivalHand' | 'deck' | 'discard';

export interface CardState {
    uid: string;
    templateId?: number;
    typeKing: string;
    typePeasant: string;
    position?: CardPosition;
    isRevealed: boolean;
}


export interface GameState {
    id: number;
    startedAt: string;
    era: number;
    scores: Record<string, number>;
    turnNumber: number;
    turn: 'king' | 'peasant';
    deck: CardState[];
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
    };
    pendingAction: {
        player: 'king' | 'peasant';
        type: string;
        amount?: number;
    }

}

const API_URL = import.meta.env.VITE_API_URL+"/api/game";

export const startGame = async (lobbyId: number, player1Id: number, player2Id: number, token: string) => {
    const response = await fetch(API_URL + "/start", {
        method: 'POST',
        headers: { 
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
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
};// Leemos qué nos ha respondido el servidor

export const getGameStateById = async (gameId: number, token: string) => {
    const response = await fetch(API_URL + `/${gameId}`, {
        method: 'GET',
        headers: { 
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
    });
    if (!response.ok) { 
        const errorText = await response.text();
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

export const playCard = async (gameId: number, cardUid: string, targetData: Record<string, unknown> = {}, isHand: boolean,token: string) => {
    const response = await fetch(`${API_URL}/${gameId}/playCard`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
            cardUid,
            targetData,
            isHand
        }),
    });
    if (!response.ok) { 
        const errorText = await response.text();
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

export const resolvePendingAction = async (gameId: number, targetData: Record<string, unknown> = {}, token: string) => {
    const response = await fetch(`${API_URL}/${gameId}/resolveAction`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({targetData})
    });
    if (!response.ok) { 
        const errorText = await response.text(); 
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

export const condemnRebel = async (gameId: number, isDeck: boolean, cardUid: string, token: string) => {
    const response = await fetch(`${API_URL}/${gameId}/condemnRebel`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            isDeck,
            cardUid
        }),
    });
    if (!response.ok) { 
        const errorText = await response.text();
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

export const passTurn = async (gameId: number, token: string) => {
    const response = await fetch(`${API_URL}/${gameId}/passTurn`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json' 
        }
    });
    if (!response.ok) { 
        const errorText = await response.text(); 
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

export const drawACard = async (gameId: number, token: string) => {
    const response = await fetch(`${API_URL}/${gameId}/drawACard`, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${token}`,
            'Content-Type': 'application/json' 
        }
    });
    if (!response.ok) { 
        const errorText = await response.text(); 
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

export const getPosibleActions = (card: CardState, isKing: boolean) => {
    if(isKing){
        switch(card.typeKing){
            case "Action":
                return "Jugar acción";
            case "Guard":
                if(card.position === "hand"){
                    return "Preparar un guardia";
                }else if(card.position === "myTown"){
                    return "Movilizar un guardia";
                }else{
                    return "";
                }
            default:
                if(!card.isRevealed){
                    return "Condenar rebelde";
                }else{
                    return "";
                }
        }
    }else{
        switch(card.typePeasant){
            case "Action":
                return "Jugar acción";
            case "Rebel":
                if(card.position === "hand"){
                    return "Esconder rebelde"
                }else if(card.position === "myTown"){
                    if(card.isRevealed){
                        return "Devolver a la mano";
                    }else{
                        return "Activar rebelde o infiltrar en el mazo";
                    }
                }else{
                    return "";
                }
            default:
                return "";
        }
    }
}
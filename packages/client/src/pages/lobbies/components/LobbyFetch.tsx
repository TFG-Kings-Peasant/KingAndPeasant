// Definimos la estructura que devuelve el backend
export interface LobbyBackend {
    id: number;
    name: string;
    status: 'WAITING' | 'ONGOING';
    privacy: 'PUBLIC' | 'PRIVATE';
    player1Ready: boolean; 
    player2Ready: boolean;
    player1Id: number;
    player2Id: number | null;
}

const API_URL = 'http://localhost:3000/api/lobby';

export const getAllLobbies = async (): Promise<LobbyBackend[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        const errorText = await response.text(); // Leemos qué nos ha respondido el servidor
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
};

export const createLobby = async (name: string, privacy: string, player1Id: string | null) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name, 
            privacy,
            player1Id: player1Id // Enviamos el ID del jugador que crea la sala
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || error.error || 'Error desconocido del servidor';
        throw new Error(errorMessage);
    }
    return await response.json();
};

export const getLobbyById = async (lobbyId : number) => {
    const response = await fetch(API_URL + `/${lobbyId}`);
    if (!response.ok) {
        const errorText = await response.text(); // Leemos qué nos ha respondido el servidor
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
}

export const joinLobby = async (lobbyId: number, player2Id: string | null) => {
    const response = await fetch(API_URL + `/${lobbyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            player2Id: player2Id
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || error.error || 'Error desconocido del servidor';
        throw new Error(errorMessage);
    }
    return await response.json();
};

export const leaveLobby = async (lobbyId: number, playerId: string | null) => {
    const response = await fetch(API_URL + `/${lobbyId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            playerId: playerId
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || error.error || 'Error desconocido del servidor';
        throw new Error(errorMessage);
    }
    return await response.json();
};

export const setPlayerReady = async (lobbyId: number, playerId: string | null, isReady: boolean) => {
    const response = await fetch(API_URL + `/${lobbyId}/setReady`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            playerId: playerId,
            isReady: isReady
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || error.error || 'Error desconocido del servidor';
        throw new Error(errorMessage);
    }
    return await response.json();
};
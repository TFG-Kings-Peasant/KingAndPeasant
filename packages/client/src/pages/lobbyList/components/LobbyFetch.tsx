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
const USER_5 = 5; // ID de usuario hardcodeado para la creación de lobbies

export const getAllLobbies = async (): Promise<LobbyBackend[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        const errorText = await response.text(); // Leemos qué nos ha respondido el servidor
        console.error("❌ ERROR DEL SERVER:", response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
    }
    return await response.json();
};

export const createLobby = async (name: string, privacy: string) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name, 
            privacy,
            player1Id: USER_5 // Enviamos el ID hardcodeado
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

export const joinLobby = async (lobbyId: number) => {
    const response = await fetch(API_URL + `/${lobbyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            player2Id: USER_5 // Enviamos el ID hardcodeado
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || error.error || 'Error desconocido del servidor';
        throw new Error(errorMessage);
    }
    return await response.json();
};

export const leaveLobby = async (lobbyId: number) => {
    const response = await fetch(API_URL + `/${lobbyId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            playerId: 1 // Enviamos el ID hardcodeado
        }),
    });
    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || error.error || 'Error desconocido del servidor';
        throw new Error(errorMessage);
    }
    return await response.json();
};

export const setPlayerReady = async (lobbyId: number, isReady: boolean) => {
    const response = await fetch(API_URL + `/${lobbyId}/setReady`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            playerId: USER_5, // Enviamos el ID hardcodeado
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
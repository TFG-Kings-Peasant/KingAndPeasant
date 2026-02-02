// Definimos la estructura que devuelve el backend
export interface LobbyBackend {
    id: number;
    name: string;
    status: 'WAITING' | 'ONGOING';
    privacy: 'PUBLIC' | 'PRIVATE';
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
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    getAllLobbies, 
    createLobby, 
    getLobbyById, 
    joinLobby, 
    leaveLobby, 
    setPlayerReady, 
    getMyLobby 
} from './LobbyService'; // Asegúrate de que el nombre del archivo coincide

// Mockeamos la variable de entorno para los tests
vi.stubEnv('VITE_API_URL', 'http://localhost:3000');

// Mockeamos el fetch global
global.fetch = vi.fn();

describe('LobbyService API', () => {
    const MOCK_TOKEN = 'mi-token-secreto-123';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getAllLobbies', () => {
        test('Devuelve la lista de lobbys si el fetch es exitoso', async () => {
            const mockData = [{ id: 1, name: 'Sala 1' }];
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            });

            const result = await getAllLobbies();
            
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/lobby');
            expect(result).toEqual(mockData);
        });

        test('Lanza un error con el texto de la respuesta si el fetch falla', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error'
            });

            await expect(getAllLobbies()).rejects.toThrow('Error 500: Internal Server Error');
        });
    });

    describe('getLobbyById', () => {
        test('Devuelve el lobby e incluye el token de autorización', async () => {
            const mockData = { id: 5, name: 'Sala 5' };
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            });

            const result = await getLobbyById(5, MOCK_TOKEN);
            
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/lobby/5', expect.objectContaining({
                headers: { 'Authorization': `Bearer ${MOCK_TOKEN}` }
            }));
            expect(result).toEqual(mockData);
        });

        test('Lanza un error con el texto de la respuesta si el fetch falla', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: async () => 'Not Found'
            });

            await expect(getLobbyById(99, MOCK_TOKEN)).rejects.toThrow('Error 404: Not Found');
        });
    });

    describe('createLobby', () => {
        test('Crea el lobby incluyendo los headers con el token', async () => {
            const mockData = { id: 1, name: 'Nueva Sala' };
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            });

            const result = await createLobby('Nueva Sala', 'PUBLIC', '2', MOCK_TOKEN);
            
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/lobby', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: JSON.stringify({ name: 'Nueva Sala', privacy: 'PUBLIC', player1Id: '2' })
            }));
            expect(result).toEqual(mockData);
        });

        test('Lanza error usando message, error o fallback si falla', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'Nombre duplicado' })
            });
            await expect(createLobby('A', 'PUBLIC', '1', MOCK_TOKEN)).rejects.toThrow('Nombre duplicado');

            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Falta ID' })
            });
            await expect(createLobby('A', 'PUBLIC', '1', MOCK_TOKEN)).rejects.toThrow('Falta ID');

            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({})
            });
            await expect(createLobby('A', 'PUBLIC', '1', MOCK_TOKEN)).rejects.toThrow('Error desconocido del servidor');
        });
    });

    describe('joinLobby', () => {
        test('Se une a la sala inyectando el token en headers', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 1, player2Id: 2 })
            });

            await joinLobby(1, '2', MOCK_TOKEN);
            
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/lobby/1/join', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: JSON.stringify({ player2Id: '2' })
            }));
        });

        test('Lanza error si falla al unirse', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'Sala llena' })
            });

            await expect(joinLobby(1, '2', MOCK_TOKEN)).rejects.toThrow('Sala llena');
        });
    });

    describe('leaveLobby', () => {
        test('Abandona la sala inyectando el token en headers', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            await leaveLobby(1, '2', MOCK_TOKEN);
            
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/lobby/1/leave', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: JSON.stringify({ playerId: '2' })
            }));
        });

        test('Lanza error si falla al salir', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'No estás en la sala' })
            });

            await expect(leaveLobby(1, '2', MOCK_TOKEN)).rejects.toThrow('No estás en la sala');
        });
    });

    describe('setPlayerReady', () => {
        test('Cambia el estado inyectando el token en headers', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ player1Ready: true })
            });

            await setPlayerReady(1, '2', true, MOCK_TOKEN);
            
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/lobby/1/setReady', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MOCK_TOKEN}` },
                body: JSON.stringify({ playerId: '2', isReady: true })
            }));
        });

        test('Lanza error si falla al cambiar estado', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ message: 'Sala no encontrada' })
            });

            await expect(setPlayerReady(1, '2', true, MOCK_TOKEN)).rejects.toThrow('Sala no encontrada');
        });
    });

    describe('getMyLobby', () => {
        test('Devuelve el lobby usando el token de autorización', async () => {
            const mockData = { id: 10, name: 'Mi Sala' };
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockData
            });

            const result = await getMyLobby(MOCK_TOKEN);
            
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/lobby/myLobby', expect.objectContaining({
                headers: expect.objectContaining({
                    "Authorization": `Bearer ${MOCK_TOKEN}`
                })
            }));
            expect(result).toEqual(mockData);
        });

        test('Devuelve NULL si la respuesta no es ok', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false
            });

            const result = await getMyLobby(MOCK_TOKEN);
            expect(result).toBeNull();
        });
    });
});
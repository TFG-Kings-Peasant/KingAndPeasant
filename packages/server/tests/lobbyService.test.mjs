import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// 1. Mockeamos el cliente de Prisma para no tocar la BD real
const mockPrisma = {
  lobby: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.unstable_mockModule('../config/db.js', () => ({
  prisma: mockPrisma,
}));

// Importamos el servicio DESPUÉS de hacer el mock
const { lobbyService } = await import('../src/services/LobbyService.js');

describe('Lobby Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLobbies', () => {
    test('Devuelve todos los lobbys de la base de datos', async () => {
      const mockLobbies = [{ id: 1, name: 'Sala 1' }, { id: 2, name: 'Sala 2' }];
      mockPrisma.lobby.findMany.mockResolvedValue(mockLobbies);

      const result = await lobbyService.getAllLobbies();

      expect(mockPrisma.lobby.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLobbies);
    });
  });

  describe('createLobby', () => {
    test('Falla si el usuario ya está activo en otro lobby', async () => {
      mockPrisma.lobby.findFirst.mockResolvedValue({ id: 1, name: 'Lobby 1' });

      await expect(lobbyService.createLobby({ name: 'Nuevo', player1Id: 1 }))
        .rejects.toThrow('El usuario ya se encuentra en otra sala.');
    });

    test('Falla si el nombre del lobby ya existe', async () => {
      mockPrisma.lobby.findFirst.mockResolvedValue(null); 
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 2, name: 'Sala Copia' }); 

      await expect(lobbyService.createLobby({ name: 'Sala Copia', player1Id: 1 }))
        .rejects.toThrow('Ya existe una sala con ese nombre.');
    });

    test('Crea un lobby exitosamente si todo es correcto', async () => {
      mockPrisma.lobby.findFirst.mockResolvedValue(null);
      mockPrisma.lobby.findUnique.mockResolvedValue(null);
      mockPrisma.lobby.create.mockResolvedValue({ id: 3, name: 'Sala Valida' });

      const result = await lobbyService.createLobby({ name: 'Sala Valida', privacy: 'PUBLIC', player1Id: 1 });

      expect(mockPrisma.lobby.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Sala Valida',
          status: 'WAITING',
          privacy: 'PUBLIC',
          player1Id: 1
        })
      });
      expect(result).toEqual({ id: 3, name: 'Sala Valida' });
    });
  });

  describe('joinLobby', () => {
    test('Falla si el jugador que se une ya pertenece a otra sala activa', async () => {
      // Simula el "if (activeLobby)"
      mockPrisma.lobby.findFirst.mockResolvedValue({ id: 5, name: 'Otra sala' });

      await expect(lobbyService.joinLobby({ lobbyId: 1, player2Id: 2 }))
        .rejects.toThrow('Ya perteneces a otra sala.');
    });

    test('Falla si el lobby no existe', async () => {
      mockPrisma.lobby.findFirst.mockResolvedValue(null); 
      mockPrisma.lobby.findUnique.mockResolvedValue(null); 

      await expect(lobbyService.joinLobby({ lobbyId: 99, player2Id: 2 }))
        .rejects.toThrow('Lobby no encontrado');
    });

    test('Falla si el lobby es PRIVADO', async () => {
      mockPrisma.lobby.findFirst.mockResolvedValue(null);
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, privacy: 'PRIVATE' });

      await expect(lobbyService.joinLobby({ lobbyId: 1, player2Id: 2 }))
        .rejects.toThrow('No puedes unirte a una partida privada sin invitación.');
    });

    test('Falla si el lobby ya está lleno', async () => {
      // Simula el "if (lobby.player2Id)"
      mockPrisma.lobby.findFirst.mockResolvedValue(null);
      mockPrisma.lobby.findUnique.mockResolvedValue({ 
        id: 1, privacy: 'PUBLIC', player1Id: 1, player2Id: 3 // Ya hay un player2
      });

      await expect(lobbyService.joinLobby({ lobbyId: 1, player2Id: 2 }))
        .rejects.toThrow('El lobby ya está lleno');
    });

    test('Falla si el jugador 2 intenta unirse a su propia sala', async () => {
      mockPrisma.lobby.findFirst.mockResolvedValue(null);
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, player1Id: 2, privacy: 'PUBLIC' }); 

      await expect(lobbyService.joinLobby({ lobbyId: 1, player2Id: 2 }))
        .rejects.toThrow('Ya formas parte de esta sala como creador.');
    });

    test('Actualiza el lobby si la unión es válida', async () => {
      mockPrisma.lobby.findFirst.mockResolvedValue(null);
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, player1Id: 1, player2Id: null, privacy: 'PUBLIC' });
      mockPrisma.lobby.update.mockResolvedValue({ id: 1, player1Id: 1, player2Id: 2 });

      const result = await lobbyService.joinLobby({ lobbyId: 1, player2Id: 2 });

      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { player2Id: 2 },
      });
      expect(result.player2Id).toBe(2);
    });
  });

  describe('leaveLobby', () => {
    test('Falla si el lobby no existe', async () => {
      // Simula el "if (!lobby)"
      mockPrisma.lobby.findUnique.mockResolvedValue(null);

      await expect(lobbyService.leaveLobby({ lobbyId: 99, playerId: 1 }))
        .rejects.toThrow('Lobby no encontrado');
    });

    test('Falla si el jugador no está en el lobby', async () => {
      // Simula el "if (lobby.player1Id !== playerId && lobby.player2Id !== playerId)"
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, player1Id: 2, player2Id: 3 });

      await expect(lobbyService.leaveLobby({ lobbyId: 1, playerId: 1 })) // Player 1 intenta salir de una sala de 2 y 3
        .rejects.toThrow('El jugador no está en el lobby');
    });

    test('Devuelve el lobby sin cambios si el estado es ONGOING', async () => {
      const activeLobby = { id: 1, status: 'ONGOING', player1Id: 1, player2Id: 2 };
      mockPrisma.lobby.findUnique.mockResolvedValue(activeLobby);

      const result = await lobbyService.leaveLobby({ lobbyId: 1, playerId: 1 });

      expect(mockPrisma.lobby.update).not.toHaveBeenCalled();
      expect(result).toEqual(activeLobby);
    });

    test('Elimina la sala si el Player 1 sale y no hay Player 2', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, player1Id: 1, player2Id: null });
      mockPrisma.lobby.delete.mockResolvedValue({ id: 1 });

      await lobbyService.leaveLobby({ lobbyId: 1, playerId: 1 });

      expect(mockPrisma.lobby.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    test('Promueve al Player 2 a Player 1 si el creador original sale', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({ 
        id: 1, player1Id: 1, player2Id: 2, player2Ready: true 
      });

      await lobbyService.leaveLobby({ lobbyId: 1, playerId: 1 });

      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { player1Id: 2, player1Ready: true, player2Ready: false, player2Id: null }
      });
    });

    test('Libera el hueco 2 si el Player 2 es el que sale', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, player1Id: 1, player2Id: 2 });

      await lobbyService.leaveLobby({ lobbyId: 1, playerId: 2 });

      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { player2Id: null, player2Ready: false }
      });
    });
  });

  describe('setPlayerReady', () => {
    test('Falla si el lobby no existe', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue(null);
      await expect(lobbyService.setPlayerReady({ lobbyId: 1, playerId: 1, isReady: true }))
        .rejects.toThrow('Lobby no encontrado');
    });

    test('Falla si el jugador no está en el lobby', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, player1Id: 2, player2Id: 3 });
      await expect(lobbyService.setPlayerReady({ lobbyId: 1, playerId: 1, isReady: true }))
        .rejects.toThrow('El jugador no está en el lobby');
    });

    test('Actualiza player1Ready si es el creador', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, player1Id: 1, player2Id: 2 });
      
      await lobbyService.setPlayerReady({ lobbyId: 1, playerId: 1, isReady: true });

      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { player1Ready: true }
      });
    });

    test('Actualiza player2Ready si es el invitado', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1, player1Id: 1, player2Id: 2 });
      
      await lobbyService.setPlayerReady({ lobbyId: 1, playerId: 2, isReady: true });

      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { player2Ready: true }
      });
    });
  });

  describe('Cambios de estado: setLobbyOngoing y setLobbyWaiting', () => {
    test('setLobbyOngoing falla si el lobby no existe', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue(null);
      await expect(lobbyService.setLobbyOngoing(1)).rejects.toThrow('Lobby no encontrado');
    });

    test('setLobbyOngoing actualiza el estado a ONGOING', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1 });
      
      await lobbyService.setLobbyOngoing(1);
      
      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'ONGOING' }
      });
    });

    test('setLobbyWaiting falla si el lobby no existe', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue(null);
      await expect(lobbyService.setLobbyWaiting(1)).rejects.toThrow('Lobby no encontrado');
    });

    test('setLobbyWaiting actualiza el estado a WAITING', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({ id: 1 });
      
      await lobbyService.setLobbyWaiting(1);
      
      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'WAITING' }
      });
    });
  });
});
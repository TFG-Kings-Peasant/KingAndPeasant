import { describe, test, expect, beforeEach, jest, afterEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

// 1. Mockeamos el servicio de Lobbys
const mockLobbyService = {
  getAllLobbies: jest.fn(),
  getLobbyById: jest.fn(),
  createLobby: jest.fn(),
  joinLobby: jest.fn(),
  leaveLobby: jest.fn(),
  setPlayerReady: jest.fn(),
  getUserActiveLobby: jest.fn(),
};

jest.unstable_mockModule('../src/services/LobbyService.js', () => ({
  lobbyService: mockLobbyService,
}));

// Mockeamos el middleware de autenticación
jest.unstable_mockModule('../middleware.js', () => ({
  authenticateToken: (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Acceso denegado. Usuario no registrado.' });
    try {
      const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
      req.user = verified;
      // Simulamos caso de token sin ID para forzar errores de validación
      if (req.user.id === 999) delete req.user.id; 
      next();
    } catch (err) {
      res.status(400).json({ message: 'Token inválido' });
    }
  }
}));

const { default: lobbyRoutes } = await import('../src/routes/LobbyRoutes.js');

// Configuración de Express para testear
const mockIoEmit = jest.fn();
const mockIoToEmit = jest.fn();
const mockIoTo = jest.fn().mockReturnValue({ emit: mockIoToEmit });

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.set('io', {
    emit: mockIoEmit,
    to: mockIoTo
  });
  // Usamos un enrutador global para poder simular el orden de rutas
  const mainRouter = express.Router();
  mainRouter.use('/api/lobbies', lobbyRoutes);
  app.use(mainRouter);
  return app;
};

const authHeader = (userId = 1, name = 'PlayerOne') => {
  const token = jwt.sign({ id: userId, name }, process.env.JWT_SECRET);
  return `Bearer ${token}`;
};

describe('Lobby Routes & Controller (Completo)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // GET /api/lobbies (getLobbies)
  // ==========================================
  describe('GET /api/lobbies', () => {
    test('Devuelve 200 y la lista de lobbys', async () => {
      mockLobbyService.getAllLobbies.mockResolvedValue([{ id: 1, name: 'Lobby 1' }]);
      const app = buildApp();
      const response = await request(app).get('/api/lobbies');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ id: 1, name: 'Lobby 1' }]);
    });

    test('Devuelve 500 si falla el servicio', async () => {
      mockLobbyService.getAllLobbies.mockRejectedValue(new Error('Fallo base de datos'));
      const app = buildApp();
      const response = await request(app).get('/api/lobbies');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error al obtener lobbies');
    });
  });

  // ==========================================
  // GET /api/lobbies/myLobby (getMyLobby)
  // ==========================================
  describe('GET /api/lobbies/myLobby', () => {
    test('Devuelve 200 y el lobby activo del usuario', async () => {
      mockLobbyService.getUserActiveLobby.mockResolvedValue({ id: 1, player1Id: 1 });
      const app = buildApp();
      const response = await request(app)
        .get('/api/lobbies/myLobby')
        .set('Authorization', authHeader(1));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, player1Id: 1 });
    });

    test('Devuelve 400 si req.user no tiene id', async () => {
      const app = buildApp();
      const response = await request(app)
        .get('/api/lobbies/myLobby')
        .set('Authorization', authHeader(999)); // ID 999 mockeado arriba para borrar el id

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('No se ha proporcionado un ID de usuario');
    });

    test('Devuelve 500 si ocurre un error en el servicio', async () => {
      mockLobbyService.getUserActiveLobby.mockRejectedValue(new Error('Error DB'));
      const app = buildApp();
      const response = await request(app)
        .get('/api/lobbies/myLobby')
        .set('Authorization', authHeader(1));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error al obtener tu lobby');
    });
  });

  // ==========================================
  // GET /api/lobbies/:id (getLobbyById)
  // ==========================================
  describe('GET /api/lobbies/:id', () => {
    test('Devuelve 200 y el lobby si existe', async () => {
      mockLobbyService.getLobbyById.mockResolvedValue({ id: 2, name: 'Test' });
      const app = buildApp();
      const response = await request(app)
        .get('/api/lobbies/2')
        .set('Authorization', authHeader(1)); 

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 2, name: 'Test' });
    });

    test('Devuelve 404 si el lobby no existe', async () => {
      mockLobbyService.getLobbyById.mockResolvedValue(null);
      const app = buildApp();
      const response = await request(app)
        .get('/api/lobbies/99')
        .set('Authorization', authHeader(1)); 

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Lobby no encontrado');
    });

    test('Maneja un 500 (handleLobbyError fallback) si falla por un error genérico', async () => {
      mockLobbyService.getLobbyById.mockRejectedValue(new Error('Error desconocido'));
      const app = buildApp();
      const response = await request(app)
        .get('/api/lobbies/1')
        .set('Authorization', authHeader(1));

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error interno del servidor');
    });
  });

  // ==========================================
  // POST /api/lobbies/:id/leave (leaveLobby)
  // ==========================================
  describe('POST /api/lobbies/:id/leave', () => {
    test('Devuelve 400 si faltan datos requeridos (playerId)', async () => {
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies/1/leave')
        .set('Authorization', authHeader(1))
        .send({}); // Enviamos body vacío

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Faltan datos requeridos');
    });

    test('Devuelve 200, actualiza y emite evento al salir', async () => {
      mockLobbyService.leaveLobby.mockResolvedValue({ id: 1, player1Id: 2 });
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies/1/leave')
        .set('Authorization', authHeader(1))
        .send({ playerId: 1 });

      expect(response.status).toBe(200);
      expect(mockIoTo).toHaveBeenCalledWith('lobby1');
      expect(mockIoToEmit).toHaveBeenCalledWith('lobbyUpdated');
    });

    test('Devuelve 404 via handleLobbyError si lobby no existe', async () => {
      mockLobbyService.leaveLobby.mockRejectedValue(new Error('Lobby no encontrado'));
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies/99/leave')
        .set('Authorization', authHeader(1))
        .send({ playerId: 1 });

      expect(response.status).toBe(404);
    });
  });

  // ==========================================
  // POST /api/lobbies/:id/setReady (setPlayerReady)
  // ==========================================
  describe('POST /api/lobbies/:id/setReady', () => {
    test('Devuelve 400 si faltan datos (isReady no definido)', async () => {
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies/1/setReady')
        .set('Authorization', authHeader(1))
        .send({ playerId: 1 }); // Falta isReady

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation error'); 
    });

    test('Devuelve 200, actualiza estado y emite evento', async () => {
      mockLobbyService.setPlayerReady.mockResolvedValue({ id: 1, player1Ready: true });
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies/1/setReady')
        .set('Authorization', authHeader(1))
        .send({ playerId: 1, isReady: true });

      expect(response.status).toBe(200);
      expect(mockIoTo).toHaveBeenCalledWith('lobby1');
      expect(mockIoToEmit).toHaveBeenCalledWith('lobbyUpdated');
    });

    test('Devuelve 403 via handleLobbyError si jugador no está en el lobby', async () => {
      mockLobbyService.setPlayerReady.mockRejectedValue(new Error('El jugador no está en el lobby'));
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies/1/setReady')
        .set('Authorization', authHeader(5))
        .send({ playerId: 5, isReady: true });

      expect(response.status).toBe(403);
    });
  });

  // ==========================================
  // CREACIÓN Y UNIÓN (Comprobaciones previas)
  // ==========================================
  describe('Creación de Lobbys (POST /api/lobbies)', () => {
    test('Falla al crear un lobby sin los datos necesarios (400 genérico del Controller)', async () => {
      const app = buildApp();
      // Desactivamos temporalmente el mock de validación si queremos probar el fallback
      const response = await request(app)
        .post('/api/lobbies')
        .set('Authorization', authHeader(1))
        .send({ privacy: 'PUBLIC' });

      expect(response.status).toBe(400);
      expect(mockLobbyService.createLobby).not.toHaveBeenCalled();
    });

    test('Crea lobby con éxito y emite evento', async () => {
      mockLobbyService.createLobby.mockResolvedValue({ id: 5, name: 'Sala 5' });
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies')
        .set('Authorization', authHeader(1))
        .send({ name: 'Sala 5', privacy: 'PUBLIC', player1Id: 1 });

      expect(response.status).toBe(201);
      expect(mockIoEmit).toHaveBeenCalledWith('lobbyUpdated');
    });
  });

  describe('Unirse a Lobbys (POST /api/lobbies/:id/join)', () => {
    test('Falla si no se proporciona player2Id', async () => {
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies/1/join')
        .set('Authorization', authHeader(2))
        .send({}); // Body vacío

      expect(response.status).toBe(400);
    });

    test('Se une con éxito y emite evento', async () => {
      mockLobbyService.joinLobby.mockResolvedValue({ id: 1, player2Id: 2 });
      const app = buildApp();
      const response = await request(app)
        .post('/api/lobbies/1/join')
        .set('Authorization', authHeader(2))
        .send({ player2Id: 2 });

      expect(response.status).toBe(200);
      expect(mockIoEmit).toHaveBeenCalledWith('lobbyUpdated');
    });
  });
});
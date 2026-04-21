import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';

const mockUserService = {
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
  checkIfUserExists: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  updateUserById: jest.fn(),
  getUsersbyName: jest.fn(),
};

jest.unstable_mockModule('../src/services/UserService.js', () => ({
  userService: mockUserService,
}));

const { default: userRoutes } = await import('../src/routes/UserRoutes.js');

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', userRoutes);
  return app;
};

const authHeader = (userId = 1, name = 'Tester') => {
  const token = jwt.sign({ id: userId, name }, process.env.JWT_SECRET);
  return `Bearer ${token}`;
};

describe('User routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register devuelve 409 si el usuario ya existe', async () => {
    mockUserService.checkIfUserExists.mockResolvedValue(true);

    const app = buildApp();
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'john', email: 'john@test.com', password: 'secret' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'This user is already registered!' });
    expect(mockUserService.createUser).not.toHaveBeenCalled();
  });

  test('POST /api/auth/register devuelve 200 y token en registro correcto', async () => {
    const createdUser = {
      idUser: 10,
      name: 'john',
      email: 'john@test.com',
      password: 'hashed',
    };

    mockUserService.checkIfUserExists.mockResolvedValue(false);
    mockUserService.createUser.mockResolvedValue(createdUser);

    const app = buildApp();
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'john', email: 'john@test.com', password: 'secret' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Successful Registration!');
    expect(response.body.userId).toBe(10);
    expect(response.body.name).toBe('john');
    expect(response.body.email).toBe('john@test.com');
    expect(typeof response.body.authToken).toBe('string');
    expect(response.body.authToken.length).toBeGreaterThan(10);
  });

  test('POST /api/auth/login devuelve 401 con credenciales inválidas', async () => {
    mockUserService.getUserByEmail.mockResolvedValue(null);

    const app = buildApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@test.com', password: 'bad-pass' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'This email is not registered or the password is incorrect!',
    });
  });

  test('POST /api/auth/login devuelve 200 y token con credenciales válidas', async () => {
    mockUserService.getUserByEmail.mockResolvedValue({
      idUser: 10,
      name: 'john',
      email: 'john@test.com',
    });

    const app = buildApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@test.com', password: 'secret' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Successful login!');
    expect(response.body.userId).toBe(10);
    expect(response.body.name).toBe('john');
    expect(response.body.email).toBe('john@test.com');
    expect(typeof response.body.authToken).toBe('string');
    expect(response.body.authToken.length).toBeGreaterThan(10);
  });

  test('GET /api/auth/profile devuelve 401 sin token', async () => {
    const app = buildApp();
    const response = await request(app).get('/api/auth/profile');

    expect(response.status).toBe(401);
    expect(mockUserService.getUserById).not.toHaveBeenCalled();
  });

  test('GET /api/auth/profile devuelve 200 con token válido', async () => {
    mockUserService.getUserById.mockResolvedValue({
      idUser: 1,
      name: 'Tester',
      email: 'tester@test.com',
    });

    const app = buildApp();
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', authHeader(1, 'Tester'));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      idUser: 1,
      name: 'Tester',
      email: 'tester@test.com',
    });
  });

  test('PUT /api/auth/edit-profile devuelve 401 si usuario no existe', async () => {
    mockUserService.updateUserById.mockResolvedValue(null);

    const app = buildApp();
    const response = await request(app)
      .put('/api/auth/edit-profile')
      .set('Authorization', authHeader(123, 'Ghost'))
      .send({ name: 'Ghost', email: 'ghost@test.com' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'The User you are trying to Edit is not found',
    });
  });

  test('PUT /api/auth/edit-profile devuelve 200 cuando actualiza', async () => {
    mockUserService.updateUserById.mockResolvedValue({
      idUser: 1,
      name: 'Updated',
      email: 'updated@test.com',
    });

    const app = buildApp();
    const response = await request(app)
      .put('/api/auth/edit-profile')
      .set('Authorization', authHeader(1, 'Tester'))
      .send({ name: 'Updated', email: 'updated@test.com' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      idUser: 1,
      name: 'Updated',
      email: 'updated@test.com',
    });
  });

  test('GET /api/auth/search devuelve 404 cuando no hay usuarios', async () => {
    mockUserService.getUsersbyName.mockResolvedValue([]);

    const app = buildApp();
    const response = await request(app)
      .get('/api/auth/search?query=abc')
      .set('Authorization', authHeader(1, 'Tester'));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'No users found with that name!' });
  });

  test('GET /api/auth/search devuelve 200 con resultados', async () => {
    mockUserService.getUsersbyName.mockResolvedValue([
      { idUser: 2, name: 'Alice', email: 'alice@test.com' },
    ]);

    const app = buildApp();
    const response = await request(app)
      .get('/api/auth/search?query=ali')
      .set('Authorization', authHeader(1, 'Tester'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { idUser: 2, name: 'Alice', email: 'alice@test.com' },
    ]);
  });
});

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
      .send({ name: 'john', email: 'john@test.com', password: 'secret123' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: 'This user is already registered!' });
    expect(mockUserService.checkIfUserExists).toHaveBeenCalledWith('john', 'john@test.com');
    expect(mockUserService.createUser).not.toHaveBeenCalled();
  });

  test('POST /api/auth/register devuelve 400 con payload inválido', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'ab', email: 'bad-email', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toEqual(expect.arrayContaining([
      'Name must be at least 3 characters',
      'Email must be a valid email address',
      'Password must be at least 8 characters',
    ]));
    expect(mockUserService.checkIfUserExists).not.toHaveBeenCalled();
  });

  test('POST /api/auth/register normaliza name/email/password antes de usar service', async () => {
    const createdUser = {
      idUser: 10,
      name: 'John',
      email: 'john@test.com',
      password: 'hashed',
    };

    mockUserService.checkIfUserExists.mockResolvedValue(false);
    mockUserService.createUser.mockResolvedValue(createdUser);

    const app = buildApp();
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: '  John  ', email: '  JOHN@TEST.COM  ', password: '  secret123  ' });

    expect(response.status).toBe(200);
    expect(mockUserService.checkIfUserExists).toHaveBeenCalledWith('John', 'john@test.com');
    expect(mockUserService.createUser).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@test.com',
      password: 'secret123',
    });
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
      .send({ name: 'john', email: 'john@test.com', password: 'secret123' });

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
      .send({ email: 'john@test.com', password: 'bad-pass123' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: 'This email is not registered or the password is incorrect!',
    });
  });

  test('POST /api/auth/login devuelve 400 con payload inválido', async () => {
    const app = buildApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toEqual(expect.arrayContaining([
      'Email must be a valid email address',
      'Password is required',
    ]));
    expect(mockUserService.getUserByEmail).not.toHaveBeenCalled();
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
      .send({ email: 'john@test.com', password: 'secret123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Successful login!');
    expect(response.body.userId).toBe(10);
    expect(response.body.name).toBe('john');
    expect(response.body.email).toBe('john@test.com');
    expect(typeof response.body.authToken).toBe('string');
    expect(response.body.authToken.length).toBeGreaterThan(10);
  });

  test('POST /api/auth/login normaliza email y password antes de consultar service', async () => {
    mockUserService.getUserByEmail.mockResolvedValue({
      idUser: 10,
      name: 'john',
      email: 'john@test.com',
    });

    const app = buildApp();
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: '  JOHN@TEST.COM  ', password: '  secret123  ' });

    expect(response.status).toBe(200);
    expect(mockUserService.getUserByEmail).toHaveBeenCalledWith('john@test.com', 'secret123');
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

  test('PUT /api/auth/edit-profile devuelve 400 si no se envían campos', async () => {
    const app = buildApp();
    const response = await request(app)
      .put('/api/auth/edit-profile')
      .set('Authorization', authHeader(1, 'Tester'))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toContain('At least one field (name, email, password) must be provided');
    expect(mockUserService.updateUserById).not.toHaveBeenCalled();
  });

  test('PUT /api/auth/edit-profile devuelve 400 con email inválido', async () => {
    const app = buildApp();
    const response = await request(app)
      .put('/api/auth/edit-profile')
      .set('Authorization', authHeader(1, 'Tester'))
      .send({ email: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toContain('Email must be a valid email address');
    expect(mockUserService.updateUserById).not.toHaveBeenCalled();
  });

  test('PUT /api/auth/edit-profile devuelve 400 con name/password fuera de rango', async () => {
    const app = buildApp();
    const response = await request(app)
      .put('/api/auth/edit-profile')
      .set('Authorization', authHeader(1, 'Tester'))
      .send({ name: 'ab', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation error');
    expect(response.body.errors).toEqual(expect.arrayContaining([
      'Name must be at least 3 characters',
      'Password must be at least 8 characters',
    ]));
    expect(mockUserService.updateUserById).not.toHaveBeenCalled();
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
    expect(mockUserService.updateUserById).toHaveBeenCalledWith(1, 'Updated', 'updated@test.com', undefined);
  });

  test('PUT /api/auth/edit-profile normaliza campos antes de actualizar', async () => {
    mockUserService.updateUserById.mockResolvedValue({
      idUser: 1,
      name: 'Updated',
      email: 'updated@test.com',
    });

    const app = buildApp();
    const response = await request(app)
      .put('/api/auth/edit-profile')
      .set('Authorization', authHeader(1, 'Tester'))
      .send({ name: '  Updated  ', email: '  UPDATED@TEST.COM ', password: '  secret123  ' });

    expect(response.status).toBe(200);
    expect(mockUserService.updateUserById).toHaveBeenCalledWith(1, 'Updated', 'updated@test.com', 'secret123');
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

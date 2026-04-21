import { describe, test, expect, beforeEach, jest } from '@jest/globals';

const prismaMock = {
  user: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  friendship: {
    findMany: jest.fn(),
  },
};

const bcryptMock = {
  hash: jest.fn(),
  compare: jest.fn(),
};

jest.unstable_mockModule('../config/db.js', () => ({
  prisma: prismaMock,
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: bcryptMock,
}));

const { userService } = await import('../src/services/UserService.js');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getUserById devuelve null cuando el id es inválido', async () => {
    const result = await userService.getUserById('not-a-number');

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  test('getUserByEmail devuelve null cuando no existe usuario', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await userService.getUserByEmail('ghost@test.com', 'secret');

    expect(result).toBeNull();
    expect(bcryptMock.compare).not.toHaveBeenCalled();
  });

  test('getUserByEmail devuelve null cuando la password no coincide', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      idUser: 1,
      password: 'hashed',
    });
    bcryptMock.compare.mockResolvedValue(false);

    const result = await userService.getUserByEmail('john@test.com', 'wrong');

    expect(result).toBeNull();
    expect(bcryptMock.compare).toHaveBeenCalledWith('wrong', 'hashed');
  });

  test('updateUserById hashea password cuando viene informada', async () => {
    bcryptMock.hash.mockResolvedValue('new-hash');
    prismaMock.user.update.mockResolvedValue({ idUser: 1, name: 'John' });

    await userService.updateUserById('1', 'John', 'john@test.com', 'new-password');

    expect(bcryptMock.hash).toHaveBeenCalledWith('new-password', 10);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { idUser: 1 },
      data: {
        name: 'John',
        email: 'john@test.com',
        password: 'new-hash',
      },
    });
  });

  test('updateUserById no hashea cuando password llega vacía', async () => {
    prismaMock.user.update.mockResolvedValue({ idUser: 1, name: 'John' });

    await userService.updateUserById('1', 'John', 'john@test.com', '   ');

    expect(bcryptMock.hash).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { idUser: 1 },
      data: {
        name: 'John',
        email: 'john@test.com',
      },
    });
  });

  test('updateUserById devuelve null cuando Prisma lanza P2025', async () => {
    prismaMock.user.update.mockRejectedValue({ code: 'P2025' });

    const result = await userService.updateUserById('999', 'Ghost', 'ghost@test.com', 'x');

    expect(result).toBeNull();
  });
});

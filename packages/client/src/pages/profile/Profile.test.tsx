import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

const mockUseUser = vi.fn();

vi.mock('../../hooks/useUser', () => ({
  useUser: () => mockUseUser(),
}));

describe('Profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  test('carga y muestra datos del perfil cuando hay sesión', async () => {
    mockUseUser.mockReturnValue({
      isLogin: true,
      user: { id: '1', authToken: 'token-123' },
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        name: 'John',
        email: 'john@test.com',
        games: 7,
        wins: 5,
        losses: 2,
        createdAt: '2026-01-10T00:00:00.000Z',
      }),
    } as Response);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(await screen.findByText('Lord Profile John')).toBeInTheDocument();
    expect(screen.getByText(/john@test.com/i)).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('muestra error cuando falla la API', async () => {
    mockUseUser.mockReturnValue({
      isLogin: true,
      user: { id: '1', authToken: 'token-123' },
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Token inválido' }),
    } as Response);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(await screen.findByText('Token inválido')).toBeInTheDocument();
  });
});

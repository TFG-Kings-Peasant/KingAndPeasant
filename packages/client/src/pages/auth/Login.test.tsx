import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Login from './Login';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useUser', () => ({
  useUser: () => ({
    login: mockLogin,
  }),
}));

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  test('hace login y navega a home cuando la API responde OK', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        userId: 1,
        name: 'John',
        email: 'john@test.com',
        authToken: 'token-123',
      }),
    } as Response);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText('Email'), 'john@test.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith({
        id: 1,
        name: 'John',
        email: 'john@test.com',
        authToken: 'token-123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('muestra mensaje de error cuando el backend devuelve error', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Credenciales inválidas' }),
    } as Response);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText('Email'), 'john@test.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

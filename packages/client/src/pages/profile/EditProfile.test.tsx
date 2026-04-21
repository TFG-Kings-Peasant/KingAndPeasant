import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EditProfile from './EditProfile';

const mockNavigate = vi.fn();
const mockUseUser = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: { name: 'John', email: 'john@test.com' },
    }),
  };
});

vi.mock('../../hooks/useUser', () => ({
  useUser: () => mockUseUser(),
}));

describe('EditProfile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  test('redirige a /login si no hay sesión', async () => {
    mockUseUser.mockReturnValue({
      isLogin: false,
      user: null,
      login: vi.fn(),
    });

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('actualiza perfil, refresca contexto y navega a /profile', async () => {
    const loginMock = vi.fn();
    mockUseUser.mockReturnValue({
      isLogin: true,
      user: {
        id: '1',
        name: 'John',
        email: 'john@test.com',
        authToken: 'token-123',
      },
      login: loginMock,
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        name: 'John Updated',
        email: 'updated@test.com',
      }),
    } as Response);

    render(
      <MemoryRouter>
        <EditProfile />
      </MemoryRouter>
    );

    const nameInput = screen.getByDisplayValue('John');
    const emailInput = screen.getByDisplayValue('john@test.com');

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'John Updated');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'updated@test.com');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(loginMock).toHaveBeenCalledWith({
        id: '1',
        name: 'John Updated',
        email: 'updated@test.com',
        authToken: 'token-123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });
});

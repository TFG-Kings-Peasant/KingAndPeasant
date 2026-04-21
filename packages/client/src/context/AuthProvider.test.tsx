import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useContext } from 'react';
import { AuthProvider } from './AuthProvider';
import { AuthContext } from './AuthContext';

const {
  mockGetItem,
  mockSetItem,
  mockRemoveItem,
  socketMock,
  ioMock,
} = vi.hoisted(() => {
  const socket = {
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  };

  return {
    mockGetItem: vi.fn(),
    mockSetItem: vi.fn(),
    mockRemoveItem: vi.fn(),
    socketMock: socket,
    ioMock: vi.fn(() => socket),
  };
});

vi.mock('../hooks/useLocalStorage.ts', () => ({
  useLocalStorage: () => ({
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: mockRemoveItem,
  }),
}));

vi.mock('socket.io-client', () => ({
  io: ioMock,
}));

function Consumer() {
  const auth = useContext(AuthContext);

  if (!auth) return null;

  return (
    <>
      <div data-testid="is-login">{String(auth.isLogin)}</div>
      <div data-testid="user-name">{auth.user?.name ?? ''}</div>
      <button
        onClick={() =>
          auth.login({
            id: '1',
            name: 'John',
            email: 'john@test.com',
            authToken: 'token-123',
          })
        }
      >
        trigger-login
      </button>
      <button onClick={() => auth.logout()}>trigger-logout</button>
    </>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetItem.mockReturnValue(null);
  });

  test('login guarda usuario y cambia estado de sesión', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-login')).toHaveTextContent('false');

    await userEvent.click(screen.getByRole('button', { name: 'trigger-login' }));

    await waitFor(() => {
      expect(screen.getByTestId('is-login')).toHaveTextContent('true');
      expect(screen.getByTestId('user-name')).toHaveTextContent('John');
      expect(mockSetItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify({
          id: '1',
          name: 'John',
          email: 'john@test.com',
          authToken: 'token-123',
        })
      );
    });
  });

  test('con usuario en storage crea socket y emite register', async () => {
    mockGetItem.mockReturnValue(
      JSON.stringify({
        id: '1',
        name: 'John',
        email: 'john@test.com',
        authToken: 'token-123',
      })
    );

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(ioMock).toHaveBeenCalledTimes(1);
      expect(socketMock.emit).toHaveBeenCalledWith('register', '1');
    });
  });

  test('logout limpia storage y desconecta socket', async () => {
    mockGetItem.mockReturnValue(
      JSON.stringify({
        id: '1',
        name: 'John',
        email: 'john@test.com',
        authToken: 'token-123',
      })
    );

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(ioMock).toHaveBeenCalled();
    });

    await userEvent.click(screen.getByRole('button', { name: 'trigger-logout' }));

    await waitFor(() => {
      expect(mockRemoveItem).toHaveBeenCalledWith('user');
      expect(socketMock.disconnect).toHaveBeenCalled();
      expect(screen.getByTestId('is-login')).toHaveTextContent('false');
    });
  });
});

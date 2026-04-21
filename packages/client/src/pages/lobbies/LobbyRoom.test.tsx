import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LobbyRoom from './LobbyRoom';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../hooks/useAuth';

// Mock de APIs
import { getLobbyById, setPlayerReady } from './components/LobbyService';
import { startGame } from '../game/components/GameService';

// 1. Mocks de hooks
vi.mock('../../hooks/useUser', () => ({
  useUser: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// 2. Mock de React Router
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

// 3. Mock de llamadas al backend
vi.mock('./components/LobbyService', () => ({
  getLobbyById: vi.fn(),
  setPlayerReady: vi.fn(),
  leaveLobby: vi.fn(),
}));

vi.mock('../game/components/GameService', () => ({
  startGame: vi.fn(),
}));

// 4. Mock del Modal para interceptar fácilmente sus eventos (onClose, onConfirm)
vi.mock('../game/components/AnnouncementModal', () => ({
  AnnouncementModal: ({ isOpen, onClose, onConfirm, confirmText, title, message }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-announcement-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onClose}>CERRAR_MOCK</button>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    );
  }
}));

describe('LobbyRoom Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Usuario logueado por defecto
    (useUser as any).mockReturnValue({ 
        user: { id: 1, name: 'TestUser', authToken: 'fake-token' }, 
        isLogin: true 
    });
    
    // Socket conectado por defecto
    (useAuth as any).mockReturnValue({ 
      socket: { emit: vi.fn(), on: vi.fn(), off: vi.fn() } 
    });
  });

  test('Renderiza la información de la sala y los jugadores', async () => {
    (getLobbyById as any).mockResolvedValueOnce({
      id: 1, name: 'Sala Épica', player1Id: 1, player1Ready: false, player2Id: 2, player2Ready: true, status: 'WAITING'
    });

    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);
    expect(await screen.findByText(/SALA #1/i)).toBeInTheDocument();
  });

  // --- NUEVOS TESTS PARA CUBRIR TODAS LAS LÍNEAS FALTANTES ---

  test('Línea cubierta: onClick={() => navigate(`/game/${id}`)} - Reconectar partida', async () => {
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, name: 'Sala Épica', player1Id: 1, player2Id: 2, status: 'ONGOING'
    });

    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);
    
    const btnReconnect = await screen.findByRole('button', { name: /RECONECTAR A LA PARTIDA/i });
    fireEvent.click(btnReconnect);
    
    expect(mockNavigate).toHaveBeenCalledWith('/game/1');
  });

  test('Línea cubierta: if (!isLogin) return; en handleToggleReady', async () => {
    (useUser as any).mockReturnValue({ user: { id: 1 }, isLogin: false });
    
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, player1Id: 1, player1Ready: false, status: 'WAITING'
    });
    
    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);

    const btnReady = await screen.findByRole('button', { name: /NO LISTO/i });
    fireEvent.click(btnReady);

    expect(setPlayerReady).not.toHaveBeenCalled(); 
  });
  
  test('Línea cubierta: if (!socket) return; en handleToggleReady', async () => {
    (useAuth as any).mockReturnValue({ socket: null });
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, player1Id: 1, player1Ready: false, status: 'WAITING'
    });
    
    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);

    const btnReady = await screen.findByRole('button', { name: /NO LISTO/i });
    fireEvent.click(btnReady);

    expect(setPlayerReady).not.toHaveBeenCalled();
  });

  test('Línea cubierta: if (lobby.status === "ONGOING") return; en handleToggleReady', async () => {
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, player1Id: 1, player1Ready: false, status: 'ONGOING'
    });
    
    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);

    // Si status es ONGOING, el componente ignora el click de listarse
    const btnReady = await screen.findByRole('button', { name: /NO LISTO/i });
    fireEvent.click(btnReady);

    expect(setPlayerReady).not.toHaveBeenCalled();
  });

  test('Línea cubierta: catch de handleToggleReady (Error al cambiar estado)', async () => {
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, player1Id: 1, player1Ready: false, status: 'WAITING'
    });
    
    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);

    const btnReady = await screen.findByRole('button', { name: /NO LISTO/i });
    
    // Simulamos fallo en la petición
    (setPlayerReady as any).mockRejectedValueOnce(new Error('API Error'));
    fireEvent.click(btnReady);

    await waitFor(() => {
        expect(screen.getByText(/Error al cambiar estado/i)).toBeInTheDocument();
    });
  });

  test('Línea cubierta: catch de executeLeave (No se pudo salir del lobby)', async () => {
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, player1Id: 1, status: 'WAITING'
    });
    
    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);

    // Click en salir abre el modal
    const btnLeave = await screen.findByRole('button', { name: /SALIR DEL LOBBY/i });
    fireEvent.click(btnLeave);

    // Simulamos que el hook navigate falle para forzar el bloque catch de executeLeave
    mockNavigate.mockImplementationOnce(() => { throw new Error('Simulated Navigation Error'); });
    
    // Confirmar en el modal
    const btnConfirmLeave = await screen.findByRole('button', { name: /ABANDONAR/i });
    fireEvent.click(btnConfirmLeave);

    await waitFor(() => {
        expect(screen.getByText(/No se pudo salir del lobby/i)).toBeInTheDocument();
    });
  });

  test('Línea cubierta: if (!lobby || !user || !user.authToken) return; en executeStartGame', async () => {
    // Simulamos un usuario logueado PERO sin authToken
    (useUser as any).mockReturnValue({ user: { id: 1, authToken: null }, isLogin: true });
    
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, player1Id: 1, player2Id: 2, player1Ready: true, player2Ready: true, status: 'WAITING'
    });
    
    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);

    const btnStart = await screen.findByRole('button', { name: /COMENZAR PARTIDA/i });
    fireEvent.click(btnStart);

    const btnConfirm = await screen.findByRole('button', { name: /¡A LA BATALLA!/i });
    fireEvent.click(btnConfirm);

    expect(startGame).not.toHaveBeenCalled(); // Corta por no tener token
  });

  test('Línea cubierta: catch de executeStartGame (No se pudo comenzar la partida)', async () => {
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, player1Id: 1, player2Id: 2, player1Ready: true, player2Ready: true, status: 'WAITING'
    });
    
    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);

    const btnStart = await screen.findByRole('button', { name: /COMENZAR PARTIDA/i });
    fireEvent.click(btnStart);

    // Simulamos que startGame lanza un error
    (startGame as any).mockRejectedValueOnce(new Error('Game start error'));
    
    const btnConfirm = await screen.findByRole('button', { name: /¡A LA BATALLA!/i });
    fireEvent.click(btnConfirm);

    await waitFor(() => {
        expect(screen.getByText(/No se pudo comenzar la partida/i)).toBeInTheDocument();
    });
  });

  test('Línea cubierta: () => setAnnouncement(null) al cerrar el Modal', async () => {
    (getLobbyById as any).mockResolvedValueOnce({
        id: 1, player1Id: 1, status: 'WAITING'
    });
    
    render(<BrowserRouter><LobbyRoom /></BrowserRouter>);

    const btnLeave = await screen.findByRole('button', { name: /SALIR DEL LOBBY/i });
    fireEvent.click(btnLeave);

    // Comprobamos que se abre
    expect(screen.getByTestId('mock-announcement-modal')).toBeInTheDocument();

    // Pulsamos el botón onClose de nuestro Mock (que invoca la función setAnnouncement(null) del padre)
    const closeBtn = screen.getByRole('button', { name: /CERRAR_MOCK/i });
    fireEvent.click(closeBtn);

    // Verificamos que desaparece el modal (porque su estado ahora es null)
    await waitFor(() => {
        expect(screen.queryByTestId('mock-announcement-modal')).not.toBeInTheDocument();
    });
  });
});
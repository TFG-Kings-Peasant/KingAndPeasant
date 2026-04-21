import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import LobbyList from './LobbyList';
import { useAuth } from '../../hooks/useAuth';
import { getAllLobbies, getMyLobby, createLobby, joinLobby } from './components/LobbyService';

// 1. Mocks
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('./components/LobbyService', () => ({
  getAllLobbies: vi.fn(),
  getMyLobby: vi.fn(),
  createLobby: vi.fn(),
  joinLobby: vi.fn(),
}));

describe('LobbyList Component - Flujos Principales y Errores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (useAuth as any).mockReturnValue({ 
        user: { id: 1, name: 'TestUser', authToken: 'fake-token' } 
    });
    
    (getAllLobbies as any).mockResolvedValue([]);
    (getMyLobby as any).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // TESTS EXISTENTES (Flujos felices)
  // ==========================================
  test('Renderiza la lista de lobbys correctamente', async () => {
    (getAllLobbies as any).mockResolvedValue([{ 
        id: 1, name: 'Sala de Test', player1Id: 2, player2Id: null, privacy: 'PUBLIC', status: 'WAITING' 
    }]);

    render(<BrowserRouter><LobbyList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText('Sala de Test')).toBeInTheDocument();
    });
  });

  test('Redirige a la sala tras unirse a un lobby con éxito', async () => {
    (getAllLobbies as any).mockResolvedValue([{ 
        id: 5, name: 'Sala Disponible', player1Id: 2, player2Id: null, privacy: 'PUBLIC', status: 'WAITING' 
    }]);

    render(<BrowserRouter><LobbyList /></BrowserRouter>);
    const joinBtn = await screen.findByRole('button', { name: /unirse/i });
    
    (joinLobby as any).mockResolvedValue({ id: 5 });
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/lobby/5');
    });
  });

  // ==========================================
  // NUEVOS TESTS (Coverage 100%)
  // ==========================================

  test('Línea: catch de fetchLobbies (Error cargando salas)', async () => {
    (getAllLobbies as any).mockRejectedValueOnce(new Error('Fallo de Red'));

    render(<BrowserRouter><LobbyList /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Error cargando salas/i)).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('Línea: openCreateModal -> Ya estás en una sala', async () => {
    // Simulamos que el usuario ya está en su propia sala
    (getMyLobby as any).mockResolvedValueOnce({ id: 99, name: 'Mi Propia Sala', status: 'WAITING' });

    render(<BrowserRouter><LobbyList /></BrowserRouter>);
    
    // Esperamos a que cargue la interfaz y aparezca el banner de mi sala
    await screen.findByText(/Estás actualmente en esta sala/i);

    const openModalBtn = screen.getByRole('button', { name: /crear sala/i });
    fireEvent.click(openModalBtn);

    // Debe mostrar el error en vez de abrir el modal
    await waitFor(() => {
      expect(screen.getByText(/Ya estás en una sala\. Sal de ella para poder crear una nueva\./i)).toBeInTheDocument();
    });
  });

  test('Línea: onClick -> navigate a myLobby (Botón VOLVER A MI SALA)', async () => {
    (getMyLobby as any).mockResolvedValueOnce({ id: 99, name: 'Mi Propia Sala', status: 'ONGOING' });

    render(<BrowserRouter><LobbyList /></BrowserRouter>);
    
    const volverBannerBtn = await screen.findByRole('button', { name: /VOLVER A MI SALA/i });
    fireEvent.click(volverBannerBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/lobby/99');
  });

  test('Línea: handleConfirmCreate -> El nombre es obligatorio', async () => {
    render(<BrowserRouter><LobbyList /></BrowserRouter>);
    
    const openModalBtn = await screen.findByRole('button', { name: /crear sala/i });
    fireEvent.click(openModalBtn);

    // NO rellenamos el input, enviamos directo
    const submitBtns = screen.getAllByRole('button', { name: /crear sala/i });
    fireEvent.click(submitBtns[1]);

    await waitFor(() => {
      expect(screen.getByText(/El nombre de la sala es obligatorio/i)).toBeInTheDocument();
    });
  });

  test('Líneas: Validaciones de unirse (SALA LLENA, EN JUEGO, PRIVADA)', async () => {
    (getAllLobbies as any).mockResolvedValue([
      { id: 1, name: 'Sala Llena', player2Id: 2, privacy: 'PUBLIC', status: 'WAITING' },
      { id: 2, name: 'Sala En Juego', player2Id: null, privacy: 'PUBLIC', status: 'ONGOING' },
      { id: 3, name: 'Sala Privada', player2Id: null, privacy: 'PRIVATE', status: 'WAITING' }
    ]);

    render(<BrowserRouter><LobbyList /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /SALA LLENA/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /EN JUEGO/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /SALA PRIVADA/i })).toBeDisabled();
    });
  });

  test('Líneas: Validaciones de unirse estando en OTRA sala (YA ESTÁS EN OTRA SALA) y en la MISMA (VOLVER)', async () => {
    (getMyLobby as any).mockResolvedValue({ id: 10, name: 'Mi Sala', status: 'WAITING' });
    (getAllLobbies as any).mockResolvedValue([
      { id: 10, name: 'Mi Sala', player2Id: null, privacy: 'PUBLIC', status: 'WAITING' }, 
      { id: 20, name: 'Otra Sala', player2Id: null, privacy: 'PUBLIC', status: 'WAITING' } 
    ]);

    render(<BrowserRouter><LobbyList /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^VOLVER$/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /YA ESTÁS EN OTRA SALA/i })).toBeDisabled();
    });

    const btnVolverTabla = screen.getByRole('button', { name: /^VOLVER$/i });
    fireEvent.click(btnVolverTabla);

    expect(mockNavigate).toHaveBeenCalledWith('/lobby/10');
  });

  test('Líneas: Errores desconocidos (no Error instances) al crear y unirse', async () => {
    render(<BrowserRouter><LobbyList /></BrowserRouter>);

    // ----- Probamos Error Desconocido al CREAR -----
    const openModalBtn = await screen.findByRole('button', { name: /crear sala/i });
    fireEvent.click(openModalBtn);

    const inputName = await screen.findByPlaceholderText(/Ej: Batalla Épica/i);
    fireEvent.change(inputName, { target: { value: 'Nueva Sala' } });

    (createLobby as any).mockRejectedValueOnce("Un error en formato string");

    const submitBtns = screen.getAllByRole('button', { name: /crear sala/i });
    fireEvent.click(submitBtns[1]);

    await waitFor(() => {
      expect(screen.getByText(/Ocurrió un error desconocido/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('✕'));

    // ----- Probamos Error Desconocido al UNIRSE -----
    (getAllLobbies as any).mockResolvedValueOnce([{ id: 1, name: 'S', player2Id: null, privacy: 'PUBLIC', status: 'WAITING' }]);
    
    const refreshBtn = screen.getByRole('button', { name: /Refrescar/i });
    fireEvent.click(refreshBtn);

    const joinBtn = await screen.findByRole('button', { name: /UNIRSE/i });
    
    (joinLobby as any).mockRejectedValueOnce("Error string join");
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ocurrió un error desconocido al intentar unirse a la sala/i)).toBeInTheDocument();
    });
  });

  test('Líneas: Interacciones UI del modal (Overlay click y Select onChange)', async () => {
    render(<BrowserRouter><LobbyList /></BrowserRouter>);

    const openModalBtn = await screen.findByRole('button', { name: /crear sala/i });
    fireEvent.click(openModalBtn);

    const selectPrivacy = screen.getByRole('combobox');
    fireEvent.change(selectPrivacy, { target: { value: 'PRIVATE' } });
    expect(selectPrivacy).toHaveValue('PRIVATE');

    const overlay = document.querySelector('.parchment-modal-overlay');
    expect(overlay).toBeInTheDocument();
    
    fireEvent.click(overlay!);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Ej: Batalla Épica/i)).not.toBeInTheDocument();
    });
  });

  test('Líneas: if(!user) de creación y unión', async () => {
    (useAuth as any).mockReturnValue({ user: null });
    (getAllLobbies as any).mockResolvedValue([{ id: 1, name: 'S', player2Id: null, privacy: 'PUBLIC', status: 'WAITING' }]);

    render(<BrowserRouter><LobbyList /></BrowserRouter>);

    const openModalBtn = await screen.findByRole('button', { name: /crear sala/i });
    fireEvent.click(openModalBtn);
    
    const inputName = await screen.findByPlaceholderText(/Ej: Batalla Épica/i);
    fireEvent.change(inputName, { target: { value: 'Nueva Sala' } });
    
    const submitBtns = screen.getAllByRole('button', { name: /crear sala/i });
    fireEvent.click(submitBtns[1]);

    await waitFor(() => {
      expect(screen.getByText(/Debes iniciar sesión para crear una sala/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('✕'));

    const joinBtn = await screen.findByRole('button', { name: /UNIRSE/i });
    fireEvent.click(joinBtn);

    await waitFor(() => {
      expect(screen.getByText(/Debes iniciar sesión para unirte a una sala/i)).toBeInTheDocument();
    });
  });
});
import { useEffect, useState } from "react";
import './LobbyList.css'
import { createLobby, getAllLobbies, joinLobby, getMyLobby, type LobbyBackend } from "./components/LobbyService";
import { useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth"; // <-- Importamos useAuth para los sockets

import { ErrorToast } from "../game/components/ErrorToast";
import { FormInput } from "../../components/FormInput";
import { MenuButton } from "../../components/MenuButton";

function LobbyList() {
    const [lobbies, setLobbies] = useState<LobbyBackend[]>([]);
    const [myLobby, setMyLobby] = useState<LobbyBackend | null>(null); // <-- Estado para Mi Lobby
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const { socket, user } = useAuth(); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLobbyName, setNewLobbyName] = useState("");
    const [newLobbyPrivacy, setNewLobbyPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

    const navigate = useNavigate();

    useEffect(() => {
        fetchLobbies();

        if (socket) {
            socket.on('lobbyUpdated', fetchLobbies);
            return () => {
                socket.off('lobbyUpdated', fetchLobbies);
            };
        }
    }, [socket, user]);

    const fetchLobbies = async () => {
        setLoading(true);
        try {
            // Cargamos todos los lobbies y "Mi Lobby" en paralelo si estamos logueados
            const allData = await getAllLobbies();
            const myData = (user && user.authToken) ? await getMyLobby(user.authToken) : null;
            
            setLobbies(allData);
            setMyLobby(myData);
            setError("");
        } catch (err) {
            setError("Error cargando salas");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        if (myLobby) {
            setError("Ya estás en una sala. Sal de ella para poder crear una nueva.");
            return;
        }
        setNewLobbyName(""); 
        setNewLobbyPrivacy('PUBLIC'); 
        setIsModalOpen(true);
    };

    const handleConfirmCreate = async (e: React.FormEvent) => {
        e.preventDefault(); 
        
        if (!newLobbyName.trim()) {
            setError("El nombre de la sala es obligatorio");
            return;
        }

        if(!user || !user.authToken) {
            setError("Debes iniciar sesión para crear una sala");
            return;
        }

        try {
            const newLobby = await createLobby(newLobbyName, newLobbyPrivacy, user?.id || null, user.authToken); 
            setIsModalOpen(false); 
            fetchLobbies(); 
            navigate(`/lobby/${newLobby.id}`);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Ocurrió un error desconocido");
            }
        }
    };

    const handleJoinLobby = async (lobbyId: number) => {
        if(!user || !user.authToken) {
            setError("Debes iniciar sesión para unirte a una sala");
            return;
        }

        // Si ya es mi sala, simplemente redirigimos (no llamamos al backend para unirnos de nuevo)
        if (myLobby && myLobby.id === lobbyId) {
            navigate(`/lobby/${lobbyId}`);
            return;
        }

        try {
            await joinLobby(lobbyId, user?.id || null, user.authToken); 
            navigate(`/lobby/${lobbyId}`); 
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Ocurrió un error desconocido al intentar unirse a la sala");
            }
        }
    }

    const joinLobbyCheck = (lobbyId: number, player2Id: number | null, privacy: string, status: string) => {
        // Validación 1: Si es tu propia sala, puedes volver
        if (myLobby && myLobby.id === lobbyId) {
            return {allowed: "allowed", reason: "VOLVER"};
        }
        // Validación 2: Si estás en OTRA sala, no puedes unirte a esta
        if (myLobby && myLobby.id !== lobbyId) {
            return {allowed: "not-allowed", reason: "YA ESTÁS EN OTRA SALA"};
        }
        // Validaciones normales
        if (status === 'ONGOING') {
            return {allowed: "not-allowed", reason: "EN JUEGO"};
        }
        if (privacy === 'PRIVATE') {
            return {allowed: "not-allowed", reason: "SALA PRIVADA"};
        }
        if (player2Id !== null) {
            return {allowed: "not-allowed", reason: "SALA LLENA"};
        }
        return {allowed: "allowed", reason: "UNIRSE"};
    };

    return <div>
        <div className="body-container">

            {/* --- NUEVO: BANNER DE MI LOBBY --- */}
            {myLobby && (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid #ceb379',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#f1c40f', textShadow: '1px 1px 2px black' }}>
                            Estás actualmente en esta sala
                            Si la partida no ha comenzado, se te sacará de ella en 5 segundos.
                        </h3>

                        <p style={{ margin: '5px 0 0 0', color: 'white' }}>
                            {myLobby.name} - {myLobby.status === 'ONGOING' ? 'Partida en curso' : 'Esperando jugadores'}
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate(`/lobby/${myLobby.id}`)}
                        style={{
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            padding: '10px 20px',
                            border: '1px solid #27ae60',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        VOLVER A MI SALA
                    </button>
                </div>
            )}
            {/* ------------------------------- */}

            <div className="button-container">
                {/* Deshabilitamos crear sala si ya estás en una */}
                <button 
                    onClick={openCreateModal} 
                    style={{ opacity: myLobby ? 0.5 : 1, cursor: myLobby ? 'not-allowed' : 'pointer' }}
                >
                    Crear Sala
                </button>
                <button onClick={fetchLobbies} disabled={loading}>
                        {loading ? "Cargando..." : "Refrescar"}
                </button>
            </div>

            <div className="lobby-table">
                <div className="table-header">
                    <span>NOMBRE DE LA SALA</span>
                    <span>JUGADORES</span>
                    <span>PRIVACIDAD</span>
                    <span>ESTADO</span>
                    <span>UNIRSE</span>
                </div>
                <div className="table-body">
                    {lobbies.map((lobby) => {
                        // Pasamos el ID del lobby también a la comprobación
                        const joinStatus = joinLobbyCheck(lobby.id, lobby.player2Id, lobby.privacy, lobby.status);
                        return(
                            <div key={lobby.id} className="table-row">
                            <span className="col-name">{lobby.name}</span>
                            <span className="col-players">{lobby.player2Id ? "2/2" : "1/2"}</span>
                            <span className="col-privacy">{lobby.privacy}</span>
                            <span className="col-status">{lobby.status}</span>
                            <span className="col-join">
                                <button className={`join-btn ${joinStatus.allowed}`} onClick={() => handleJoinLobby(lobby.id)} disabled={joinStatus.allowed === "not-allowed"}>
                                    {joinStatus.reason}
                                </button>
                            </span>
                        </div>
                        )
                    })}     
                </div>
            </div>
        </div>

        {isModalOpen && (
            <div 
                className="parchment-modal-overlay" 
                onClick={() => setIsModalOpen(false)}
            >
                <div onClick={(e) => e.stopPropagation()}>
                    <div className="menu-card">
                        <h2 className="menu-title">Crear Nueva Sala</h2>
                        
                        <form className="menu-form" onSubmit={handleConfirmCreate}>
                            <div className="parchment-form-group">
                                <label>Nombre de la sala:</label>
                                <FormInput 
                                    type="text" 
                                    value={newLobbyName}
                                    onChange={(e) => setNewLobbyName(e.target.value)}
                                    placeholder="Ej: Batalla Épica"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="parchment-form-group">
                                <label>Privacidad:</label>
                                <select 
                                    className="menu-input"
                                    value={newLobbyPrivacy} 
                                    onChange={(e) => setNewLobbyPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE')}
                                >
                                    <option value="PUBLIC">Pública</option>
                                    <option value="PRIVATE">Privada</option>
                                </select>
                            </div>

                            <div className="parchment-form-actions">
                                <MenuButton 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="cancel-menu-btn"
                                >
                                    Cancelar
                                </MenuButton>
                                <MenuButton 
                                    type="submit"
                                >
                                    Crear Sala
                                </MenuButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )}
        <ErrorToast 
            error={error} 
            onClose={() => setError("")} 
        />
    </div>;
}

export default LobbyList;
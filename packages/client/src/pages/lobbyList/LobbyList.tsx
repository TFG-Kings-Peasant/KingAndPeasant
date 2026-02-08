import { useEffect, useState } from "react";
import Header from "../home/components/Header";
import './LobbyList.css'
import { createLobby, getAllLobbies, joinLobby, type LobbyBackend } from "./components/LobbyFetch";
import { useNavigate } from "react-router";
import { useUser } from "../../hooks/useUser";


function LobbyList() {
    const [lobbies, setLobbies] = useState<LobbyBackend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const { user, isLogin} = useUser();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLobbyName, setNewLobbyName] = useState("");
    const [newLobbyPrivacy, setNewLobbyPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

    const navigate = useNavigate();

    useEffect(() => {
        fetchLobbies();
    }, []);

    const fetchLobbies = async () => {
        setLoading(true);
        try {
            const data = await getAllLobbies();
            setLobbies(data);
            setError("");
        } catch (err) {
            setError("Error cargando salas");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setNewLobbyName(""); // Limpiar nombre anterior
        setNewLobbyPrivacy('PUBLIC'); // Resetear privacidad
        setIsModalOpen(true);
    };

    // 2. Función que llama al backend cuando das a "Confirmar" en el modal
    const handleConfirmCreate = async (e: React.FormEvent) => {
        e.preventDefault(); // Evita que se recargue la página
        
        if (!newLobbyName.trim()) {
            alert("El nombre de la sala es obligatorio");
            return;
        }

        if(!isLogin) {
            alert("Debes iniciar sesión para crear una sala");
            return;
        }

        try {
            // Llamamos a tu servicio pasando AMBOS datos
            const newLobby = await createLobby(newLobbyName, newLobbyPrivacy, user?.id || null); // Pasamos el ID del usuario actual
            setIsModalOpen(false); // Cerrar modal
            fetchLobbies(); // Recargar lista
            navigate(`/lobby/${newLobby.id}`);
        } catch (err) {
            if (err instanceof Error) {
                alert(err.message);
            } else {
                alert("Ocurrió un error desconocido");
            }
        }
    };;

    const handleJoinLobby = async (lobbyId: number) => {
        if(!isLogin) {
            alert("Debes iniciar sesión para unirte a una sala");
            return;
        }else{
            try {
                await joinLobby(lobbyId, user?.id || null); // Pasamos el ID del usuario actual
                navigate(`/lobby/${lobbyId}`); // Redirige a la página de la sala
            } catch (err) {
                if (err instanceof Error) {
                    alert(err.message);
                } else {
                    alert("Ocurrió un error desconocido al intentar unirse a la sala");
                }
            }
        }

    }

    const joinLobbyCheck = (player2Id: number | null, privacy: string, status: string) => {
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
      <Header username = {user == null?"" : user.name}/>
        <div className="body-container">
            <div className="button-container">
                <button onClick={openCreateModal}>Crear Sala</button>
                <button onClick={fetchLobbies} disabled={loading}>
                        {loading ? "Cargando..." : "Refrescar"}
                </button>
            </div>

            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

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
                        const joinStatus = joinLobbyCheck(lobby.player2Id, lobby.privacy, lobby.status);
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Crear Nueva Sala</h3>
                        <form onSubmit={handleConfirmCreate}>
                            <div className="form-group">
                                <label>Nombre de la sala:</label>
                                <input 
                                    type="text" 
                                    value={newLobbyName}
                                    onChange={(e) => setNewLobbyName(e.target.value)}
                                    placeholder="Ej: Batalla Épica"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Privacidad:</label>
                                <select 
                                    value={newLobbyPrivacy} 
                                    onChange={(e) => setNewLobbyPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE')}
                                >
                                    <option value="PUBLIC">🌐 Pública</option>
                                    <option value="PRIVATE">🔒 Privada</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">
                                    Cancelar
                                </button>
                                <button type="submit" className="confirm-btn">
                                    Crear Sala
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
    </div>;
}

export default LobbyList
import { useEffect, useState } from "react";
import PlayerCard from "./components/PlayerCard";
import "./Lobby.css";
import { getLobbyById, leaveLobby, setPlayerReady, type LobbyBackend } from "../components/LobbyFetch";
import { useNavigate, useParams } from "react-router";

// --- TEMPORAL: CAMBIAR ESTO CUANDO TENGAS LOGIN ---
const CURRENT_USER_ID = 1; 
// --------------------------------------------------

function Lobby() {
  const { id } = useParams();
  const [lobby, setLobby] = useState<LobbyBackend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
      fetchLobby();
  }, [id]);

  const fetchLobby = async () => {
      setLoading(true);
      try {
          const data = await getLobbyById(Number(id));   
          setLobby(data);
      } catch (err) {
          setError("Error al cargar el lobby");
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleToggleReady = async () => {
      if (!lobby) return;
      try {
          await setPlayerReady(lobby.id, !lobby.player1Ready); // Cambiamos el estado del jugador actual
          fetchLobby(); // Refrescamos manual para ver el cambio al instante
      } catch (err) {
          setError("Error al cambiar estado");
          console.error(err);
      }
  };

// Manejar salir
  const handleLeave = async () => {
    if (!lobby) return;
    if (window.confirm("¿Seguro que quieres salir?")) {
        try {
            await leaveLobby(lobby.id);
            navigate("/"); // Volver al inicio
        } catch (err) {
            setError("No se pudo salir del lobby");
            console.error(err);
        }
    }
  };

  if (loading || !lobby) return <div>Cargando...</div>;

  return (
    <div className="lobby-page">
      <h1>SALA #{lobby.id}</h1>
      <div className="lobby-body">
        <PlayerCard playerId={lobby.player1Id} 
            isReady={lobby.player1Ready}
            isCurrentUser={lobby.player1Id === CURRENT_USER_ID} // ¿Soy yo?
            onToggleReady={handleToggleReady}/>

        <h1 className="vs-divider">VS</h1>
        
        {lobby.player2Id ? (
            <PlayerCard 
                playerId={lobby.player2Id} 
                isReady={lobby.player2Ready}
                isCurrentUser={lobby.player2Id === CURRENT_USER_ID} // ¿Soy yo?
                onToggleReady={handleToggleReady}
            />
        ) : (
            <div className="waiting-card">Esperando rival...</div>
        )}
      </div>
      <footer className="lobby-footer">
        <div className="footer-info">
          <span>Estado: </span>
          <span className="status-text">
            {lobby.player1Ready && lobby.player2Ready ? "INICIANDO..." : "Esperando jugadores..."}
            </span>
        </div>
                  
          <button className="exit-btn" onClick={handleLeave}>
                SALIR DEL LOBBY
          </button>
      </footer>
    </div>
  );
}

export default Lobby;
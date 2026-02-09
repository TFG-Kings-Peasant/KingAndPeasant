import { useEffect, useState } from "react";
import PlayerCard from "./components/PlayerCard";
import "./Lobby.css";
import { getLobbyById, leaveLobby, setPlayerReady, type LobbyBackend } from "../components/LobbyFetch";
import { useNavigate, useParams } from "react-router";
import { useUser } from "../../../hooks/useUser";

function Lobby() {
  const { id } = useParams();
  const [lobby, setLobby] = useState<LobbyBackend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, isLogin} = useUser();

  const navigate = useNavigate();

  useEffect(() => {
      // 1. Carga inicial inmediata (con pantalla de carga)
      fetchLobby(true);

      // 2. Configurar el intervalo (Polling) cada 2 segundos
      // Esto pedirá los datos al servidor constantemente
      const intervalId = setInterval(() => {
          fetchLobby(false); // false = carga silenciosa (sin spinner)
      }, 2000);

      // 3. Limpieza: Si te vas de la página, dejamos de pedir datos
      return () => clearInterval(intervalId);
  }, [id, user]); // Refresca también si cambia el usuario (por ejemplo, al hacer login)

  const fetchLobby = async (showLoading = false) => {
    if (showLoading) setLoading(true);
      
    try {
        const data = await getLobbyById(Number(id));   
        setLobby(data);
          
        if (!data) {
            setError("La sala ya no existe");
        }
    } catch (err) {
        console.error(err);
        if (showLoading) setError("Error al cargar el lobby");
    } finally {
        if (showLoading) setLoading(false);
    }
  };

  const handleToggleReady = async () => {
      if (!lobby) return;
      if (!isLogin) return;
      try {
        const isPlayer1 = lobby.player1Id === Number(user?.id);
        const currentReadyStatus = isPlayer1 ? lobby.player1Ready : lobby.player2Ready;
          await setPlayerReady(lobby.id, user?.id || null,!currentReadyStatus); // Cambiamos el estado del jugador actual
          fetchLobby(); // Refrescamos manual para ver el cambio al instante
      } catch (err) {
          setError("Error al cambiar estado");
          console.error(err);
      }
  };


  const handleLeave = async () => {
    if (!lobby) return;
    if (window.confirm("¿Seguro que quieres salir?")) {
        try {
            await leaveLobby(lobby.id, user?.id || ""); // Pasamos el ID del usuario actual
            navigate("/lobbyList"); // Volver al inicio
        } catch (err) {
            setError("No se pudo salir del lobby");
            console.error(err);
        }
    }
  };

    const handleStartGame = async () => {
    if (!lobby) return;
    if (window.confirm("¿Seguro que quieres comenzar la partida?")) {
        try {
            await leaveLobby(lobby.id, user?.id || ""); // Pasamos el ID del usuario actual
            navigate("/game"); // Ir a la pantalla de juego
        } catch (err) {
            setError("No se pudo comenzar la partida");
            console.error(err);
        }
    }
  };

  if (loading || !lobby) return <div>Cargando...</div>;
  if (error) return <div className="error-msg">{error}</div>;

  return (
    <div className="lobby-page">
      <h1>SALA #{lobby.id}</h1>
      <div className="lobby-body">
        <PlayerCard playerId={lobby.player1Id} 
            isReady={lobby.player1Ready}
            isCurrentUser={lobby.player1Id === Number(user?.id)} // ¿Soy yo?
            onToggleReady={handleToggleReady}/>

        <h1 className="vs-divider">VS</h1>
        
        {lobby.player2Id ? (
            <PlayerCard 
                playerId={lobby.player2Id} 
                isReady={lobby.player2Ready}
                isCurrentUser={lobby.player2Id === Number(user?.id)} // ¿Soy yo?
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
        
        {lobby.player1Ready && lobby.player2Ready && lobby.player1Id === Number(user?.id) ? (
            <button className="start-btn" onClick={handleStartGame}>
                COMENZAR PARTIDA
            </button>
        )
        : (<div></div>)}


        <button className="exit-btn" onClick={handleLeave}>
            SALIR DEL LOBBY
        </button>
      </footer>
    </div>
  );
}

export default Lobby;
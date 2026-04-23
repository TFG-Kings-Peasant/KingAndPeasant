// packages/client/src/pages/lobbies/LobbyRoom.tsx
import { useEffect, useState } from "react";
import PlayerCard from "./components/PlayerCard";
import "./LobbyRoom.css";
import { getLobbyById, leaveLobby, setPlayerReady, type LobbyBackend } from "./components/LobbyService";
import { startGame } from "../game/components/GameService";
import { useNavigate, useParams } from "react-router";
import { useUser } from "../../hooks/useUser";
import { useAuth } from "../../hooks/useAuth";
import { AnnouncementModal } from "../game/components/AnnouncementModal";

function LobbyRoom() {
  const { id } = useParams();
  const [lobby, setLobby] = useState<LobbyBackend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState<{ 
    title: string;
    message: string;
    confirmAction?: "START" | "LEAVE";
    } | null>(null);
  const { user, isLogin} = useUser();
  const { socket } = useAuth();
  const navigate = useNavigate();

    useEffect(() => {
        fetchLobby(true);
    }, [id, user]);

    useEffect(() => {
        if (!socket || !id || !user) return;

        socket.emit('joinLobby', `lobby${id}`, user.id);

        socket.on('lobbyUpdated', () => fetchLobby(false));
        socket.on('gameStarted', () => {navigate(`/game/${id}`)});

        const handleUnload = () => socket.emit('leaveLobby', user.id, id);
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            socket.emit('leaveLobby', user.id, id);
            socket.off('lobbyUpdated');
            socket.off('gameStarted');
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [socket, id, user?.id]);

  const fetchLobby = async (showLoading = false) => {
    if(!user) return;
    if (!user.authToken) return;
    if (showLoading) setLoading(true);
      
    try {
        const data = await getLobbyById(Number(id), user.authToken);   
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
    if (!socket) return;
    if(!user) return;
    if (!user.authToken) return;
    
    if (lobby.status === 'ONGOING') return;

    try {
        const isPlayer1 = lobby.player1Id === Number(user?.id);
        const currentReadyStatus = isPlayer1 ? lobby.player1Ready : lobby.player2Ready;
        await setPlayerReady(lobby.id, user?.id || null,!currentReadyStatus, user.authToken);
        fetchLobby();
    } catch (err) {
        setError("Error al cambiar estado");
        console.error(err);
    }
  };

  const handleLeaveClick = () => {
    setAnnouncement({
        title: "🏃‍♂️ ABANDONAR SALA",
        message: "¿Estás seguro de que quieres huir de la batalla y salir de la sala?",
        confirmAction: "LEAVE" 
    });
  };

  const executeLeave = async () => {
    setAnnouncement(null);
    if(!lobby || !user) return;
    
    try {
        if (socket) {
            socket.emit('leaveLobby', user.id, id, true);
        }
        navigate("/lobbyList");
    } catch (err) {
        setError("No se pudo salir del lobby");
        console.error(err);
    }
  }

  const handleStartGameClick = () => {
    setAnnouncement({
      title: "⚔️ ¿TODO LISTO?",
      message: "Vas a dar comienzo al duelo. ¿Estás seguro de que vuestras estrategias están preparadas?",
      confirmAction: "START"
    });
  };

  const executeStartGame = async () => {
    setAnnouncement(null); // Cerramos el modal primero
    if (!lobby || !user || !user.authToken) return;

    try {
        await startGame(lobby.id, lobby.player1Id, lobby.player2Id!, user.authToken);
    } catch (err) {
        setError("No se pudo comenzar la partida");
        console.error(err);
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
            isCurrentUser={lobby.player1Id === Number(user?.id)}
            onToggleReady={handleToggleReady}/>

        <h1 className="vs-divider">VS</h1>
        
        {lobby.player2Id ? (
            <PlayerCard 
                playerId={lobby.player2Id} 
                isReady={lobby.player2Ready}
                isCurrentUser={lobby.player2Id === Number(user?.id)}
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
            {/* --- NUEVO: Mostrar que la partida está en curso --- */}
            {lobby.status === 'ONGOING' 
                ? "PARTIDA EN CURSO" 
                : (lobby.player1Ready && lobby.player2Ready ? "INICIANDO..." : "Esperando jugadores...")}
          </span>
        </div>
        
        {/* --- NUEVO: Renderizado condicional de los botones --- */}
        {lobby.status === 'ONGOING' ? (
            <button className="start-btn" onClick={() => navigate(`/game/${id}`)} style={{backgroundColor: '#2ecc71'}}>
                RECONECTAR A LA PARTIDA

            </button>
        ) : (
            lobby.player1Ready && lobby.player2Ready && lobby.player1Id === Number(user?.id) ? (
                <button className="start-btn" onClick={handleStartGameClick}>
                    COMENZAR PARTIDA
                </button>
            ) : null
        )}

        <button className="exit-btn" onClick={handleLeaveClick}>
            SALIR DEL LOBBY
        </button>
      </footer>

        <AnnouncementModal
          isOpen={!!announcement}
          onClose={() => setAnnouncement(null)}
          title={announcement?.title || ""}
          message={announcement?.message || ""}
          onConfirm={
              announcement?.confirmAction === "START" ? executeStartGame :
              announcement?.confirmAction === "LEAVE" ? executeLeave : 
              undefined
          }
          confirmText={
              announcement?.confirmAction === "START" ? "¡A LA BATALLA!" : 
              announcement?.confirmAction === "LEAVE" ? "ABANDONAR" : 
              "CONTINUAR"
          }
      />

    </div>
  );
}

export default LobbyRoom;
import { useEffect, useState } from "react";
import PlayerCard from "./components/PlayerCard";
import "./LobbyRoom.css";
import { getLobbyById, leaveLobby, setPlayerReady, type LobbyBackend } from "./components/LobbyFetch";
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

        socket.emit('joinLobby', `lobby${id}`);

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
    if (showLoading) setLoading(true);
      
    try {
        const data = await getLobbyById(Number(id));   
        setLobby(data);
          
        if (!data) {
            setError("La sala ya no existe");
        }

        if (data.status === 'ONGOING') {
            navigate(`/game/${id}`);
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
    if (!socket) {
        console.log("Socket no disponible aún...");
        return;
    }
    try {
        const isPlayer1 = lobby.player1Id === Number(user?.id);
        const currentReadyStatus = isPlayer1 ? lobby.player1Ready : lobby.player2Ready;
        await setPlayerReady(lobby.id, user?.id || null,!currentReadyStatus);
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

  if (loading || !lobby) return <div className="page-shell page-shell--centered">Cargando...</div>;
  if (error) return <div className="page-shell page-shell--centered"><div className="status-message">{error}</div></div>;

  return (
    <div className="page-shell lobby-shell">
      <div className="page-content lobby-room-content">
        <header className="lobby-room-header page-panel">
          <span className="page-eyebrow">Lobby #{lobby.id}</span>
          <h1 className="page-title">Preparad el duelo</h1>
          <p className="page-subtitle">
            Revisa los jugadores presentes, confirma que ambos estáis listos y lanza la partida cuando todo
            esté preparado.
          </p>
          <div className="info-chip-row">
            <span className="info-chip"><strong>Estado:</strong> {lobby.player1Ready && lobby.player2Ready ? "Iniciando..." : "Esperando jugadores"}</span>
            <span className="info-chip"><strong>Privacidad:</strong> {lobby.privacy}</span>
          </div>
        </header>

        <section className="lobby-body page-panel page-panel--soft">
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
        </section>

        <footer className="lobby-footer page-panel">
          <div className="footer-info">
            <span>Estado actual</span>
            <span className="status-text">
              {lobby.player1Ready && lobby.player2Ready ? "INICIANDO..." : "Esperando jugadores..."}
            </span>
          </div>
          
          {lobby.player1Ready && lobby.player2Ready && lobby.player1Id === Number(user?.id) ? (
              <button className="start-btn" onClick={handleStartGameClick}>
                  COMENZAR PARTIDA
              </button>
          )
          : <div className="footer-spacer" />}

          <button className="exit-btn" onClick={handleLeaveClick}>
              SALIR DEL LOBBY
          </button>
        </footer>
      </div>

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

import { useEffect, useState } from "react";
import PlayerCard from "./components/PlayerCard";
import "./LobbyRoom.css";
import { getLobbyById, leaveLobby, setPlayerReady, type LobbyBackend } from "./components/LobbyFetch";
import { startGame } from "../game/components/GameService";
import { useNavigate, useParams } from "react-router";
import { useUser } from "../../hooks/useUser";
import { useAuth } from "../../hooks/useAuth";

function LobbyRoom() {
  const { id } = useParams();
  const [lobby, setLobby] = useState<LobbyBackend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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


  const handleLeave = async () => {
    if (!lobby) return;
    if (!user) return;

    if (window.confirm("¿Seguro que quieres salir?")) {
        try {
            navigate("/lobbyList");
        } catch (err) {
            setError("No se pudo salir del lobby");
            console.error(err);
        }
    }
  };

  const handleStartGame = async () => {
    if (!lobby) return;
    if (!user) return;

    if (window.confirm("¿Seguro que quieres comenzar la partida?")) {
        try {
            await startGame(lobby.id, lobby.player1Id, lobby.player2Id!);
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

export default LobbyRoom;
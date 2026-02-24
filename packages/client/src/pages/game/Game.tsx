import { useEffect, useState } from "react";
import { getGameStateById, makeExampleAction, type GameState } from "./components/GameService";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function Game() {
  const { id } = useParams();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const {socket, user} = useAuth()

  const fetchGameState = async () => {
    try {
      const data = await getGameStateById(Number(id));
      setGameState(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el estado del juego");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) {
        console.log("Socket no disponible aún...");
        return;
    }
    socket.emit('joinGame', `game_${id}`);
    socket.on('action', fetchGameState);
    return () => {
      socket.off('action', fetchGameState);
    };

  }, [socket, id]);

  useEffect(() => {
    fetchGameState();
  }, [id]);

  const handleMakeAction = async () => {
    try{
       if(!id || !user || !gameState) return;
       console.log((gameState.turn == 'peasant' && Number(user.id) == gameState.players.peasant.id) 
           || (gameState.turn == 'king' && Number(user.id) == gameState.players.king.id))
       if((gameState.turn == 'peasant' && Number(user.id) == gameState.players.peasant.id) 
           || (gameState.turn == 'king' && Number(user.id) == gameState.players.king.id))
       {
         await makeExampleAction(Number(id), Number(user.id))
        fetchGameState();
       }
    }catch (err) {
      if (err instanceof Error) {
                alert(err.message);
            } else {
                alert("Ocurrió un error desconocido");
            }
  }};
  
  return (
    <div>
      <h1>{gameState?.turn || "Turno no disponible"}</h1>
      <h2>Jugador Rey: {gameState?.players.king.id}</h2>
      <p>Mano: {gameState?.players.king.hand.join(", ")}</p>
      <p>Pueblo: {gameState?.players.king.town.join(", ")}</p>
      
      <h2>Jugador Campesino: {gameState?.players.peasant.id}</h2>
      <p>Mano: {gameState?.players.peasant.hand.join(", ")}</p>
      <p>Pueblo: {gameState?.players.peasant.town.join(", ")}</p>
      

      <button onClick={handleMakeAction}>Accion</button>
      {error && <p style={{color: "red"}}>{error}</p>}
    </div>
  );
}

export default Game;
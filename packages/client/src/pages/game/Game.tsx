import { useEffect, useState } from "react";
import { getGameStateById, type GameState } from "./components/GameService";
import { useParams } from "react-router-dom";

function Game() {
  const { id } = useParams();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  useEffect(() => {
    fetchGameState();
  }, [id]);

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
  
  return (
    <div>
      <h1>{gameState?.turn || "Turno no disponible"}</h1>
      <h2>Jugador Rey: {gameState?.players.king.id}</h2>
      <p>Mano: {gameState?.players.king.hand.join(", ")}</p>
      <p>Pueblo: {gameState?.players.king.town.join(", ")}</p>
      
      <h2>Jugador Campesino: {gameState?.players.peasant.id}</h2>
      <p>Mano: {gameState?.players.peasant.hand.join(", ")}</p>
      <p>Pueblo: {gameState?.players.peasant.town.join(", ")}</p>

      {error && <p style={{color: "red"}}>{error}</p>}
    </div>
  );
}

export default Game;
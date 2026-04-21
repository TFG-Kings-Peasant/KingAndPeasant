import { useState, useEffect } from "react";
import { getGameStateById, type GameState } from "../pages/game/components/GameService";

export const useGameData = (id: string | undefined, user: any, socket: any) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gameOverData, setGameOverData] = useState<{
    isGameOver: boolean;
    winnerId: number;
    reason: string;
  } | null>(null);
  const [announcement, setAnnouncement] = useState<{
    title: string;
    message: string
  } | null>(null);
  
  useEffect(() => {
    const fetchGameState = async () => {
      try {
        if (!id || !user || !user.authToken) return;
        const data = await getGameStateById(Number(id), user.authToken);
        setGameState(data);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el estado del juego");
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();
  }, [id, user]);

  useEffect(() => {
    if (!socket || !id || !user) return;

    const handleGameStateUpdate = (newGameState: GameState) => {
      console.log("=== TABLERO ACTUALIZADO VÍA SOCKET ===", newGameState);
      setGameState((prevState) => {
        if (prevState && newGameState.era > prevState.era) {
          setAnnouncement({
            title: "🚩 ¡FIN DE LA ERA!",
            message: `Alguien ha ganado la Era ${prevState.era}.\n\n¡Comienza la Era ${newGameState.era} y se han intercambiado los roles!`
          });
        }
        return newGameState;
      });
    };

    socket.emit("joinGame", { 
        roomName: `game_${id}`, 
        userId: Number(user.id) 
    });
    socket.on("gameState", handleGameStateUpdate);
    socket.on("game:finished", (data: any) => {
      console.log("=== PARTIDA TERMINADA ===", data);
      setGameOverData(data);
    });

    return () => {
      socket.off("gameState", handleGameStateUpdate);
      socket.off("game:finished");

      console.log("Saliendo de la partida, desconectando socket...");
      socket.disconnect();
      socket.connect();
    };
  }, [socket, id, user]);

  return { 
    gameState,
    loading,
    error,
    setError,
    gameOverData,
    announcement,
    setAnnouncement
  };
};
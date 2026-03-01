import { useEffect, useState } from "react";
import { getGameStateById, makeExampleAction, type GameState } from "./components/GameService";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Game.css";

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

  // Si no hay estado o usuario, mostramos la pantalla de carga
  if (loading || !gameState || !user) return <div>Cargando el Tablero...</div>;

  // Calculamos la perspectiva
  const isKing = Number(user.id) === gameState.players.king.id;
  const myPlayer = isKing ? gameState.players.king : gameState.players.peasant;
  const rivalPlayer = isKing ? gameState.players.peasant : gameState.players.king;

  const myRoleName = isKing ? "REY" : "CAMPESINO";
  const rivalRoleName = isKing ? "CAMPESINO" : "REY";
  
  return (
  <div className="game-board">
    {/* COLUMNA IZQUIERDA: JUEGO */}
    <div className="game-main-area">
      
      {/* RIVAL */}
      <div className="opponent-area">
        <h3>RIVAL ({rivalRoleName})</h3>
        <div className="hand">
          {rivalPlayer.hand.map((card) => (
            <div key={card.uid} className="card ingame back"></div>
          ))}
        </div>
        <div className="town">
          {rivalPlayer.town.map((card) => (
            <div key={card.uid} className="card ingame" style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}></div>
          ))}
        </div>
      </div>

      {/* TÚ */}
      <div className="player-area">
        <div className="town">
          {myPlayer.town.map((card) => (
            <div key={card.uid} className= {`card ingame ${!card.templateId ? 'back' : ''}`} style={{ backgroundImage: card.templateId ? `url('/cards/${card.templateId}.png')` : undefined }}></div>
          ))}
        </div>
        <div className="hand">
          {myPlayer.hand.map((card) => (
            <div key={card.uid} className="card ingame" style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}></div>
          ))}
        </div>
        <h3>TU MANO ({myRoleName}) - Turno: {gameState.turn.toUpperCase()}</h3>
      </div>
    </div>

    {/* COLUMNA DERECHA: MAZO Y ACCIONES */}
    <div className="game-sidebar">
      <div className="deck-pile">
        <span>MAZO</span>
        <strong>{gameState.deckCount}</strong>
      </div>
      
      <div className="discard-pile">
        <span>DESCARTES</span>
        <strong>{gameState.discardPile.length}</strong>
      </div>

      <div className="action-container">
        <button className = "button ingame" onClick={handleMakeAction}>PASAR TURNO</button>
      </div>
    </div>

    {error && <p className="error-msg">{error}</p>}
  </div>
);
}

export default Game;
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
      
      {/* ZONA RIVAL (Arriba) */}
      <div className="opponent-area">
        <h3>RIVAL ({rivalRoleName})</h3>
        <div className="hand rival-hand">
          {rivalPlayer.hand.map((card) => (
            <div key={card.uid} className="card back">OCULTA</div>
          ))}
        </div>
        <div className="town rival-town">
          {rivalPlayer.town.map((card) => (
            <div 
              key={card.uid} 
              className="card"
              style={{ 
                backgroundImage: `url('/cards/${card.templateId}.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: 'none', // Quitamos el borde por defecto para que luzca mejor
                backgroundColor: 'transparent'
              }}
            />
          ))}
        </div>
      </div>

      {/* ZONA CENTRAL */}
      <div className="center-area">
        <div className="deck-pile">MAZO<br/>({gameState.deck.length})</div>
        <div className="discard-pile">DESCARTES<br/>({gameState.discardPile.length})</div>
        
        {/* Dejamos tu botón de prueba aquí en medio temporalmente */}
        <button onClick={handleMakeAction}>Acción de Prueba</button>
      </div>

      {/* TU ZONA (Abajo) */}
      <div className="player-area">
        <div className="town my-town">
          {myPlayer.town.map((card) => (
             <div 
               key={card.uid} 
               className="card"
               style={{ 
                 backgroundImage: `url('/cards/${card.templateId}.png')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 border: 'none',
                 backgroundColor: 'transparent'
               }}
             />
          ))}
        </div>
        <div className="hand my-hand">
          {myPlayer.hand.map((card) => (
             <div 
               key={card.uid} 
               className="card"
               style={{ 
                 backgroundImage: `url('/cards/${card.templateId}.png')`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 border: 'none',
                 backgroundColor: 'transparent'
               }}
             />
          ))}
        </div>
        <h3>TU MANO ({myRoleName}) - Turno actual: {gameState.turn.toUpperCase()}</h3>
      </div>
      
      {error && <p style={{color: "red", textAlign: "center"}}>{error}</p>}
    </div>
  );
}

export default Game;
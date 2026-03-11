import { useEffect, useRef, useState } from "react";
import { getGameStateById, getPosibleActions, playCard, resolvePendingAction, type CardState, type GameState } from "./components/GameService";
import "./GameChat.css";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Game.css";

interface ChatMessage {
  sender: string;
  text: string;
}

function Game() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedCard, setSelectedCard] = useState<CardState | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {socket, user} = useAuth()

  const [gameOverData, setGameOverData] = useState<{
    isGameOver: boolean;
    winnerId: number;
    reason: string;  
  } | null>(null);

  const fetchGameState = async () => {
    try {
      if(!id || !user || !user.authToken) return;
      const data = await getGameStateById(Number(id), user?.authToken);
      setGameState(data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el estado del juego");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) {
        console.log("Socket no disponible aún...");
        return;
    }

    const handleReceiveMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleGameStateUpdate = (newGameState: GameState) => {
        console.log("=== TABLERO ACTUALIZADO VÍA SOCKET ===", newGameState);
        setGameState((prevState) => {
            // Si YA teníamos una partida en pantalla y la nueva Era es mayor...
            if (prevState && newGameState.era > prevState.era) {
                alert(`🚩 ¡FIN DE LA ERA!\nAlguien ha ganado la Era ${prevState.era}.\n\n¡Comienza la Era ${newGameState.era} y se han intercambiado los roles!`);
            }
            // Devolvemos el nuevo estado para que React actualice la pantalla
            return newGameState; 
        });
    };

    socket.emit('joinGame', `game_${id}`);
    socket.on('gameState', handleGameStateUpdate);

    socket.on('receiveChatMessage', handleReceiveMessage);

    socket.on('game:finished', (data) => {
        console.log("=== PARTIDA TERMINADA ===", data);
        setGameOverData(data); 
    });

    return () => {
      socket.off('gameState', fetchGameState);
      socket.off('receiveChatMessage', handleReceiveMessage);
      socket.off('game:finished');
    };

  }, [socket, id]);

  useEffect(() => {
    fetchGameState();
  }, [id]);

  

  if (loading || !gameState || !user) return <div>Cargando el Tablero...</div>;

  const isKing = Number(user.id) === gameState.players.king.id;
  const myPlayer = isKing ? gameState.players.king : gameState.players.peasant;
  const rivalPlayer = isKing ? gameState.players.peasant : gameState.players.king;

  const myRoleName = isKing ? "king" : "peasant";
  const rivalRoleName = isKing ? "peasant" : "king";
  const pendingAction = gameState.pendingAction && gameState.pendingAction.player == myRoleName? true: false;
  
  const myScore = gameState.scores[String(user.id)] || 0;
  const rivalScore = gameState.scores[String(rivalPlayer.id)] || 0;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!currentMessage.trim() || !socket || !id || !user) return;

    const newMsg: ChatMessage = {
      sender: user.name, 
      text: currentMessage,
    };

    socket.emit('sendChatMessage', { 
      room: `game_${id}`, 
      sender: newMsg.sender, 
      text: newMsg.text 
    });

    setMessages((prev) => [...prev, newMsg]);
    setCurrentMessage("");
  };
  
  const handleSelectCard = (card: CardState, position: 'hand' | 'town' | 'deck' | 'discard'| null) => {
    if(position){
      card.position = position;
    }
    setSelectedCard(card);
  }

  const handlePlayCard = async () => {
    if(!id || !user || !user.authToken || !gameState || !selectedCard) return;
    if(gameState.turn !== myRoleName) {
      alert("No es tu turno");
      return;
    }
    const cardToPlayUid = selectedCard.uid;
    setSelectedCard(null);
    try {
      await playCard(Number(id), cardToPlayUid, {}, user.authToken)
      setSelectedCard(null);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Ocurrió un error desconocido");
      }
      setError("Error jugando una carta")
    }
  }

  const handleResolvePending = async (targetData: Record<string, unknown>) => {
    if(!id || !user || !user.authToken || !gameState) return;
    if(gameState.turn !== myRoleName) {
      alert("No es tu turno");
      return;
    }
    try {
      await resolvePendingAction(Number(id), targetData, user.authToken)
      
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Ocurrió un error desconocido");
      }
      setError("Error jugando una carta")
    }
  }

  return (
  <div className="game-board">
    <div className="game-main-area">
      
      <div className="opponent-area">
        <h3>RIVAL ({rivalRoleName})</h3>
        <div className="hand">
          {rivalPlayer.hand.map((card) => (
            <div key={card.uid} className="card ingame back"></div>
          ))}
        </div>
        <div className="town">
          {rivalPlayer.town.map((card) => (
            <div key={card.uid} className="card ingame" style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }} 
            onClick={() => handleSelectCard(card, null)}></div>
          ))}
        </div>
      </div>

      <div className="player-area">
        <div className="town">
          {myPlayer.town.map((card) => (
            <div key={card.uid} className= {`card ingame ${!card.templateId ? 'back' : ''}`} style={{ backgroundImage: card.templateId ? `url('/cards/${card.templateId}.png')` : undefined }} 
            onClick={() => handleSelectCard(card, "town")}></div>
          ))}
        </div>
        <div className="hand">
          {myPlayer.hand.map((card) => (
            <div key={card.uid} className="card ingame" style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }} 
            onClick={() => handleSelectCard(card, "hand")}></div>
          ))}
        </div>
        <h3>TU MANO ({myRoleName}) - Turno: {gameState.turn.toUpperCase()}</h3>
      </div>
    </div>

    <div className="game-sidebar">
      <div className="score-board" style={{ backgroundColor: '#2c2c2c', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '2px solid #d4af37' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#d4af37', fontSize: '1.5rem' }}>ERA {gameState.era}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
              <div>
                  <span style={{ display: 'block', color: '#aaa', fontSize: '0.8rem' }}>Tus Victorias</span>
                  <strong style={{ fontSize: '1.2rem'}}>{myScore} / 2</strong>
              </div>
              <div>
                  <span style={{ display: 'block', color: '#aaa', fontSize: '0.8rem' }}>Rival</span>
                  <strong style={{ fontSize: '1.2rem'}}>{rivalScore} / 2</strong>
              </div>
          </div>
      </div>

      <div className="deck-pile">
        <span>MAZO</span>
        <strong>{gameState.deckCount}</strong>
      </div>
      
      <div className="discard-pile">
        <span>DESCARTES</span>
        <strong>{gameState.discardPile.length}</strong>
      </div>

      <div className="action-container">
        {/*<button className = "button ingame" onClick={handleMakeAction}>PASAR TURNO</button>*/}

      <div className="chat-container">
        <h3 className="chat-header">
          Chat de Partida
        </h3>
        
        <div className="chat-messages-area">
          {messages.map((msg, index) => (
            <div key={index} className="chat-message">
              <strong className="chat-sender">{msg.sender}: </strong>
              <span>{msg.text}</span>
            </div>
          ))}
          {messages.length === 0 && <p className="chat-empty">Aún no hay mensajes.</p>}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-form">
          <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Escribe un mensaje..."
            className="chat-input"
          />
          <button type="submit" className="chat-submit-btn">
            Enviar
          </button>
        </form>
      </div>
      </div>
    </div>
    
    {pendingAction && (
      <div className="pending-action-overlay">
        <div className="pending-action-content">
          <h2>¡Acción Requerida!</h2>
          <p>Debes resolver: {gameState.pendingAction?.type}</p>
          
          {/* Botones temporales para probar */}
          <button onClick={() => handleResolvePending({ action: 'SKIP' })}>Saltar</button>
          <button onClick={() => handleResolvePending({ test: 'data' })}>Probar Acción</button>
        </div>
      </div>
    )}

    {/* --- NUEVO: MODAL DE CARTA AMPLIADA --- */}
    {selectedCard && (
      <div className="card-modal-overlay" onClick={() => setSelectedCard(null)}>
        {/* Al hacer click en el contenido evitamos que se cierre (propagation) */}
        <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
          <div 
            className="card zoomed" 
            style={{ backgroundImage: `url('/cards/${selectedCard.templateId}.png')` }}
          ></div>
          {gameState.turn === myRoleName && selectedCard.position === "hand" && (
          <button
            onClick={handlePlayCard}
            className="button ingame"
          >
            {getPosibleActions(selectedCard, isKing)}
          </button>
          )}
        </div>
      </div>
    )}

    {error && <p className="error-msg">{error}</p>}

    {gameOverData && (
      <div className="card-modal-overlay" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card-modal-content" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '10px', color: '#000' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
                {gameOverData.winnerId === Number(user?.id) 
                    ? '👑 ¡HAS GANADO!' 
                    : '💀 HAS PERDIDO'}
            </h1>
            
            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
                Motivo: <strong>{gameOverData.reason}</strong>
            </p>
            
            <button 
                onClick={() => navigate('/')} // Te lleva al inicio
                className="button ingame"
                style={{ padding: '10px 20px', fontSize: '1.1rem', cursor: 'pointer' }}
            >
                Volver al Menú Principal
            </button>
        </div>
      </div>
    )}

  </div>
  );
}

export default Game;
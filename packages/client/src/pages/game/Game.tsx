import { useEffect, useRef, useState } from "react";
import { condemnRebel, drawACard, getGameStateById, getPosibleActions, passTurn, playCard, resolvePendingAction, type CardState, type GameState } from "./components/GameService";
import "./GameChat.css";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Game.css";

interface ChatMessage {
  sender: string;
  text: string;
}

function Game() {
  const { id } = useParams();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedCard, setSelectedCard] = useState<CardState | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {socket, user} = useAuth()

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
        setGameState(newGameState); 
    };

    socket.emit('joinGame', `game_${id}`);
    socket.on('gameState', handleGameStateUpdate);

    socket.on('receiveChatMessage', handleReceiveMessage);

    return () => {
      socket.off('gameState', fetchGameState);
      socket.off('receiveChatMessage', handleReceiveMessage);
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
  
  const handleSelectCard = (card: CardState, position: 'hand' | 'town' | 'enemyTown' | 'deck' | 'discard'| null) => {
    if(position){
      card.position = position;
    }
    setSelectedCard(card);
  }

  const handlePassTurn = async () => {
    if(!id || !user || !user.authToken || !gameState) return;
    if(gameState.turn !== myRoleName) {
      alert("No es tu turno");
      return;
    }
    try{
      await passTurn(Number(id), user.authToken)

    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
        setError(err.message);
      } else {
        alert("Ocurrió un error desconocido");
      }
    }
  } 

  const handleDrawCard = async () => {
    if(!id || !user || !user.authToken || !gameState) return;
    if(gameState.turn !== myRoleName) {
      alert("No es tu turno");
      return;
    }
    try{
      await drawACard(Number(id), user.authToken)

    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
        setError(err.message);
      } else {
        alert("Ocurrió un error desconocido");
      }
    }
  } 

  const handlePlayCard = async () => {
    if(!id || !user || !user.authToken || !gameState || !selectedCard) return;
    if(gameState.turn !== myRoleName) {
      alert("No es tu turno");
      return;
    }
    const cardToPlayUid = selectedCard.uid;
    try {
      if(selectedCard.position === 'enemyTown' && isKing){
        await condemnRebel(Number(id), false,cardToPlayUid, user.authToken)
      }else if(selectedCard.position === 'hand'){
        await playCard(Number(id), cardToPlayUid, {}, true, user.authToken)
      }else if(selectedCard.position === 'town'){
        await playCard(Number(id), cardToPlayUid, {}, false, user.authToken)
      }

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

  const handleCondemnDeckCard = async () => {
    if(!id || !user || !user.authToken || !gameState) return;
    if(gameState.turn !== myRoleName) {
      alert("No es tu turno");
      return;
    }
    try {
      await condemnRebel(Number(id), true, '', user.authToken)
      setSelectedCard(null);
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Ocurrió un error desconocido");
      }
      setError("Error al condenar carta de la deck")
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
            card.isRevealed ? <div key={card.uid} className="card ingame" style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }} 
            onClick={() => handleSelectCard(card, 'enemyTown')}></div> : 
            <div key={card.uid} className="card ingame back" onClick={() => handleSelectCard(card, 'enemyTown')}></div>
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
      <div className="deck-pile">
        <span>MAZO</span>
        <strong>{gameState.deckCount}</strong>
      </div>
      
      <div className="discard-pile">
        <span>DESCARTES</span>
        <strong>{gameState.discardPile.length}</strong>
      </div>

      <div className="action-container">
        {gameState.turn === myRoleName ? <div>
          <button className = "button ingame" onClick={handlePassTurn}>PASAR TURNO</button> 
          {myRoleName === 'peasant' ? <button className = "button ingame" onClick={handleDrawCard}>ROBAR CARTA</button> : 
          <button className = "button ingame" onClick={handleCondemnDeckCard}>CONDENAR CARTA DEL MAZO</button>  }
          </div>
        : <div></div>}

      </div>

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
        <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
      
          <div 
            className="card zoomed" 
            style={(selectedCard.isRevealed || selectedCard.position == 'hand' || selectedCard.position == 'town') 
              ? { backgroundImage: `url('/cards/${selectedCard.templateId}.png')` } 
            : { backgroundImage: `url('/cards/Back.png')` } }
          ></div>
          {gameState.turn === myRoleName && (
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
  </div>
  );
}

export default Game;
import { useEffect, useRef, useState } from "react";
import { getGameStateById, makeExampleAction, type GameState } from "./components/GameService";
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
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    socket.emit('joinGame', `game_${id}`);
    socket.on('action', fetchGameState);

    socket.on('receiveChatMessage', handleReceiveMessage);

    return () => {
      socket.off('action', fetchGameState);
      socket.off('receiveChatMessage', handleReceiveMessage);
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

    {error && <p className="error-msg">{error}</p>}
  </div>
);
}

export default Game;
import { useEffect, useRef, useState } from "react";
import { getGameStateById, makeExampleAction, type GameState } from "./components/GameService";
import "./GameChat.css";
import { useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

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
    <div>
      <h1>{gameState?.turn || "Turno no disponible"}</h1>
      <h2>Jugador Rey: {gameState?.players.king.id}</h2>
      <p>Mano: {gameState?.players.king.hand.join(", ")}</p>
      <p>Pueblo: {gameState?.players.king.town.join(", ")}</p>
      
      <h2>Jugador Campesino: {gameState?.players.peasant.id}</h2>
      <p>Mano: {gameState?.players.peasant.hand.join(", ")}</p>
      <p>Pueblo: {gameState?.players.peasant.town.join(", ")}</p>
      

      <button onClick={handleMakeAction}>Accion</button>

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
      {error && <p style={{color: "red"}}>{error}</p>}
    </div>
  );
}

export default Game;
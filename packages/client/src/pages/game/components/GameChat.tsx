import React, { useEffect, useRef, useState } from "react";
import "../GameChat.css"; // Ajusta la ruta del CSS si lo pones en una carpeta distinta

interface ChatMessage {
  sender: string;
  text: string;
}

interface GameChatProps {
  socket: any;
  gameId: string;
  userName: string;
}

export const GameChat: React.FC<GameChatProps> = ({ socket, gameId, userName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escuchar los mensajes del servidor
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receiveChatMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveChatMessage", handleReceiveMessage);
    };
  }, [socket]);

  // Hacer scroll hacia abajo al recibir un nuevo mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Enviar un mensaje
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentMessage.trim() || !socket || !gameId || !userName) return;

    const newMsg: ChatMessage = {
      sender: userName,
      text: currentMessage,
    };

    socket.emit("sendChatMessage", {
      room: `game_${gameId}`,
      sender: newMsg.sender,
      text: newMsg.text,
    });

    setMessages((prev) => [...prev, newMsg]);
    setCurrentMessage("");
  };

  return (
    <div className="chat-container">
      <h3 className="chat-header">Chat de Partida</h3>

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
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="chat-input"
        />
        <button type="submit" className="chat-submit-btn">
          Enviar
        </button>
      </form>
    </div>
  );
};
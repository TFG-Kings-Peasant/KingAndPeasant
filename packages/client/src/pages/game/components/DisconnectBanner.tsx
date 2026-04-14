import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface DisconnectBannerProps {
  socket: any;
}

export const DisconnectBanner = ({ socket }: DisconnectBannerProps) => {
  const navigate = useNavigate();
  const [disconnectDeadline, setDisconnectDeadline] = useState<number | null>(null);
  const [disconnectedUserId, setDisconnectedUserId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Escucha de eventos de Sockets
  useEffect(() => {
    if (!socket) return;

    const handlePlayerDisconnected = ({ userId, deadline }: { userId: number, deadline: number }) => {
      setDisconnectedUserId(userId);
      setDisconnectDeadline(deadline);
    };

    const handlePlayerReconnected = ({ userId }: { userId: number }) => {
      if (userId === disconnectedUserId) {
        setDisconnectDeadline(null);
        setDisconnectedUserId(null);
        setTimeLeft(0);
      }
    };

    const handlePlayerTimeout = () => {
      setDisconnectDeadline(null);
      alert('El jugador rival no se reconectó a tiempo. Partida terminada.');
      navigate('/');
    };

    socket.on('playerDisconnected', handlePlayerDisconnected);
    socket.on('playerReconnected', handlePlayerReconnected);
    socket.on('playerTimeout', handlePlayerTimeout);

    return () => {
      socket.off('playerDisconnected', handlePlayerDisconnected);
      socket.off('playerReconnected', handlePlayerReconnected);
      socket.off('playerTimeout', handlePlayerTimeout);
    };
  }, [socket, disconnectedUserId, navigate]);

  // Bucle del Temporizador
  useEffect(() => {
    if (!disconnectDeadline) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, disconnectDeadline - Date.now());
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [disconnectDeadline]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Si no hay desconexión, no renderizamos nada
  if (!disconnectDeadline) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%',
      backgroundColor: '#ff4444', color: 'white', padding: '10px',
      textAlign: 'center', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    }}>
      ¡El jugador rival se ha desconectado! Tiempo para reconectar: {formatTime(timeLeft)}
    </div>
  );
};
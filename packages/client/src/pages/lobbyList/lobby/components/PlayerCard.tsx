import { useEffect, useState } from "react";
import "./PlayerCard.css";

interface PlayerCardProps {
    playerId: number;
    isReady: boolean;      // Estado de listo (viene de la DB)
    isCurrentUser: boolean; // ¿Soy yo esta tarjeta?
    onToggleReady?: () => void; // Función para pulsar el botón (solo si soy yo)
}

export default function PlayerCard({ playerId, isReady, isCurrentUser, onToggleReady }: PlayerCardProps) {
    const [player, setPlayer] = useState<{ name: string; avatar: string} | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchPlayer = async () => {
        setLoading(true);
        try {
            // Aquí deberías llamar a tu servicio para obtener los datos del jugador por su ID
            // Por simplicidad, usaremos datos hardcodeados
            const fetchedPlayer = {
                name: "Jugador " + playerId,
                avatar: "https://i.pravatar.cc/150?u=" + playerId, // Avatar aleatorio real
            };
            setPlayer(fetchedPlayer);
        } catch (err) {
          setError("Error al cargar el jugador");
          console.error(err);
      } finally {
          setLoading(false);
      }
    }

    useEffect(() => {
        if(playerId) fetchPlayer();
    }, [playerId]);

    if (!playerId) return <div className="player-card empty">Esperando...</div>;

    return (
        <div className={`player-card ${isReady ? 'card-ready' : ''}`}>
            <div className="player-info">
                <div className="player-avatar">
                    <div className="img-container">
                        <img src={player?.avatar || "default.png"} alt="avatar" />
                    </div>
                </div>
                <div className="player-details">
                    {/* Solo mostramos "TÚ" si isCurrentUser es true */}
                    {isCurrentUser && <h1>TÚ</h1>}
                    
                    <h3>{player?.name}</h3>
                    
                    {/* LÓGICA DEL BOTÓN VS TEXTO */}
                    {isCurrentUser ? (
                        <button 
                            className={`ready-btn ${isReady ? 'btn-green' : 'btn-gray'}`} 
                            onClick={onToggleReady}
                        >
                            {isReady ? "¡LISTO!" : "NO LISTO"}
                        </button>
                    ) : (
                        <div className="status-badge">
                            {isReady ? "RIVAL LISTO" : "PENSANDO..."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
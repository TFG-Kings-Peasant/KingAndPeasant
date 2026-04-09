import React from "react";

interface GameOverModalProps {
  gameOverData: { isGameOver: boolean; winnerId: number; reason: string };
  userId: number;
  onNavigateHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameOverData,
  userId,
  onNavigateHome,
}) => {
  return (
    <div
      className="card-modal-overlay"
      style={{ zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        className="card-modal-content"
        style={{
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#fff",
          borderRadius: "10px",
          color: "#000",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>
          {gameOverData.winnerId === userId ? "👑 ¡HAS GANADO!" : "💀 HAS PERDIDO"}
        </h1>
        <p style={{ fontSize: "1.2rem", marginBottom: "30px" }}>
          Motivo: <strong>{gameOverData.reason}</strong>
        </p>
        <button
          onClick={onNavigateHome}
          className="button ingame"
          style={{ padding: "10px 20px", fontSize: "1.1rem", cursor: "pointer" }}
        >
          Volver al Menú Principal
        </button>
      </div>
    </div>
  );
};
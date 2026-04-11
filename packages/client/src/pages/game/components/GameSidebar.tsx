import React from "react";
import type { GameState } from "./GameService";
import { GameChat } from "./GameChat"; // Asegúrate de que la ruta es correcta

interface GameSidebarProps {
  gameState: GameState;
  myScore: number;
  rivalScore: number;
  myRoleName: string;
  socket: any;
  gameId: string;
  userName: string;
  setShowDeckModal: (show: boolean) => void;
  setShowDiscardModal: (show: boolean) => void;
  onPassTurn: () => void;
  onDrawCard: () => void;
  onCondemnDeckCard: () => void;
}

export const GameSidebar: React.FC<GameSidebarProps> = ({
  gameState,
  myScore,
  rivalScore,
  myRoleName,
  socket,
  gameId,
  userName,
  setShowDeckModal,
  setShowDiscardModal,
  onPassTurn,
  onDrawCard,
  onCondemnDeckCard,
}) => {
  const canPerformStandardActions = gameState.turn === myRoleName && !gameState.pendingAction;
  return (
    <div className="game-sidebar">
      {/* Marcador */}
      <div
        className="score-board"
        style={{
          backgroundColor: "#2c2c2c",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          textAlign: "center",
          border: "2px solid #d4af37",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0", color: "#d4af37", fontSize: "1.5rem" }}>
          ERA {gameState.era}
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
          <div>
            <span style={{ display: "block", color: "#aaa", fontSize: "0.8rem" }}>Tus Victorias</span>
            <strong style={{ fontSize: "1.2rem" }}>{myScore} / 2</strong>
          </div>
          <div>
            <span style={{ display: "block", color: "#aaa", fontSize: "0.8rem" }}>Rival</span>
            <strong style={{ fontSize: "1.2rem" }}>{rivalScore} / 2</strong>
          </div>
        </div>
      </div>

      {/* Mazo */}
      <div className="deck-pile" onClick={() => setShowDeckModal(true)}>
        <span>MAZO</span>
        <strong>{gameState.deck.length}</strong>
      </div>

      {/* Descartes */}
      <div className="discard-pile" onClick={() => setShowDiscardModal(true)}>
        <h3>DESCARTES</h3>
        <p>{gameState.discardPile?.length || 0}</p>
      </div>

      {/* Botones de Acción */}
      <div className="action-container">
        {canPerformStandardActions ? (
          <div>
            <button className="button ingame" onClick={onPassTurn}>
              PASAR TURNO
            </button>
            {myRoleName === "peasant" ? (
              <button className="button ingame" onClick={onDrawCard}>
                ROBAR CARTA
              </button>
            ) : (
              <button className="button ingame" onClick={onCondemnDeckCard}>
                CONDENAR CARTA DEL MAZO
              </button>
            )}
          </div>
        ) : (
          <div></div>
        )}
      </div>

      {/* Chat de Partida */}
      <GameChat socket={socket} gameId={gameId} userName={userName} />
    </div>
  );
};
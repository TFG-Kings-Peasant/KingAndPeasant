import React from "react";
import type { GameState } from "./GameService";
import { GameChat } from "./GameChat"; // Asegúrate de que la ruta es correcta

interface GameSidebarProps {
  gameState: GameState;
  myScore: number;
  rivalScore: number;
  myRoleName: string;
  rivalRoleName: string;
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
  rivalRoleName,
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
      <div className="action-container">
        <div className="sidebar-section-heading">
          <span>Acciones</span>
          <strong>{canPerformStandardActions ? "Disponibles" : "En espera"}</strong>
        </div>
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
          <div>
            <button className="button ingame" disabled>
              ESPERA A TU TURNO
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-title-block">
        <span className="sidebar-kicker">Battle status</span>
        <h2 className="sidebar-title">Panel de batalla</h2>
        <div className="sidebar-status-grid">
          <span className="sidebar-status-pill">Tu bando: {myRoleName}</span>
          <span className="sidebar-status-pill">Rival: {rivalRoleName}</span>
          <span className="sidebar-status-pill">Turno: {gameState.turn}</span>
          <span className="sidebar-status-pill">
            {gameState.pendingAction ? `Pendiente: ${gameState.pendingAction.type}` : "Sin accion pendiente"}
          </span>
        </div>
      </div>

      <div className="score-board">
        <h2 className="score-board-title">ERA {gameState.era}</h2>
        <div className="score-board-row">
          <div>
            <span className="score-label">Tus Victorias</span>
            <strong className="score-value">{myScore} / 2</strong>
          </div>
          <div>
            <span className="score-label">Rival</span>
            <strong className="score-value">{rivalScore} / 2</strong>
          </div>
        </div>
      </div>

      <div className="sidebar-resource-grid">
        <div className="deck-pile" onClick={() => setShowDeckModal(true)}>
          <span>MAZO</span>
          <strong>{gameState.deck.length}</strong>
        </div>

        <div className="discard-pile" onClick={() => setShowDiscardModal(true)}>
          <h3>DESCARTES</h3>
          <p>{gameState.discardPile?.length || 0}</p>
        </div>
      </div>

      <GameChat socket={socket} gameId={gameId} userName={userName} />
    </div>
  );
};

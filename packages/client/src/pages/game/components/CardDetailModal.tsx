import React from "react";
import type { CardState, GameState } from "./GameService";

interface CardDetailModalProps {
  selectedCard: CardState;
  gameState: GameState;
  myRoleName: string;
  isKing: boolean;
  onClose: () => void;
  onPlayCard: () => void;
  getPosibleActions: (card: CardState, isKing: boolean) => string;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  selectedCard,
  gameState,
  myRoleName,
  isKing,
  onClose,
  onPlayCard,
  getPosibleActions,
}) => {
  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
        <div
          className="card zoomed"
          style={
            selectedCard.isRevealed ||
            selectedCard.position === "hand" ||
            selectedCard.position === "myTown"
              ? { backgroundImage: `url('/cards/${selectedCard.templateId}.png')` }
              : { backgroundImage: `url('/cards/Back.png')` }
          }
        ></div>
        {gameState.turn === myRoleName &&
          !gameState?.pendingAction &&
          getPosibleActions(selectedCard, isKing) !== "" && (
            <button onClick={onPlayCard} className="button ingame">
              {getPosibleActions(selectedCard, isKing)}
            </button>
          )}
      </div>
    </div>
  );
};
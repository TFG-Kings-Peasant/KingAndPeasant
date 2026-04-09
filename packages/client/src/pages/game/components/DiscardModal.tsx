import React from "react";
import type { CardState, GameState, CardPosition } from "./GameService";
import type { SelectedCard } from "./pendingActionsUI";

interface DiscardModalProps {
  gameState: GameState;
  actionTargets: SelectedCard[];
  activeConfig: any;
  onClose: () => void;
  onSelectCard: (card: CardState, position: CardPosition) => void;
  onSetSelectedCard: (card: CardState) => void;
}

export const DiscardModal: React.FC<DiscardModalProps> = ({
  gameState,
  actionTargets,
  activeConfig,
  onClose,
  onSelectCard,
  onSetSelectedCard,
}) => {
  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="discard-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Mazo de Descartes</h2>
        <div className="discard-grid">
          {gameState.discardPile?.length === 0 ? (
            <p>El mazo de descartes está vacío.</p>
          ) : (
            gameState.discardPile
              ?.filter((card, index, array) => {
                if (gameState.pendingAction?.type === "REASSEMBLE1") {
                  return index !== array.length - 1;
                }
                return true;
              })
              .map((card, index) => {
                const isSelected = actionTargets.some((t) => t.uid === card.uid);
                const isClickable =
                  gameState?.pendingAction && activeConfig?.allowedZones.includes("discard");

                return (
                  <div
                    key={`${card.uid}-${index}`}
                    className={`card ingame ${isSelected ? "selected-target" : ""} ${
                      isClickable ? "clickable" : ""
                    }`}
                    style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}
                    onClick={() => {
                      if (isClickable) {
                        onSelectCard(card, "discard");
                      } else {
                        onSetSelectedCard(card);
                      }
                    }}
                  ></div>
                );
              })
          )}
        </div>
        <button
          className="button ingame"
          style={{ marginTop: "20px", width: "auto", padding: "10px 20px" }}
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
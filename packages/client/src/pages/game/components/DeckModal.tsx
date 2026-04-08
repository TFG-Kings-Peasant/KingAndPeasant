import React from "react";
import type { CardState, GameState, CardPosition } from "./GameService";
import type { SelectedCard } from "./pendingActionsUI";

interface DeckModalProps {
  gameState: GameState;
  actionTargets: SelectedCard[];
  activeConfig: any;
  onClose: () => void;
  onSelectCard: (card: CardState, position: CardPosition) => void;
  onSetSelectedCard: (card: CardState) => void;
}

export const DeckModal: React.FC<DeckModalProps> = ({
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
        <h2>Mazo</h2>
        <div className="discard-grid">
          {gameState.deck.length === 0 ? (
            <p>El mazo está vacío.</p>
          ) : (
            gameState.deck.map((card, index) => {
              const isSelected = actionTargets.some((t) => t.uid === card.uid);
              const isClickable =
                gameState?.pendingAction && activeConfig?.allowedZones.includes("deck");

              return (
                <div
                  key={`${card.uid}-${index}`}
                  className={`card ingame ${isSelected ? "selected-target" : "back"} ${
                    isClickable ? "clickable" : ""
                  }`}
                  style={{
                    backgroundImage: card.isRevealed
                      ? `url('/cards/${card.templateId}.png')`
                      : `url('/cards/Back.png')`,
                  }}
                  onClick={() => {
                    if (isClickable) {
                      onSelectCard(card, "deck");
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
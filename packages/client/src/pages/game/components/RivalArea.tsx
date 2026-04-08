import React from "react";
import type { CardState, CardPosition, GameState } from "./GameService";
import type { SelectedCard } from "./pendingActionsUI";

interface RivalAreaProps {
  rivalRoleName: string;
  rivalPlayer: { hand: CardState[]; town: CardState[] };
  actionTargets: SelectedCard[];
  gameState: GameState;
  activeConfig: any;
  onSelectCard: (card: CardState, position: CardPosition) => void;
}

export const RivalArea: React.FC<RivalAreaProps> = ({
  rivalRoleName,
  rivalPlayer,
  actionTargets,
  gameState,
  activeConfig,
  onSelectCard,
}) => {
  return (
    <div className="opponent-area">
      <h3>RIVAL ({rivalRoleName})</h3>
      
      {/* Mano del Rival */}
      <div className="hand">
        {rivalPlayer.hand.map((card) => {
          const isSelected = actionTargets.some((t) => t.uid === card.uid);
          const isClickable = gameState?.pendingAction && activeConfig?.allowedZones.includes("rivalHand");
          
          return card.isRevealed ? (
            <div
              key={card.uid}
              className={`card ingame ${isSelected ? "selected-target" : ""} ${isClickable ? "clickable" : ""}`}
              style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}
              onClick={() => onSelectCard(card, "rivalHand")}
            ></div>
          ) : (
            <div
              key={card.uid}
              className="card ingame back"
              onClick={() => onSelectCard(card, "rivalHand")}
            ></div>
          );
        })}
      </div>

      {/* Pueblo del Rival */}
      <div className="town">
        {rivalPlayer.town.map((card) => {
          const isSelected = actionTargets.some((t) => t.uid === card.uid);
          const isClickable = gameState?.pendingAction && activeConfig?.allowedZones.includes("rivalTown");
          
          return card.isRevealed ? (
            <div
              key={card.uid}
              className={`card ingame ${isSelected ? "selected-target" : ""} ${isClickable ? "clickable" : ""}`}
              style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}
              onClick={() => onSelectCard(card, "rivalTown")}
            ></div>
          ) : (
            <div
              key={card.uid}
              className={`card ingame back ${isClickable ? "clickable" : ""}`}
              onClick={() => onSelectCard(card, "rivalTown")}
            ></div>
          );
        })}
      </div>
    </div>
  );
};
import React from "react";
import type { CardState, CardPosition, GameState } from "./GameService";
import type { SelectedCard } from "./pendingActionsUI";

interface PlayerAreaProps {
  myRoleName: string;
  myPlayer: { hand: CardState[]; town: CardState[] };
  actionTargets: SelectedCard[];
  gameState: GameState;
  activeConfig: any;
  onSelectCard: (card: CardState, position: CardPosition) => void;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  myRoleName,
  myPlayer,
  actionTargets,
  gameState,
  activeConfig,
  onSelectCard,
}) => {
  return (
    <div className="player-area">
      {/* Tu Pueblo */}
      <div className="town">
        {myPlayer.town.map((card) => {
          const isSelected = actionTargets.some((t) => t.uid === card.uid);
          const isHiddenForRival = card.isRevealed === false;
          return (
            <div
              key={card.uid}
              className={`card ingame ${isHiddenForRival ? "hidden-style" : ""} ${isSelected ? "selected-target" : ""}`}
              style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}
              onClick={() => onSelectCard(card, "myTown")}
            ></div>
          );
        })}
      </div>

      {/* Tu Mano */}
      <div className={`hand ${gameState.turn !== myRoleName ? "waiting-turn" : ""}`}>
        {myPlayer.hand.map((card) => {
          const isSelected = actionTargets.some((t) => t.uid === card.uid);
          const isClickable = gameState?.pendingAction && activeConfig?.allowedZones.includes("hand");

          return (
            <div
              key={card.uid}
              className={`card ingame ${isSelected ? "selected-target" : ""} ${isClickable ? "clickable" : ""}`}
              style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}
              onClick={() => onSelectCard(card, "hand")}
            ></div>
          );
        })}
      </div>
      
      <h3>TU MANO ({myRoleName}) - Turno: {gameState.turn.toUpperCase()}</h3>
    </div>
  );
};
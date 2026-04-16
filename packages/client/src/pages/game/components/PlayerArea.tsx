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
  canDragCard: (card: CardState, position: CardPosition) => boolean;
  onDragCard: (card: CardState | null) => void;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  myRoleName,
  myPlayer,
  actionTargets,
  gameState,
  activeConfig,
  onSelectCard,
  canDragCard,
  onDragCard,
}) => {
  return (
    <div className="player-area">
      <div className="area-header area-header--player">
        <div><h3>{myRoleName === "king" ? "Mesa real" : "Mesa rebelde"}</h3></div>
      </div>

      <div className="area-board">
        <section className="zone-panel zone-panel--town">
          <div className="zone-panel-header">
            <span>Pueblo</span>
            <strong>{myPlayer.town.length}</strong>
          </div>
          <div className="town zone-cards">
            {myPlayer.town.map((card) => {
              const isSelected = actionTargets.some((t) => t.uid === card.uid);
              const isHiddenForRival = card.isRevealed === false;
              const isDraggable = canDragCard(card, "myTown");
              return (
                <div
                  key={card.uid}
                  className={`card ingame ${isHiddenForRival ? "hidden-style" : ""} ${isSelected ? "selected-target" : ""} ${isDraggable ? "draggable-card" : ""}`}
                  onClick={() => onSelectCard(card, "myTown")}
                  draggable={isDraggable}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", card.uid);
                    onDragCard({ ...card, position: "myTown" });
                  }}
                  onDragEnd={() => onDragCard(null)}
                >
                  <img className="card-face" src={`/cards/${card.templateId}.png`} alt="" draggable={false} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="zone-panel zone-panel--hand">
          <div className="zone-panel-header">
            <span>Mano</span>
            <strong>{myPlayer.hand.length}</strong>
          </div>
          <div className={`hand zone-cards ${gameState.turn !== myRoleName ? "waiting-turn" : ""}`}>
            {myPlayer.hand.map((card) => {
              const isSelected = actionTargets.some((t) => t.uid === card.uid);
              const isClickable = gameState?.pendingAction && activeConfig?.allowedZones.includes("hand");
              const isDraggable = canDragCard(card, "hand");

              return (
                <div
                  key={card.uid}
                  className={`card ingame ${isSelected ? "selected-target" : ""} ${isClickable ? "clickable" : ""} ${isDraggable ? "draggable-card" : ""}`}
                  onClick={() => onSelectCard(card, "hand")}
                  draggable={isDraggable}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", card.uid);
                    onDragCard({ ...card, position: "hand" });
                  }}
                  onDragEnd={() => onDragCard(null)}
                >
                  <img className="card-face" src={`/cards/${card.templateId}.png`} alt="" draggable={false} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
      
      <div className="area-footer">
        <span className={`turn-badge ${gameState.turn === myRoleName ? "turn-badge--active" : ""}`}>
          {gameState.turn === myRoleName ? "Tu turno" : `Turno de ${gameState.turn}`}
        </span>
      </div>
    </div>
  );
};

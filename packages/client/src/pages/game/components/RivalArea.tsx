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
  canDragCard: (card: CardState, position: CardPosition) => boolean;
  onDragCard: (card: CardState | null) => void;
}

export const RivalArea: React.FC<RivalAreaProps> = ({
  rivalRoleName,
  rivalPlayer,
  actionTargets,
  gameState,
  activeConfig,
  onSelectCard,
  canDragCard,
  onDragCard,
}) => {
  return (
    <div className="opponent-area">
      <div className="area-header area-header--rival">
        <div><h3>{rivalRoleName === "king" ? "Mesa real rival" : "Mesa rebelde rival"}</h3></div>
      </div>
      
      <div className="area-board">
        <section className="zone-panel zone-panel--town">
          <div className="zone-panel-header">
            <span>Pueblo enemigo</span>
            <strong>{rivalPlayer.town.length}</strong>
          </div>
          <div className="town zone-cards">
            {rivalPlayer.town.map((card) => {
              const isSelected = actionTargets.some((t) => t.uid === card.uid);
              const isClickable = gameState?.pendingAction && activeConfig?.allowedZones.includes("rivalTown");
              const isDraggable = canDragCard(card, "rivalTown");
              
              return card.isRevealed ? (
                <div
                  key={card.uid}
                  className={`card ingame ${isSelected ? "selected-target" : ""} ${isClickable ? "clickable" : ""} ${isDraggable ? "draggable-card" : ""}`}
                  onClick={() => onSelectCard(card, "rivalTown")}
                  draggable={isDraggable}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", card.uid);
                    onDragCard({ ...card, position: "rivalTown" });
                  }}
                  onDragEnd={() => onDragCard(null)}
                >
                  <img className="card-face" src={`/cards/${card.templateId}.png`} alt="" draggable={false} />
                </div>
              ) : (
                <div
                  key={card.uid}
                  className={`card ingame back ${isSelected ? "selected-target" : ""} ${isClickable ? "clickable" : ""} ${isDraggable ? "draggable-card" : ""}`}
                  onClick={() => onSelectCard(card, "rivalTown")}
                  draggable={isDraggable}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", card.uid);
                    onDragCard({ ...card, position: "rivalTown" });
                  }}
                  onDragEnd={() => onDragCard(null)}
                >
                  <img className="card-face" src="/cards/Back.png" alt="" draggable={false} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="zone-panel zone-panel--hand">
          <div className="zone-panel-header">
            <span>Mano enemiga</span>
            <strong>{rivalPlayer.hand.length}</strong>
          </div>
          <div className="hand zone-cards">
            {rivalPlayer.hand.map((card) => {
              const isSelected = actionTargets.some((t) => t.uid === card.uid);
              const isClickable = gameState?.pendingAction && activeConfig?.allowedZones.includes("rivalHand");
              
              return card.isRevealed ? (
                <div
                  key={card.uid}
                  className={`card ingame ${isSelected ? "selected-target" : ""} ${isClickable ? "clickable" : ""}`}
                  onClick={() => onSelectCard(card, "rivalHand")}
                >
                  <img className="card-face" src={`/cards/${card.templateId}.png`} alt="" draggable={false} />
                </div>
              ) : (
                <div
                  key={card.uid}
                  className="card ingame back"
                  onClick={() => onSelectCard(card, "rivalHand")}
                >
                  <img className="card-face" src="/cards/Back.png" alt="" draggable={false} />
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="area-footer">
        <span className="turn-badge">Presionando la frontera</span>
      </div>
    </div>
  );
};

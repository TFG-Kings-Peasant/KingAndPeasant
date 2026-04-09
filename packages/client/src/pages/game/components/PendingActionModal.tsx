import React from "react";
import type { GameState } from "./GameService";
import type { SelectedCard } from "./pendingActionsUI";

interface PendingActionModalProps {
  gameState: GameState;
  activeConfig: any;
  actionTargets: SelectedCard[];
  numberInput: number | null;
  setNumberInput: (val: number) => void;
  onConfirm: (payload: Record<string, unknown>) => void;
}

export const PendingActionModal: React.FC<PendingActionModalProps> = ({
  gameState,
  activeConfig,
  actionTargets,
  numberInput,
  setNumberInput,
  onConfirm,
}) => {
  return (
    <div className="pending-action-overlay">
      <div className="pending-action-content">
        <h2>⚔️ ¡Acción: {gameState.pendingAction?.type}!</h2>
        <p>{activeConfig.instructionText}</p>

        {gameState?.pendingAction?.type === "CHARLATAN" && (
          <div style={{ margin: "15px 0" }}>
            <label htmlFor="charlatan-input" style={{ marginRight: "10px" }}>
              Cartas a robar (1-3):
            </label>
            <input
              id="charlatan-input"
              type="number"
              min="1"
              max="3"
              value={numberInput || ""}
              onChange={(e) => setNumberInput(parseInt(e.target.value, 10))}
              style={{
                padding: "5px",
                width: "60px",
                textAlign: "center",
                borderRadius: "5px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        )}

        <button
          className="button ingame"
          style={{
            backgroundColor: activeConfig.canConfirm(
              actionTargets,
              gameState.pendingAction?.amount,
              numberInput || undefined
            )
              ? "#d4af37"
              : "#555",
          }}
          disabled={!activeConfig.canConfirm(
            actionTargets,
            gameState.pendingAction?.amount,
            numberInput || undefined
          )}
          onClick={() => {
            const payload = activeConfig.formatPayload(actionTargets, numberInput || undefined);
            onConfirm(payload);
          }}
        >
          Confirmar Acción
        </button>
      </div>
    </div>
  );
};
import React from 'react';
import type { CardState } from './GameService';

interface InfiltrateModalProps {
  card: CardState;
  deckCount: number;
  onSelectPosition: (position: number) => void;
  onCancel: () => void;
}

export const InfiltrateModal: React.FC<InfiltrateModalProps> = ({ card, deckCount, onSelectPosition, onCancel }) => {
  return (
    <div className="card-modal-overlay" onClick={onCancel}>
      <div className="infiltrate-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Infiltrar Carta</h2>
        <p>Haz clic en el hueco donde quieres introducir a tu infiltrado.</p>
        <p style={{fontSize: '0.8rem', color: '#aaa', marginBottom: '20px'}}>
          (Izquierda = Arriba del mazo, Derecha = Fondo del mazo)
        </p>
        
        <div className="infiltrate-deck-row">
          <div className="infiltrate-gap" onClick={() => onSelectPosition(deckCount)}></div>
          
          {Array.from({ length: deckCount }).map((_, i) => (
            <React.Fragment key={i}>
              <div className="card ingame back small"></div>
              
              <div className="infiltrate-gap" onClick={() => onSelectPosition(deckCount - (i + 1))}></div>
            </React.Fragment>
          ))}
        </div>

        <div className="infiltrate-target-card">
          <h3>Vas a infiltrar:</h3>
          <div 
            className="card ingame" 
            style={{ backgroundImage: `url('/cards/${card.templateId}.png')` }}
          ></div>
        </div>

        <button className="button ingame" style={{ marginTop: '20px', width: 'auto', padding: '10px 30px' }} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};
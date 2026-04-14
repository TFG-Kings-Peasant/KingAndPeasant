import React from "react";
import { Modal } from "../../../components/Modal";
import "../../../components/ParchmentMenu.css";
import "../Game.css";

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Continuar"
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="parchment-menu announcement-parchment-wrapper">
        <h2 className="announcement-title">{title}</h2>
        <div className="announcement-message">{message}</div>
        
        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '20px' }}>
          {onConfirm && (
            <button className="button ingame" onClick={onConfirm} style={{ flex: 1 }}>
              {confirmText}
            </button>
          )}
          <button 
            className="button ingame" 
            onClick={onClose} 
            style={{ flex: 1, backgroundColor: onConfirm ? '#8d6e63' : undefined }}
          >
            {onConfirm ? "CANCELAR" : "CERRAR"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
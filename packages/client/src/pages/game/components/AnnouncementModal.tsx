import React from "react";
import "../../../components/ParchmentMenu.css"; // Usamos tus estilos existentes
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
  confirmText = "CONTINUAR"
}) => {
  if (!isOpen) return null;

  return (
    <div className="announcement-overlay" onClick={onClose}>
      {/* Usamos la clase parchment-menu de tu proyecto + nuestra nueva clase para el marco */}
      <div 
        className="parchment-menu announcement-card-ornate" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="announcement-content-inner">
          <h2 className="announcement-title">{title}</h2>
          <p className="announcement-message">{message}</p>
          
          <div className="announcement-buttons-row">
            {onConfirm && (
              <button className="button ingame" onClick={onConfirm}>
                {confirmText}
              </button>
            )}
            <button 
              className="button ingame secondary" 
              onClick={onClose}
              style={{ backgroundColor: onConfirm ? '#8d6e63' : undefined }}
            >
              {onConfirm ? "CANCELAR" : "CERRAR"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
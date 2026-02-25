import type { ReactNode } from "react";
import { MenuButton } from "./MenuButton";


interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* stopPropagation evita que al hacer clic dentro del modal, este se cierre */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {title && <h3 className="modal-title">{title}</h3>}
                
                {children}
                
                <MenuButton onClick={onClose} style={{ marginTop: '1rem' }}>
                    Cerrar
                </MenuButton>
            </div>
        </div>
    );
};
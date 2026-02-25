import type { ReactNode } from "react";
import "./ParchmentMenu.css"; 

interface ParchmentCardProps {
    title?: string;
    children: ReactNode;
}

export const ParchmentCard = ({ title, children }: ParchmentCardProps) => {
    return (
        <div className="menu-container">
            <div className="menu-card">
                {title && <h2 className="menu-title">{title}</h2>}
                {children}
            </div>
        </div>
    );
};
import type { ReactNode } from "react";
import "./ParchmentMenu.css"; 

interface ParchmentCardProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
}

export const ParchmentCard = ({ title, subtitle, children }: ParchmentCardProps) => {
    return (
        <div className="page-shell page-shell--centered">
            <div className="page-content page-content--narrow">
            <div className="menu-card">
                {(title || subtitle) && (
                    <div className="menu-header">
                        {title && <h2 className="menu-title">{title}</h2>}
                        {subtitle && <p className="menu-subtitle">{subtitle}</p>}
                    </div>
                )}
                {children}
            </div>
            </div>
        </div>
    );
};

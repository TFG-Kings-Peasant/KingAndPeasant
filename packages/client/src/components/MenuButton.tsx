import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./ParchmentMenu.css";

interface MenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

export const MenuButton = ({ children, ...props }: MenuButtonProps) => {
    return (
        <button className="menu-button" {...props}>
            {children}
        </button>
    );
};
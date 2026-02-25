import type { InputHTMLAttributes } from "react";
import "./ParchmentMenu.css";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const FormInput = (props: FormInputProps) => {
    return (
        <input className="menu-input" {...props} />
    );
};
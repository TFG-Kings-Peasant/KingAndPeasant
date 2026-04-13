import React, { useEffect } from "react";

interface ErrorToastProps {
  error: string;
  onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose }) => {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  if (!error) return null;

  return (
    <div className="error-toast-container">
      {error}
      <button
        className="error-toast-close"
        onClick={onClose}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#aaaaaa")}
      >
        ✕
      </button>
    </div>
  );
};
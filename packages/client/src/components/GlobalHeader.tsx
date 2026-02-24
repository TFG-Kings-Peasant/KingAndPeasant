import { useNavigate, Link } from 'react-router-dom';
import './GlobalHeader.css';

export const GlobalHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="global-header">
      <button 
        className="header-btn back-btn" 
        onClick={() => navigate(-1)}
      >
        ⬅ Volver
      </button>

      <Link to="/" className="header-logo">
        King and Peasant
      </Link>

      <button 
        className="header-btn profile-btn" 
        onClick={() => navigate('/profile')}
      >
        Perfil 👤
      </button>
    </header>
  );
};
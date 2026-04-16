import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './GlobalHeader.css';

export const GlobalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, logout } = useAuth();
  const isGamePage = location.pathname.startsWith('/game/');

  const handleLogout = () => {
    if (logout) logout(); // Limpia el estado y el token
    navigate('/login'); // Redirige al usuario al login
  };

  return (
    <header className={`global-header ${isGamePage ? 'global-header--game' : ''}`}>
      <button 
        className="header-btn back-btn" 
        onClick={() => navigate(-1)}
      >
        ⬅ Volver
      </button>

      <Link to="/" className={`header-logo ${isGamePage ? 'header-logo--game' : ''}`}>
        {isGamePage ? 'K&P' : 'King and Peasant'}
      </Link>

      <div className="header-actions">
        {user ? (
          <>
          <button 
              className="header-btn logout-btn" 
            onClick={handleLogout}
          >
            Desconectar
          </button>
          <button 
            className="header-btn profile-btn" 
            onClick={() => navigate('/profile')}
          >
            Perfil 👤
          </button>
          </>
        ) : (
          <button 
            className="header-btn profile-btn" 
            onClick={() => navigate('/register')}
          >
            Registrarse 📝
          </button>
        )}
      </div>
    </header>
  );
};

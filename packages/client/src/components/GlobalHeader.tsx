import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './GlobalHeader.css';

export const GlobalHeader = () => {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (logout) logout(); // Limpia el estado y el token
    navigate('/login'); // Redirige al usuario al login
  };

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
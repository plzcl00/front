import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/Ediary.png';
import { useAuth } from '../auth/AuthContext';

export function MarketingHeader() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header>
      <Link to="/" className="logo-link">
        <img className="logo" src={logo} alt="E-Diary" />
      </Link>
      <div className="botones-encabezado">
        {isAuthenticated ? (
          <>
            <Link to="/app" className="btn-inicio-sesion">
              Mis moodboards
            </Link>
            <button type="button" className="btn-registro" onClick={() => void handleLogout()}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/sign-up" className="btn-registro">
              Registrarse
            </Link>
            <Link to="/sign-in" className="btn-inicio-sesion">
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

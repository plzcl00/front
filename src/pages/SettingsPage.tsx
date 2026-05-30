import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../auth/AuthContext';
import './SettingsPage.css';

export function SettingsPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppShell title="Ajustes">
      <div className="settings-page card card--elevated">
        <p className="settings-page-user">
          Sesión: <strong>{session?.username}</strong>
        </p>
        <p className="settings-page-hint">
          Opciones de cuenta y preferencias estarán disponibles próximamente.
        </p>
        <button
          type="button"
          className="btn-registro-form settings-page-logout"
          onClick={() => void handleLogout()}
        >
          Cerrar sesión
        </button>
        <Link to="/app" className="settings-page-back">
          Volver al panel
        </Link>
      </div>
    </AppShell>
  );
}

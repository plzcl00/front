import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../auth/AuthContext';
import { changePassword } from '../api/auth';
import './SettingsPage.css';

export function SettingsPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.username) {
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await changePassword(session.username, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus('Contraseña actualizada correctamente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Ajustes">
      <div className="settings-page card card--elevated">
        <p className="settings-page-user">
          Sesión: <strong>{session?.username}</strong>
        </p>

        <form className="settings-password-form form-container" onSubmit={(e) => void handlePasswordChange(e)}>
          <h2 className="settings-section-title">Cambiar contraseña</h2>
          <div className="form-group">
            <label htmlFor="current-password">Contraseña actual</label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {status && <p className="settings-page-status">{status}</p>}
          <button type="submit" className="btn-registro-form" disabled={busy}>
            Guardar contraseña
          </button>
        </form>

        <button
          type="button"
          className="btn-registro-form settings-page-logout"
          onClick={() => void handleLogout()}
        >
          Cerrar sesión
        </button>
      </div>
    </AppShell>
  );
}

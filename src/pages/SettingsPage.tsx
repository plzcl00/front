import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../auth/AuthContext';
import { useSession } from '../auth/useSession';
import { changePassword } from '../api/auth';
import './SettingsPage.css';

export function SettingsPage() {
  const { username } = useSession();
  const { logout } = useAuth();
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
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await changePassword(username, {
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
      <div className="settings-page">
        <div className="settings-page-sidebar">
          <section className="settings-section settings-section--account card card--elevated">
            <h2 className="settings-section-title">Cuenta</h2>
            <div className="settings-account-stat">
              <span className="settings-account-stat-label">Usuario</span>
              <span className="settings-account-stat-value">{username}</span>
            </div>
          </section>

          <section className="settings-section settings-section--session card card--elevated">
            <h2 className="settings-section-title settings-section-title--compact">Sesión</h2>
            <button
              type="button"
              className="settings-logout-btn"
              onClick={() => void handleLogout()}
            >
              Cerrar sesión
            </button>
          </section>
          <div className="settings-page-sidebar-spacer" aria-hidden="true" />
        </div>

        <section className="settings-section settings-section--security card card--elevated">
          <form className="settings-password-form" onSubmit={(e) => void handlePasswordChange(e)}>
            <h2 className="settings-section-title">Cambiar contraseña</h2>
            <div className="form-group">
              <label htmlFor="current-password">Contraseña actual</label>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">Nueva contraseña</label>
              <PasswordInput
                id="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
              <PasswordInput
                id="confirm-password"
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
        </section>
      </div>
    </AppShell>
  );
}

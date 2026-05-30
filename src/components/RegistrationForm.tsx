import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';

interface RegistrationFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  usernameId?: string;
  passwordId?: string;
  termsId?: string;
  footer?: ReactNode;
}

export function RegistrationForm({
  onSubmit,
  usernameId = 'register-username',
  passwordId = 'register-password',
  termsId = 'register-terms',
  footer,
}: RegistrationFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!terms) {
      setError('Debes aceptar los términos');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div className="form-group">
        <label htmlFor={usernameId}>Usuario</label>
        <input
          type="text"
          id={usernameId}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <p className="form-hint">Letras, números, guiones y guiones bajos.</p>
      </div>

      <div className="form-group">
        <label htmlFor={passwordId}>Contraseña</label>
        <input
          type="password"
          id={passwordId}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <p className="form-hint">Al menos 6 caracteres.</p>
      </div>

      <div className="form-group-checkbox">
        <input
          type="checkbox"
          id={termsId}
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
        />
        <label htmlFor={termsId}>
          Acepto los <Link to="/terminos">Términos de servicio</Link> y la{' '}
          <Link to="/privacidad">Política de privacidad</Link>
        </label>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" className="btn-registro-form" disabled={loading}>
        {loading ? 'Registrando…' : 'Registrarse'}
      </button>

      {footer}
    </form>
  );
}

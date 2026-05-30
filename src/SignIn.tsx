import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './SignIn.css';
import { MarketingHeader } from './components/MarketingHeader';
import { Footer } from './components/Footer';
import { useAuth } from './auth/AuthContext';
import { ApiError } from './api/client';

export function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? 'Usuario o contraseña incorrectos'
            : err.message,
        );
      } else {
        setError('No se pudo iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MarketingHeader />
      <div className="contenido-pagina contenido-pagina--auth contenido-pagina--sign-in">
        <div className="form-container card card--elevated">
          <h2>Accede a EDiary</h2>

          <form onSubmit={(e) => void handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <Link to="/reset-password" className="contrasenia-olvidada">
              ¿Olvidaste tu contraseña?
            </Link>

            <button type="submit" className="btn-registro-form" disabled={loading}>
              {loading ? 'Entrando…' : 'Iniciar sesión'}
            </button>

            <p>
              ¿No tienes una cuenta? <Link to="/sign-up">Regístrate.</Link>
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

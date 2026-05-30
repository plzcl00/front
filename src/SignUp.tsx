import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignUp.css';
import googleIcon from './assets/icons/google.svg';
import { MarketingHeader } from './components/MarketingHeader';
import { Footer } from './components/Footer';
import { useAuth } from './auth/AuthContext';
import { ApiError } from './api/client';

export function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

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
      await register(username, password);
      navigate('/app', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No se pudo registrar');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MarketingHeader />
      <div className="contenido-pagina contenido-pagina--auth contenido-pagina--sign-up">
        <div className="form-container card card--elevated">
          <h2>Bienvenido a EDiary</h2>
          <p>Descúbrete a ti mismo.</p>

          <button type="button" className="btn-google" disabled title="Próximamente">
            <img src={googleIcon} alt="" />
            Regístrate con Google
          </button>
          <p className="form-divider">o</p>

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
              <p className="form-hint">Letras, números, guiones y guiones bajos.</p>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
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
                id="terminos"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                required
              />
              <label htmlFor="terminos">
                Acepto los <a href="/terminos">Términos de servicio</a> y la{' '}
                <a href="/privacidad">Política de privacidad</a>
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn-registro-form" disabled={loading}>
              {loading ? 'Registrando…' : 'Registrarse'}
            </button>

            <p>
              ¿Ya tienes una cuenta? <Link to="/sign-in">Iniciar sesión.</Link>
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

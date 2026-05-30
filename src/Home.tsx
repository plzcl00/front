import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import imagenMuestra from './assets/processing.svg';
import logo from './assets/processing.svg';
import imagenDecoracion from './assets/processing.svg';
import { MarketingHeader } from './components/MarketingHeader';
import { useAuth } from './auth/AuthContext';
import { ApiError } from './api/client';

export function Home() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: FormEvent) => {
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
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MarketingHeader />

      <div className="contenido-pagina">
        <div className="bienvenida">
          <h1>Expresa tus emociones y explora.</h1>
          <p>Encuentra un lugar para tus pensamientos.</p>
          <div>
            <img className="imagen-muestra1" src={imagenMuestra} alt="imagen-muestra" />
          </div>
          <hr />
        </div>

        <div className="bienvenida">
          <h1>Escribe lo que sientes en tu diario.</h1>
          <p>
            Crea moodboards visuales con texto, formas e imágenes para representar tu
            estado de ánimo.
          </p>
          <div>
            <img className="imagen-muestra1" src={imagenMuestra} alt="imagen-muestra" />
          </div>
          <hr />
        </div>

        <div className="bienvenida">
          <h1>Comparte con quien quieras.</h1>
          <p>
            Controla la visibilidad, concede permisos y recibe me gusta en tus
            moodboards.
          </p>
          <div>
            <img className="imagen-muestra1" src={imagenMuestra} alt="imagen-muestra" />
          </div>
          <hr />
        </div>

        <div className="bienvenida2">
          <div className="sub-bienvenida1">
            <img className="imagen-muestra2" src={imagenMuestra} alt="" />
          </div>
          <div className="sub-bienvenida2">
            <h1>Empieza ahora</h1>
            <p>
              {isAuthenticated
                ? 'Ya has iniciado sesión. Ve a tus moodboards.'
                : 'Regístrate y crea tu primer moodboard.'}
            </p>
            {isAuthenticated && (
              <Link to="/app" className="btn-registro-form">
                Ir a mis moodboards
              </Link>
            )}
          </div>
        </div>

        {!isAuthenticated && (
          <div className="decoracion">
            <div className="form-container">
              <h2>Bienvenido a EDiary</h2>
              <p>Descúbrete a ti mismo.</p>

              <form onSubmit={(e) => void handleRegister(e)}>
                <div className="form-group">
                  <label htmlFor="home-username">Usuario</label>
                  <input
                    type="text"
                    id="home-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="home-password">Contraseña</label>
                  <input
                    type="password"
                    id="home-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group-checkbox">
                  <input
                    type="checkbox"
                    id="home-terminos"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    required
                  />
                  <label htmlFor="home-terminos">
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
            <img src={imagenDecoracion} alt="processing" />
          </div>
        )}
      </div>

      <footer>
        <img className="logo" src={logo} alt="logo" />
        <div className="footer-terminos">
          <p>Términos de uso</p>
          <p>Política de Privacidad</p>
          <p>Soporte</p>
          <p>Contacto</p>
        </div>
      </footer>
    </>
  );
}

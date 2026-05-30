import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import imagenMuestra from './assets/imagen-muestra.jpg';
import imagenDecoracion from './assets/processing.svg';
import iconCalendar from './assets/icons/calendar.svg';
import iconGraphics from './assets/icons/graphics.svg';
import { MarketingHeader } from './components/MarketingHeader';
import { Footer } from './components/Footer';
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

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
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
        <section className="bienvenida">
          <h1>Expresa tus emociones y explora.</h1>
          <p>Encuentra un lugar para tus pensamientos.</p>
          <div className="section-visual">
            <img className="imagen-muestra1" src={imagenMuestra} alt="Moodboards" />
          </div>
          <hr />
        </section>

        <section className="bienvenida">
          <h1>Escribe lo que sientes en tu diario.</h1>
          <p>
            Puedes representar sentimientos, tu estado de ánimo e ideas del día a día a
            través de anotaciones, gráficos y hasta vídeos.
          </p>
          <div className="section-visual">
            <img className="imagen-muestra1" src={imagenMuestra} alt="Diario" />
          </div>
          <hr />
        </section>

        <section className="bienvenida">
          <h1>Conócete a ti mismo.</h1>
          <p>
            Mediante quiz diarios, E-Diary genera métricas que te ayudarán a
            comprenderte y mejorar hábitos.
          </p>
          <div className="section-visual">
            <img className="imagen-muestra1" src={imagenMuestra} alt="Métricas" />
            <img className="section-icon" src={iconGraphics} alt="" />
          </div>
          <hr />
        </section>

        <section className="bienvenida">
          <h1>Organiza tu agenda.</h1>
          <p>
            Gestiona eventos a través de nuestro calendario. E-Diary te notificará de
            los próximos planes.
          </p>
          <div className="section-visual">
            <img className="imagen-muestra1" src={imagenMuestra} alt="Calendario" />
            <img className="section-icon" src={iconCalendar} alt="" />
          </div>
          <hr />
        </section>

        <section className="bienvenida2">
          <div className="sub-bienvenida1">
            <img className="imagen-muestra2" src={imagenMuestra} alt="" />
          </div>
          <div className="sub-bienvenida2">
            <h1>App para pc.</h1>
            <p>
              {isAuthenticated
                ? 'Ya has iniciado sesión. Ve a tus moodboards.'
                : 'Estamos trabajando para que tengas la mejor experiencia en cualquier dispositivo.'}
            </p>
            {isAuthenticated && (
              <Link to="/app" className="btn-registro-form">
                Ir a mis moodboards
              </Link>
            )}
          </div>
        </section>

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
                  <p className="form-hint">
                    Debe tener al menos 6 caracteres.
                  </p>
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
            <img src={imagenDecoracion} alt="" />
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

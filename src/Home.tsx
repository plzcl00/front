import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import sectionMoodboard from './assets/home/moodboardMuestra.png';
import sectionExplore from './assets/home/exploreMuestra.png';
import sectionDiary from './assets/home/metricsMuestra.png';
import sectionCalendar from './assets/home/calendarMuestra.png';
import sectionDevices from './assets/home/multidevice.jpg';
import sectionWelcome from './assets/home/processing.svg';
import { MarketingHeader } from './components/MarketingHeader';
import { Footer } from './components/Footer';
import { RegistrationForm } from './components/RegistrationForm';
import { useAuth } from './auth/AuthContext';

export function Home() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <MarketingHeader />

      <div className="contenido-pagina contenido-pagina--home">
        <section className="bienvenida">
          <h1>Crea moodboards visuales.</h1>
          <p>Organiza imágenes, texto y formas para expresar ideas y emociones.</p>
          <div className="section-visual">
            <img className="section-schematic" src={sectionMoodboard} alt="" />
          </div>
          <hr />
        </section>

        <section className="bienvenida">
          <h1>Comparte y explora.</h1>
          <p>
            Publica tus moodboards, descubre los de otros usuarios y guarda tus
            favoritos.
          </p>
          <div className="section-visual">
            <img className="section-schematic" src={sectionExplore} alt="" />
          </div>
          <hr />
        </section>

        <section className="bienvenida">
          <h1>Conócete a ti mismo.</h1>
          <p>
            Registra tu estado de ánimo cada día en el diario y consulta tus
            métricas para comprenderte mejor.
          </p>
          <div className="section-visual">
            <img className="section-schematic" src={sectionDiary} alt="" />
          </div>
          {isAuthenticated && (
            <div className="home-feature-links">
              <Link to="/app/diario" className="btn-registro-form">
                Ir al diario
              </Link>
              <Link to="/app/metricas" className="btn-inicio-sesion">
                Ver métricas
              </Link>
            </div>
          )}
          <hr />
        </section>

        <section className="bienvenida">
          <h1>Organiza tu agenda.</h1>
          <p>Añade recordatorios a tus entradas del diario desde el calendario.</p>
          <div className="section-visual">
            <img className="section-schematic" src={sectionCalendar} alt="" />
          </div>
          <hr />
        </section>

        <section className="bienvenida2">
          <div className="sub-bienvenida1">
            <img className="section-schematic section-schematic--devices" src={sectionDevices} alt="" />
          </div>
          <div className="sub-bienvenida2">
            <h1>Tu diario visual, en cualquier dispositivo.</h1>
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

              <RegistrationForm
                usernameId="home-username"
                passwordId="home-password"
                termsId="home-terminos"
                onSubmit={async (username, password) => {
                  await register(username, password);
                  navigate('/app/explorar', { replace: true });
                }}
                footer={
                  <p>
                    ¿Ya tienes una cuenta? <Link to="/sign-in">Iniciar sesión.</Link>
                  </p>
                }
              />
            </div>
            <img className="section-schematic section-schematic--welcome" src={sectionWelcome} alt="" />
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

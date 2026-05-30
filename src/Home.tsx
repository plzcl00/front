import { Link, useNavigate } from 'react-router-dom';
import './Home.css';
import imagenMuestra from './assets/imagen-muestra.jpg';
import imagenDecoracion from './assets/processing.svg';
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

      <div className="contenido-pagina">
        <section className="bienvenida">
          <h1>Crea moodboards visuales.</h1>
          <p>Organiza imágenes, texto y formas para expresar ideas y emociones.</p>
          <div className="section-visual">
            <img className="imagen-muestra1" src={imagenMuestra} alt="Moodboards" />
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
            <img className="imagen-muestra1" src={imagenMuestra} alt="Explorar" />
          </div>
          <hr />
        </section>

        <section className="bienvenida">
          <h1>Conócete a ti mismo.</h1>
          <p>
            Próximamente: quiz diarios y métricas para comprenderte mejor.
          </p>
          <div className="section-visual">
            <img className="imagen-muestra1" src={imagenMuestra} alt="Métricas" />
          </div>
          <hr />
        </section>

        <section className="bienvenida">
          <h1>Organiza tu agenda.</h1>
          <p>Próximamente: calendario y recordatorios integrados.</p>
          <div className="section-visual">
            <img className="imagen-muestra1" src={imagenMuestra} alt="Calendario" />
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

              <RegistrationForm
                usernameId="home-username"
                passwordId="home-password"
                termsId="home-terminos"
                onSubmit={async (username, password) => {
                  await register(username, password);
                  navigate('/app', { replace: true });
                }}
                footer={
                  <p>
                    ¿Ya tienes una cuenta? <Link to="/sign-in">Iniciar sesión.</Link>
                  </p>
                }
              />
            </div>
            <img src={imagenDecoracion} alt="" />
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

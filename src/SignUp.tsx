import { Link, useNavigate } from 'react-router-dom';
import './SignUp.css';
import googleIcon from './assets/icons/google.svg';
import { MarketingHeader } from './components/MarketingHeader';
import { Footer } from './components/Footer';
import { RegistrationForm } from './components/RegistrationForm';
import { useAuth } from './auth/AuthContext';

export function SignUp() {
  const { register } = useAuth();
  const navigate = useNavigate();

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

          <RegistrationForm
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
      </div>
      <Footer />
    </>
  );
}

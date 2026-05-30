import { Link } from 'react-router-dom';
import { MarketingHeader } from './components/MarketingHeader';
import { Footer } from './components/Footer';
import './ResetPassword.css';

export function ResetPassword() {
  return (
    <>
      <MarketingHeader />
      <div className="contenido-pagina contenido-pagina--auth">
        <div className="form-container card card--elevated">
          <h2>Reestablecer contraseña</h2>
          <p>Próximamente.</p>

          <form action="#" method="POST">
            <div className="form-group">
              <label htmlFor="reset-email">Correo electrónico</label>
              <input type="email" id="reset-email" name="email" disabled />
            </div>

            <button type="submit" className="btn-registro-form" disabled>
              Restablecer contraseña
            </button>

            <p>
              Volver al <Link to="/sign-in">inicio de sesión</Link>.
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

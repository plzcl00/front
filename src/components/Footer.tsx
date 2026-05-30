import { Link } from 'react-router-dom';
import logo from '../assets/Ediary.png';

export function Footer() {
  return (
    <footer>
      <Link to="/">
        <img className="logo" src={logo} alt="E-Diary" />
      </Link>
      <div className="footer-terminos">
        <Link to="/terminos">Términos de uso</Link>
        <Link to="/privacidad">Política de privacidad</Link>
        <span>Soporte</span>
        <span>Contacto</span>
      </div>
    </footer>
  );
}

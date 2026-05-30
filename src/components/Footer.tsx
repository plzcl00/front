import { Link } from 'react-router-dom';
import logo from '../assets/Ediary.png';

export function Footer() {
  return (
    <footer>
      <Link to="/">
        <img className="logo" src={logo} alt="E-Diary" />
      </Link>
      <div className="footer-terminos">
        <p>Términos de uso</p>
        <p>Política de Privacidad</p>
        <p>Soporte</p>
        <p>Contacto</p>
      </div>
    </footer>
  );
}

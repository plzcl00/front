//Enlace, Link componente de Router
import { Link } from 'react-router-dom';
//Importaciones del logo
import logo from '../assets/Ediary.png';
//Hook personalizado que da acceso al contexto de autenticación
import { useAuth } from '../auth/AuthContext';

//COMPONENTE HEADER DE Home, si el usuario ha iniciado sesion
//cambia su contenido
export function MarketingHeader() {
  //RENDERIZADO
  return (
    //Encabezado
    <header>
      {/**Imagen normal */}
      <img className="logo" src={logo} alt="E-Diary" />

      {/**Botones de registro e iniciar sesion que te llevan a las paginas
       * de SignUp y SignIn respectivamente
       */}
      <div className="botones-encabezado">
        <Link to="/sign-up" className="btn-registro">
          Registrarse
        </Link>
        <Link to="/sign-in" className="btn-inicio-sesion">
          Iniciar sesión
        </Link>
      </div>
    </header>
  );
}

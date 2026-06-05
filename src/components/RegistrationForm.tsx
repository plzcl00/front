import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
//Importamos funciones que nos reportan de algun error a la hora de registrar a un user
import { ApiError } from '../api/client';
//Reutlizamos el componente contraseña
import { PasswordInput } from './PasswordInput';

interface RegistrationFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  usernameId?: string;
  passwordId?: string;
  termsId?: string;
  footer?: ReactNode;
}

//COMPONENTE - FORMULARIO DE REGISTRO REUTILIZABLE (En SignUp por ej)
//Va a pedir un nombre de usuario, una contraseña, te obliga a aceptar terminos
//Integra un footer tambn como un textico
export function RegistrationForm({
  onSubmit,
  usernameId = 'register-username',
  passwordId = 'register-password',
  termsId = 'register-terms',
  footer,
}: RegistrationFormProps) {

  //Guarda lo escrito por el usuario, inicialmente vacio por defecto
  const [username, setUsername] = useState('');
  //Guarda la contraseña
  const [password, setPassword] = useState('');
  //Indica si acepto los terminos
  const [terms, setTerms] = useState(false);
  //Para mostrar los errores
  const [error, setError] = useState<string | null>(null);
  //Indica si el registro esta en proceso
  const [loading, setLoading] = useState(false);

  //Se ejecuta al enviar el formulario
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    //Evita que el navegador recargue la pagina
    e.preventDefault();
    //Comprueba si has aceptado los terminos, si no lo has hecho el formulario no se envia
    if (!terms) {
      setError('Debes aceptar los términos');
      return;
    }
    //Limpiamos reseteando su valor
    setError(null);
    //El formulario se esta enviando
    setLoading(true);
    try {
      //LLama a la funcion del padre y pasa el usuario y la contraseña por parametro
      //Si todo sale bien el usuario se crea
      //La llamada al back puede fallar si el usuario ya existe o sucede algun error en el servidor
      await onSubmit(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar');
    } finally {
      //Ya se ha enviado el formu, asi que vuelve a su estado
      setLoading(false);
    }
  };

  //RENDERIZADO
  return (
    //Formulario
    <form onSubmit={(e) => void handleSubmit(e)}>
      {/**Campo usuario */}
      <div className="form-group">
        <label htmlFor={usernameId}>Usuario</label>
        <input
          type="text"
          id={usernameId}
          autoComplete="username"
          value={username}
          //Se actualiza el valor del user
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <p className="form-hint">Letras, números, guiones y guiones bajos.</p>
      </div>

      {/**Campo contraseña */}
      <div className="form-group">
        <label htmlFor={passwordId}>Contraseña</label>
        <PasswordInput
          id={passwordId}
          autoComplete="new-password"
          value={password}
          //Se actualiza el valor de la contraseña, la cual debe tener al menos 6 caracteres
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <p className="form-hint">Al menos 6 caracteres.</p>
      </div>

      {/**Checkbox, required te obliga a darle o a rellenarlo en el caso de un campo */}
      <div className="form-group-checkbox">
        <input
          type="checkbox"
          id={termsId}
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
        />
        <label htmlFor={termsId}>
          Acepto los <Link to="/terminos">Términos de servicio</Link> y la{' '}
          <Link to="/privacidad">Política de privacidad</Link>
        </label>
      </div>

      {/**Si no aceptas los terminos, da error, se dispara la alerta */}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {/**button de tipo submit para enviar el formulario */}
      <button type="submit" className="btn-registro-form" disabled={loading}>
        {loading ? 'Registrando…' : 'Registrarse'}
      </button>

      {footer}
    </form>
  );
}

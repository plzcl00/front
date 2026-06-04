//Input.. es un tipo que contiene todas las propiedades validad de un elemento input
import { useState, type InputHTMLAttributes } from 'react';
import iconVisibility from '../assets/icons/MdOutlineVisibility.svg';
import iconVisibilityOff from '../assets/icons/MdOutlineVisibilityOff.svg';
import './PasswordInput.css';

//TIPO DE LAS PROPS
//Omit coge todas las props normales del input excepto type
type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

//COMPONENTE - CAMPO DE LA CONTRASEÑA CON BOTON PARA MOSTRARLA U OCULTARLA
export function PasswordInput(props: PasswordInputProps) {
  //Para controlar el estado de la contraseña, visible o invisible, inicialmente invisible
  const [visible, setVisible] = useState(false);

  //RENDERIZACION
  return (
    <div className="password-input">
      {/**Spread de las propiedades (copia todas las propiedades recibida)
       * Si visible es true, la contraseña se ve, si no es oculta
       */}
      <input {...props} type={visible ? 'text' : 'password'} />
      {/**Boton de mostrar y ocultar contraseña */}
      <button
        type="button"
        className="password-input__toggle"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        //El evento se desencadenara al hacer click
        onClick={() => setVisible((current) => !current)}
      >
        {/**El icono del boton tambn cambia en funcion de si la contraseña se muestra visible o no */}
        <img src={visible ? iconVisibilityOff : iconVisibility} alt="" draggable={false} />
      </button>
    </div>
  );
}

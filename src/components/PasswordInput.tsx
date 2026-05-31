import { useState, type InputHTMLAttributes } from 'react';
import iconVisibility from '../assets/icons/MdOutlineVisibility.svg';
import iconVisibilityOff from '../assets/icons/MdOutlineVisibilityOff.svg';
import './PasswordInput.css';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-input__toggle"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <img src={visible ? iconVisibilityOff : iconVisibility} alt="" draggable={false} />
      </button>
    </div>
  );
}

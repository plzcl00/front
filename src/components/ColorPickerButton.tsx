import { useEffect, useId, useRef, useState } from 'react';
import './ColorPickerButton.css';

//Lista de colores predefinidos, paleta
const PRESET_COLORS = [
  '#ffffff',
  '#f5f5f5',
  '#222222',
  '#666666',
  '#fa8095',
  '#f58b24',
  '#f0c85b',
  '#1d636b',
  '#4a90d9',
  '#e8f4fc',
  '#333333',
  '#000000',
  '#ffcdd2',
  '#ffe0b2',
  '#fff9c4',
  '#c8e6c9',
  '#b2ebf2',
  '#d1c4e9',
  '#f8bbd0',
  '#ef5350',
  '#ff9800',
  '#ffeb3b',
  '#66bb6a',
  '#26c6da',
  '#7e57c2',
  '#ec407a',
];

//Valida un colorHex. Osea tienes que si RGB, en css puedes elegir hasta la opacidad etc
//Pero el formato elegido es Hex, asi que hay que validar el string el cual debe ir precedido
// de una almohadilla, sin espacios, que la cadena sean solo letras y numeros (con un total de 6 caracteres) 
// y convertirlo a minusculas
//Usamos expresiones regulares (Regex)
function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) {
    return null;
  }
  return `#${match[1].toLowerCase()}`;
}

//Propiedades del componente
interface ColorPickerButtonProps {
  label: string;
  //Color actual
  value: string;
  disabled?: boolean;
  //Funcion que avisa al padre cuando cambia de color
  onChange: (color: string) => void;
}

{/**COMPONENTE SELECTOR DE COLOR DEL MOODBOARD */}
//Desestructuracion de las propiedades del tipo interface
export function ColorPickerButton({
  label,
  value,
  disabled = false,
  onChange,
}: ColorPickerButtonProps) {

  //Controla si el panel esta abierto o cerrado, en principio cerrado
  const [open, setOpen] = useState(false);
  //Valor temporal del input Hex, osea no cambia al color real hasta confirmar
  const [hexDraft, setHexDraft] = useState(value);
  //Sirve para detectar clicks fuera, si haces un click fuera se cierra la paleta
  const rootRef = useRef<HTMLDivElement>(null);
  //Sirve para generar un id unico automaticamente
  //useId es un metodo de React interno que te devuelve un id unico tipo: :r3:... y asi
  const listboxId = useId();

  //El usuario puede escribir el color a mano, y no elegir uno de los colores predeterminados
  //Por eso es necesario controlar el valor real del color (padre) y el valor temporal que aun no es el real y es el que escribe
  //el usuario. El input se actualiza gracias al setHexDraft y su envoltura en el useEffect
  useEffect(() => {
    setHexDraft(value);
  }, [value]);


  //Este efecto solo se activa cuando esta abierto, si no te regresa y no hace nada
  useEffect(() => {
    if (!open) {
      return;
    }

    //Si haces click fuera del componente se cierra
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    //Si haces esc en el teclado se cierra
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    //Escucha todos los clicks del documento no solo los de dentro del componente
    document.addEventListener('mousedown', handlePointerDown);
    //Lo mismo con las teclas
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      //Limpieza
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  //Informa del nuevo color real(padre, onChange)
  //Actualiza el input, el color "temporal"
  const applyColor = (color: string) => {
    onChange(color);
    setHexDraft(color);
  };

  //Valida el texto del input a traves de la funcion normalizeHex
  const commitHexDraft = () => {
    const normalized = normalizeHex(hexDraft);
    //Pasamos el color normalizado devuelto por normalizeHex
    //Para actualizarlo el input y aplicarlo con la funcion applyColor
    //Si no es valido vuelve al color anterior que estaba y ya
    if (normalized) {
      applyColor(normalized);
      return;
    }
    setHexDraft(value);
  };

  //RENDERIZADO
  return (
    //Contenedor principal rootRef es el elemento paleta por asi decirlo el panel de los colores solo si esta abierto
    <div className="color-picker" ref={rootRef}>
      {/**El boton para abrir el desplegable */}
      <button
        type="button"
        className="color-picker-trigger"
        disabled={disabled}
        //Indica que se abre una lista
        aria-haspopup="listbox"
        //Indica si esta abierta
        aria-expanded={open}
        //Relaciona el boton con el panel
        aria-controls={listboxId}
        //Si clicamos se abre
        onClick={() => setOpen((current) => !current)}
      >
        {/**Cuadrito con el color actual y con texto informativo del color */}
        <span className="color-picker-swatch" style={{ backgroundColor: value }} aria-hidden />
        <span className="color-picker-label">{label}</span>
      </button>

      {/**Solo si esta abierto aparece el panel flotante */}
      {open && !disabled && (
        //Popover = panel flotante
        <div className="color-picker-popover card" id={listboxId} role="listbox" aria-label={label}>
          {/**Los colores predefinidos genera una lista de botones por cada elemento del array de colores
           * y si clicas el color se actualiza
           */}
          <div className="color-picker-swatches">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="option"
                //Si es seleccionado se marca
                aria-selected={color === value}
                className={`color-picker-option${color === value ? ' color-picker-option--selected' : ''}`}
                style={{ backgroundColor: color }}
                title={color}
                onClick={() => {
                  applyColor(color);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <label className="color-picker-hex-label">
            Hex
            {/**Input manual por el que introduces un color por teclado */}
            <input
              type="text"
              className="color-picker-hex-input"
              value={hexDraft}
              spellCheck={false}
              maxLength={7}
              placeholder="#000000"
              //Mientras escribes guarda el texto temporalmente
              onChange={(event) => setHexDraft(event.target.value)}
              //Si haces click fuera intenta validar y aplicarel color
              onBlur={commitHexDraft}
              //Al presionar Enter evita comportamiento por defecto, aplica el color y normaliza el string
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitHexDraft();
                  const normalized = normalizeHex(hexDraft);
                  if (normalized) {
                    //Si es valido cierra el panel
                    setOpen(false);
                  }
                }
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

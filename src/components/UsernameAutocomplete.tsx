//Hooks de React
//useRef  permite acceder a elementos HTML
//useEffect ejecuta codigo cuando cambian valores
//useMemo memoriza calculos
//useCallback memoriza funciones
//useId como hemos comentado otras veces, genera id automaticamente
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  //tipo para eventos del teclado
  type KeyboardEvent,
} from 'react';
//Funcion que consulta usuarios en el backend
import { searchUsers } from '../api/users';
import './UsernameAutocomplete.css';

interface UsernameAutocompleteProps {
  id?: string;
  //Texto actual
  value: string;
  //Cuando cambia el texto, avisa al padre
  onChange: (value: string) => void;
  //Informa si el usuario existe
  onValidUserChange: (isValid: boolean) => void;
  //Lista de usuarios que no deben aparecer
  exclude?: string[];
  //Deshabilita el campo
  disabled?: boolean;
  //Texto mostrado cuando esta vacio
  placeholder?: string;
}

//COMPONENTE que implementa el autocompletado de nombres de usuario
//Mientras el usuario escribe un nombre, se hacen busquedas en el servidor y se muestran sugerencias
export function UsernameAutocomplete({
  id,
  value,
  onChange,
  onValidUserChange,
  exclude = [],
  disabled = false,
  placeholder = 'nombre_usuario',
}: UsernameAutocompleteProps) {
  const listId = useId();
  //Para detectar click fuera
  const containerRef = useRef<HTMLDivElement>(null);
  //Usuarios sugeridos tipo lista
  const [suggestions, setSuggestions] = useState<string[]>([]);
  //Controla si el menu esta abierto o cerrado
  const [open, setOpen] = useState(false);
  //Indice de la sugerencia seleccionada
  const [activeIndex, setActiveIndex] = useState(-1);
  //Indica si esta buscando
  const [loading, setLoading] = useState(false);

  //La lista de usuarios excluidos la recorre y la almacena en un Set porque buscar es mas rapido
  const excluded = useMemo(
    () => new Set(exclude.map((name) => name.toLowerCase())),
    [exclude],
  );

  //Filtra usuarios prohibidos
  //Recorre la lista de usuarios y si ese usuario esta en la lista de excluidos no se muestra
  const filterSuggestions = useCallback(
    (usernames: string[]) =>
      usernames.filter((username) => !excluded.has(username.toLowerCase())),
    [excluded],
  );

  //Comprueba si el texto coincide exactamente con algun usuario
  const updateValidity = useCallback(
    (nextValue: string, nextSuggestions: string[]) => {
      const trimmed = nextValue.trim().toLowerCase();
      const isValid =
        trimmed.length > 0 &&
        nextSuggestions.some(
          (username) => username.toLowerCase() === trimmed,
        );
      onValidUserChange(isValid);
    },
    [onValidUserChange],
  );

  //Se ejecuta cada vez que cambia el valor
  useEffect(() => {
    const trimmed = value.trim();
    //Si el usuario esta vacio se marca como invalido
    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      onValidUserChange(false);
      return;
    }

    //Espera 250ms antes de ejecutarse, esto evita hacer varias peticiones seguidad
    //mientras se escribe rollo, p, pe, pet, pete, peter
    //Espera a que el usuario termine de escribir
    const timer = window.setTimeout(() => {
      setLoading(true);
      //Pasa la lista de users por la funcion y elimina los usuarios excluidos
      void searchUsers(trimmed)
        .then((results) => {
          const filtered = filterSuggestions(results);
          //Se actualiza la lista de sugerencias
          setSuggestions(filtered);
          //Abre el menu si hay resultados
          setOpen(filtered.length > 0);
          //Ninguna opcion seleccionada
          setActiveIndex(-1);
          //Comprueba si existe el usuario
          updateValidity(value, filtered);
        })
        .catch(() => {
          setSuggestions([]);
          setOpen(false);
          onValidUserChange(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 250);

    return () => {
      //Si el usuario sigue escribiendo, cancela la busqueda anterior
      window.clearTimeout(timer);
    };
  }, [value, filterSuggestions, onValidUserChange, updateValidity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    //Detecta los clicks fuera, si haces uno la lista se cierra
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  //Cuando eliges una sugerencia, actualiza el input
  const selectSuggestion = (username: string) => {
    onChange(username);
    //Marca el usuario como valido
    onValidUserChange(true);
    //Cierra el menu
    setOpen(false);
    setActiveIndex(-1);
  };

  //Navegacion con teclado para pasar a las opciones
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      return;
    }

    //Flecha abajo
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    //Flecha arriba
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
      return;
    }

    //Enter
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    //ESC cierra la lista
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  //RENDERIZACION
  return (
    <div className="username-autocomplete" ref={containerRef}>
      <input
        id={id}
        type="text"
        //Indica que es un campo con sugerencias
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {/**La lista de opciones solo se muestra cuando esta abierta, open = true */}
      {open && (
        <ul id={listId} className="username-autocomplete-list" role="listbox">
          {suggestions.map((username, index) => (
            <li
              key={username}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={
                index === activeIndex
                  ? 'username-autocomplete-option is-active'
                  : 'username-autocomplete-option'
              }
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(username);
              }}
            >
              {username}
            </li>
          ))}
        </ul>
      )}
      {loading && value.trim() && (
        <span className="username-autocomplete-status">Buscando…</span>
      )}
    </div>
  );
}

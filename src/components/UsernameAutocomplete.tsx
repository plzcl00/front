import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { searchUsers } from '../api/users';
import './UsernameAutocomplete.css';

interface UsernameAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onValidUserChange: (isValid: boolean) => void;
  exclude?: string[];
  disabled?: boolean;
  placeholder?: string;
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const excluded = useMemo(
    () => new Set(exclude.map((name) => name.toLowerCase())),
    [exclude],
  );

  const filterSuggestions = useCallback(
    (usernames: string[]) =>
      usernames.filter((username) => !excluded.has(username.toLowerCase())),
    [excluded],
  );

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

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      onValidUserChange(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      void searchUsers(trimmed)
        .then((results) => {
          const filtered = filterSuggestions(results);
          setSuggestions(filtered);
          setOpen(filtered.length > 0);
          setActiveIndex(-1);
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectSuggestion = (username: string) => {
    onChange(username);
    onValidUserChange(true);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="username-autocomplete" ref={containerRef}>
      <input
        id={id}
        type="text"
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

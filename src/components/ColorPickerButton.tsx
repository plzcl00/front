import { useEffect, useId, useRef, useState } from 'react';
import './ColorPickerButton.css';

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

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) {
    return null;
  }
  return `#${match[1].toLowerCase()}`;
}

interface ColorPickerButtonProps {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (color: string) => void;
}

export function ColorPickerButton({
  label,
  value,
  disabled = false,
  onChange,
}: ColorPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const applyColor = (color: string) => {
    onChange(color);
    setHexDraft(color);
  };

  const commitHexDraft = () => {
    const normalized = normalizeHex(hexDraft);
    if (normalized) {
      applyColor(normalized);
      return;
    }
    setHexDraft(value);
  };

  return (
    <div className="color-picker" ref={rootRef}>
      <button
        type="button"
        className="color-picker-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="color-picker-swatch" style={{ backgroundColor: value }} aria-hidden />
        <span className="color-picker-label">{label}</span>
      </button>

      {open && !disabled && (
        <div className="color-picker-popover card" id={listboxId} role="listbox" aria-label={label}>
          <div className="color-picker-swatches">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                role="option"
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
            <input
              type="text"
              className="color-picker-hex-input"
              value={hexDraft}
              spellCheck={false}
              maxLength={7}
              placeholder="#000000"
              onChange={(event) => setHexDraft(event.target.value)}
              onBlur={commitHexDraft}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitHexDraft();
                  const normalized = normalizeHex(hexDraft);
                  if (normalized) {
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../auth/useSession';
import {
  deleteDiaryEntry,
  getDiaryEntry,
  listDiaryEntries,
  upsertDiaryEntry,
} from '../api/diary';
import { createMoodboard } from '../api/moodboards';
import { createEmptyMoodboardContent } from '../lib/moodboardContent';
import type { DiaryEntry } from '../types/api';
import { AppShell } from '../components/AppShell';
import './DiarioPage.css';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MOOD_LABELS = ['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien'];

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function DiarioPage() {
  const { username } = useSession();
  const navigate = useNavigate();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(formatIsoDate(today.getFullYear(), today.getMonth(), today.getDate()));
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [moodScore, setMoodScore] = useState(3);
  const [textNote, setTextNote] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [linkedMoodboardId, setLinkedMoodboardId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const monthRange = useMemo(() => {
    const last = new Date(viewYear, viewMonth + 1, 0);
    return {
      from: formatIsoDate(viewYear, viewMonth, 1),
      to: formatIsoDate(viewYear, viewMonth, last.getDate()),
      daysInMonth: last.getDate(),
      startWeekday: (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7,
    };
  }, [viewYear, viewMonth]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, DiaryEntry>();
    for (const entry of entries) {
      map.set(entry.entryDate, entry);
    }
    return map;
  }, [entries]);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listDiaryEntries(username, monthRange.from, monthRange.to);
      setEntries(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las entradas');
    } finally {
      setLoading(false);
    }
  }, [username, monthRange.from, monthRange.to]);

  const loadSelectedDay = useCallback(async () => {
    try {
      const entry = await getDiaryEntry(username, selectedDate);
      if (entry) {
        setMoodScore(entry.moodScore);
        setTextNote(entry.textNote ?? '');
        setReminderAt(toDatetimeLocalValue(entry.reminderAt));
        setLinkedMoodboardId(entry.linkedMoodboardId ?? null);
      } else {
        setMoodScore(3);
        setTextNote('');
        setReminderAt('');
        setLinkedMoodboardId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la entrada');
    }
  }, [username, selectedDate]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    void loadSelectedDay();
  }, [loadSelectedDay]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const saved = await upsertDiaryEntry(username, {
        entryDate: selectedDate,
        moodScore,
        textNote: textNote.trim() || null,
        linkedMoodboardId,
        reminderAt: fromDatetimeLocalValue(reminderAt),
      });
      setLinkedMoodboardId(saved.linkedMoodboardId ?? null);
      setStatus('Entrada guardada');
      await loadMonth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteDiaryEntry(username, selectedDate);
      setTextNote('');
      setReminderAt('');
      setLinkedMoodboardId(null);
      setMoodScore(3);
      setStatus('Entrada eliminada');
      await loadMonth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenMoodboard = async () => {
    if (linkedMoodboardId) {
      navigate(`/app/moodboards/${linkedMoodboardId}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createMoodboard(username, createEmptyMoodboardContent());
      const saved = await upsertDiaryEntry(username, {
        entryDate: selectedDate,
        moodScore,
        textNote: textNote.trim() || null,
        linkedMoodboardId: created.id,
        reminderAt: fromDatetimeLocalValue(reminderAt),
      });
      setLinkedMoodboardId(saved.linkedMoodboardId ?? created.id);
      navigate(`/app/moodboards/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el moodboard');
      setBusy(false);
    }
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const todayIso = formatIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: monthRange.startWeekday }, () => null),
    ...Array.from({ length: monthRange.daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <AppShell title="Diario">
      <div className="diario-page">
        <section className="diario-calendar card card--elevated">
          <div className="diario-calendar-header">
            <button type="button" className="diario-nav-btn" onClick={handlePrevMonth} aria-label="Mes anterior">
              ‹
            </button>
            <h2 className="diario-month-label">{monthLabel}</h2>
            <button type="button" className="diario-nav-btn" onClick={handleNextMonth} aria-label="Mes siguiente">
              ›
            </button>
          </div>

          <div className="diario-weekdays">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="diario-grid">
            {calendarCells.map((day, index) => {
              if (day === null) {
                return <span key={`empty-${index}`} className="diario-day diario-day--empty" />;
              }
              const iso = formatIsoDate(viewYear, viewMonth, day);
              const entry = entriesByDate.get(iso);
              const isSelected = iso === selectedDate;
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  className={`diario-day ${isSelected ? 'diario-day--selected' : ''} ${isToday ? 'diario-day--today' : ''}`}
                  onClick={() => setSelectedDate(iso)}
                >
                  <span>{day}</span>
                  {entry && (
                    <span className="diario-day-dots">
                      <span className="diario-dot diario-dot--entry" title="Entrada" />
                      {entry.reminderAt && (
                        <span className="diario-dot diario-dot--reminder" title="Recordatorio" />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {loading && <p className="diario-status">Cargando calendario…</p>}
        </section>

        <section className="diario-detail card card--elevated">
          <h2 className="diario-detail-title">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h2>

          <fieldset className="diario-mood">
            <legend>¿Cómo te sientes?</legend>
            <div className="diario-mood-options">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  className={`diario-mood-btn ${moodScore === score ? 'is-active' : ''}`}
                  onClick={() => setMoodScore(score)}
                  title={MOOD_LABELS[score - 1]}
                >
                  {score}
                </button>
              ))}
            </div>
            <p className="diario-mood-label">{MOOD_LABELS[moodScore - 1]}</p>
          </fieldset>

          <div className="form-group">
            <label htmlFor="diario-note">Nota del día</label>
            <textarea
              id="diario-note"
              className="diario-textarea"
              rows={5}
              value={textNote}
              onChange={(e) => setTextNote(e.target.value)}
              placeholder="Escribe cómo ha ido tu día…"
            />
          </div>

          <div className="form-group">
            <label htmlFor="diario-reminder">Recordatorio (opcional)</label>
            <input
              id="diario-reminder"
              type="datetime-local"
              value={reminderAt}
              onChange={(e) => setReminderAt(e.target.value)}
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {status && <p className="diario-status">{status}</p>}

          <div className="diario-actions">
            <button
              type="button"
              className="btn-registro-form"
              disabled={busy}
              onClick={() => void handleSave()}
            >
              Guardar entrada
            </button>
            <button
              type="button"
              className="diario-secondary-btn"
              disabled={busy}
              onClick={() => void handleOpenMoodboard()}
            >
              {linkedMoodboardId ? 'Abrir moodboard' : 'Crear moodboard de hoy'}
            </button>
            {entriesByDate.has(selectedDate) && (
              <button
                type="button"
                className="diario-danger-btn"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                Eliminar entrada
              </button>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

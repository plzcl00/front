import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../auth/useSession';
import { getMoodboard, renameMoodboard, updateMoodboard, uploadThumbnail } from '../api/moodboards';
import type { Moodboard, MoodboardContent } from '../types/api';
import { FabricMoodboardEditor } from '../fabric/FabricMoodboardEditor';
import { AppShell } from '../components/AppShell';
import { MoodboardSharingPanel } from '../components/MoodboardSharingPanel';
import { moodboardDisplayName } from '../lib/moodboardDisplay';
import './MoodboardEditorPage.css';

export function MoodboardEditorPage() {
  const { id } = useParams<{ id: string }>();
  const moodboardId = Number(id);
  const { username } = useSession();
  const navigate = useNavigate();

  const [board, setBoard] = useState<Moodboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [thumbnailWarning, setThumbnailWarning] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const saveCanvasRef = useRef<(() => Promise<MoodboardContent>) | null>(null);
  const exportThumbnailRef = useRef<(() => Promise<Blob>) | null>(null);

  const load = useCallback(async () => {
    if (Number.isNaN(moodboardId)) {
      setError('Moodboard no válido');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMoodboard(username, moodboardId);
      setBoard(data);
      setDraftName(data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el moodboard');
    } finally {
      setLoading(false);
    }
  }, [username, moodboardId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePersist = useCallback(
    async (content: MoodboardContent) => {
      if (!board) return;
      await updateMoodboard(username, board.id, content);
    },
    [board, username],
  );

  const handleSave = async () => {
    if (!saveCanvasRef.current || !board) return;
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setError('El nombre del moodboard no puede estar vacío');
      return;
    }
    setSaving(true);
    setError(null);
    setThumbnailWarning(null);
    try {
      if (trimmedName !== board.name.trim()) {
        await renameMoodboard(username, board.id, trimmedName);
      }
      await saveCanvasRef.current();
      if (exportThumbnailRef.current) {
        try {
          const thumbnail = await exportThumbnailRef.current();
          await uploadThumbnail(username, board.id, thumbnail);
        } catch (thumbErr) {
          setThumbnailWarning(
            thumbErr instanceof Error
              ? thumbErr.message
              : 'No se pudo subir la miniatura',
          );
          setSaving(false);
          return;
        }
      }
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Editor">
        <p className="editor-page-status">Cargando moodboard…</p>
      </AppShell>
    );
  }

  if (error && !board) {
    return (
      <AppShell title="Editor">
        <p className="editor-page-error">{error}</p>
        <Link to="/app" className="editor-page-link">
          Volver al panel
        </Link>
      </AppShell>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <AppShell title={moodboardDisplayName(board)}>
      <div className="editor-page">
        <div className="editor-page-toolbar card">
          <label className="editor-page-name-label">
            Nombre
            <input
              type="text"
              className="editor-page-name-input"
              value={draftName}
              maxLength={100}
              disabled={saving}
              onChange={(e) => setDraftName(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn-registro-form editor-page-save"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <Link to="/app" className="editor-page-link">
            Volver
          </Link>
        </div>
        {error && (
          <p className="editor-page-error" role="alert">
            {error}
          </p>
        )}
        {thumbnailWarning && (
          <p className="editor-page-error" role="alert">
            {thumbnailWarning}
          </p>
        )}

        <div className="editor-page-layout">
          <div className="editor-page-canvas card card--elevated">
            <FabricMoodboardEditor
              ownerUsername={board.ownerUsername}
              moodboardId={board.id}
              initialContent={board.content}
              saveRef={saveCanvasRef}
              exportThumbnailRef={exportThumbnailRef}
              onPersist={handlePersist}
            />
          </div>
          <MoodboardSharingPanel
            moodboard={board}
            isOwner
            onMoodboardUpdate={setBoard}
          />
        </div>
      </div>
    </AppShell>
  );
}

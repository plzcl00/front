import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMoodboard, updateMoodboard } from '../api/moodboards';
import type { Moodboard, MoodboardContent } from '../types/api';
import { FabricMoodboardEditor } from '../fabric/FabricMoodboardEditor';
import { AppShell } from '../components/AppShell';
import { MoodboardSharingPanel } from '../components/MoodboardSharingPanel';
import './MoodboardEditorPage.css';

export function MoodboardEditorPage() {
  const { id } = useParams<{ id: string }>();
  const moodboardId = Number(id);
  const { session } = useAuth();
  const username = session!.username;
  const navigate = useNavigate();

  const [board, setBoard] = useState<Moodboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveCanvasRef = useRef<(() => Promise<MoodboardContent>) | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el moodboard');
    } finally {
      setLoading(false);
    }
  }, [username, moodboardId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveAll = async () => {
    if (!board || !saveCanvasRef.current) return;
    setSaving(true);
    setError(null);
    try {
      const content = await saveCanvasRef.current();
      await updateMoodboard(username, board.id, content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handlePersist = async (content: MoodboardContent) => {
    if (!board) return;
    await updateMoodboard(username, board.id, content);
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
    <AppShell title={`Moodboard #${board.id}`}>
      <div className="editor-page">
        <div className="editor-page-toolbar card">
          <button
            type="button"
            className="btn-registro-form editor-page-save"
            disabled={saving}
            onClick={() => void handleSaveAll()}
          >
            {saving ? 'Guardando…' : 'Guardar en servidor'}
          </button>
          <Link to="/app" className="editor-page-link">
            Volver
          </Link>
          <button
            type="button"
            className="editor-page-btn-secondary"
            onClick={() => navigate(`/u/${board.ownerUsername}/moodboards/${board.id}`)}
          >
            Vista previa
          </button>
        </div>
        {error && <p className="editor-page-error">{error}</p>}

        <div className="editor-page-layout">
          <div className="editor-page-canvas card card--elevated">
            <FabricMoodboardEditor
              ownerUsername={board.ownerUsername}
              moodboardId={board.id}
              initialContent={board.content}
              saveRef={saveCanvasRef}
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

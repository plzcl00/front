import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMoodboard, updateMoodboard } from '../api/moodboards';
import type { Moodboard, MoodboardContent } from '../types/api';
import { FabricMoodboardEditor } from '../fabric/FabricMoodboardEditor';
import { MarketingHeader } from '../components/MarketingHeader';
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
      const updated = await updateMoodboard(username, board.id, content);
      setBoard(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <MarketingHeader />
        <p className="editor-page-status">Cargando moodboard…</p>
      </>
    );
  }

  if (error && !board) {
    return (
      <>
        <MarketingHeader />
        <p className="editor-page-error">{error}</p>
        <Link to="/app">Volver al panel</Link>
      </>
    );
  }

  if (!board) {
    return null;
  }

  return (
    <>
      <MarketingHeader />
      <div className="editor-page contenido-pagina">
        <div className="editor-page-header">
          <h1>Moodboard #{board.id}</h1>
          <div className="editor-page-actions">
            <button
              type="button"
              className="btn-registro-form"
              disabled={saving}
              onClick={() => void handleSaveAll()}
            >
              {saving ? 'Guardando…' : 'Guardar en servidor'}
            </button>
            <Link to="/app">Volver</Link>
            <button
              type="button"
              onClick={() => navigate(`/u/${board.ownerUsername}/moodboards/${board.id}`)}
            >
              Vista previa
            </button>
          </div>
        </div>
        {error && <p className="editor-page-error">{error}</p>}

        <div className="editor-page-layout">
          <FabricMoodboardEditor
            ownerUsername={board.ownerUsername}
            moodboardId={board.id}
            initialContent={board.content}
            saveRef={saveCanvasRef}
          />
          <MoodboardSharingPanel
            moodboard={board}
            isOwner
            onMoodboardUpdate={setBoard}
          />
        </div>
      </div>
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMoodboard } from '../api/moodboards';
import type { Moodboard } from '../types/api';
import { moodboardDisplayName } from '../lib/moodboardDisplay';
import { FabricMoodboardEditor } from '../fabric/FabricMoodboardEditor';
import { AppShell } from '../components/AppShell';
import { MoodboardSharingPanel } from '../components/MoodboardSharingPanel';
import './MoodboardEditorPage.css';

export function MoodboardViewPage() {
  const { username: ownerUsername, id } = useParams<{
    username: string;
    id: string;
  }>();
  const moodboardId = Number(id);
  const { session } = useAuth();
  const currentUser = session!.username;
  const isOwner = ownerUsername === currentUser;

  const [board, setBoard] = useState<Moodboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ownerUsername || Number.isNaN(moodboardId)) {
      setError('Enlace no válido');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMoodboard(ownerUsername, moodboardId);
      setBoard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el moodboard');
    } finally {
      setLoading(false);
    }
  }, [ownerUsername, moodboardId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <AppShell title="Moodboard">
        <p className="editor-page-status">Cargando…</p>
      </AppShell>
    );
  }

  if (error || !board || !ownerUsername) {
    return (
      <AppShell title="Moodboard">
        <p className="editor-page-error">{error ?? 'No encontrado'}</p>
        <Link to="/app" className="editor-page-link">
          Volver
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${board.ownerUsername} · ${moodboardDisplayName(board)}`}>
      <div className="editor-page">
        <div className="editor-page-toolbar card">
          {isOwner && (
            <Link to={`/app/moodboards/${board.id}`} className="btn-registro-form editor-page-save">
              Editar
            </Link>
          )}
          <Link to="/app" className="editor-page-link">
            Volver
          </Link>
        </div>

        <div className="editor-page-layout">
          <div className="editor-page-canvas card card--elevated">
            <FabricMoodboardEditor
              ownerUsername={board.ownerUsername}
              moodboardId={board.id}
              initialContent={board.content}
              readOnly
            />
          </div>
          <MoodboardSharingPanel
            moodboard={board}
            isOwner={isOwner}
            onMoodboardUpdate={setBoard}
          />
        </div>
      </div>
    </AppShell>
  );
}

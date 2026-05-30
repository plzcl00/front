import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMoodboard } from '../api/moodboards';
import type { Moodboard } from '../types/api';
import { FabricMoodboardEditor } from '../fabric/FabricMoodboardEditor';
import { MarketingHeader } from '../components/MarketingHeader';
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
      <>
        <MarketingHeader />
        <p className="editor-page-status">Cargando…</p>
      </>
    );
  }

  if (error || !board || !ownerUsername) {
    return (
      <>
        <MarketingHeader />
        <p className="editor-page-error">{error ?? 'No encontrado'}</p>
        <Link to="/app">Volver</Link>
      </>
    );
  }

  return (
    <>
      <MarketingHeader />
      <div className="editor-page contenido-pagina">
        <div className="editor-page-header">
          <h1>
            Moodboard de {board.ownerUsername} #{board.id}
          </h1>
          {isOwner && (
            <Link to={`/app/moodboards/${board.id}`}>Editar</Link>
          )}
        </div>

        <div className="editor-page-layout">
          <FabricMoodboardEditor
            ownerUsername={board.ownerUsername}
            moodboardId={board.id}
            initialContent={board.content}
            readOnly
          />
          <MoodboardSharingPanel
            moodboard={board}
            isOwner={isOwner}
            onMoodboardUpdate={setBoard}
          />
        </div>
      </div>
    </>
  );
}

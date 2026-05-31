import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMoodboard } from '../api/moodboards';
import type { Moodboard } from '../types/api';
import { moodboardDisplayName } from '../lib/moodboardDisplay';
import { downloadBlob, sanitizeFilename } from '../lib/downloadBlob';
import { FabricMoodboardEditor } from '../fabric/FabricMoodboardEditor';
import { AppShell } from '../components/AppShell';
import { MoodboardSharingPanel } from '../components/MoodboardSharingPanel';
import { useOptionalSession } from '../auth/useSession';
import './MoodboardEditorPage.css';

export function MoodboardViewPage() {
  const { username: ownerUsername, id } = useParams<{
    username: string;
    id: string;
  }>();
  const moodboardId = Number(id);
  const { session, isAuthenticated } = useOptionalSession();
  const currentUser = session?.username ?? '';
  const isOwner = isAuthenticated && ownerUsername === currentUser;

  const [board, setBoard] = useState<Moodboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const exportImageRef = useRef<(() => Promise<Blob>) | null>(null);

  const load = useCallback(async () => {
    if (!ownerUsername || Number.isNaN(moodboardId)) {
      setError('Enlace no válido');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMoodboard(ownerUsername, moodboardId, {
        auth: isAuthenticated,
      });
      setBoard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el moodboard');
    } finally {
      setLoading(false);
    }
  }, [ownerUsername, moodboardId, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDownload = async () => {
    if (!exportImageRef.current || !board) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await exportImageRef.current();
      const filename = `${sanitizeFilename(moodboardDisplayName(board))}.png`;
      downloadBlob(blob, filename);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'No se pudo descargar la imagen');
    } finally {
      setDownloading(false);
    }
  };

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
        <p className="editor-page-error" role="alert">
          {error ?? 'No encontrado'}
        </p>
        <Link to={isAuthenticated ? '/app' : '/sign-in'} className="editor-page-link">
          {isAuthenticated ? 'Volver' : 'Iniciar sesión'}
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${board.ownerUsername} · ${moodboardDisplayName(board)}`}>
      <div className="editor-page">
        <div className="editor-page-toolbar card">
          <button
            type="button"
            className="editor-page-btn-secondary"
            disabled={downloading}
            onClick={() => void handleDownload()}
          >
            {downloading ? 'Descargando…' : 'Descargar imagen'}
          </button>
          {isOwner && (
            <Link to={`/app/moodboards/${board.id}`} className="btn-registro-form editor-page-save">
              Editar
            </Link>
          )}
          {!isAuthenticated && (
            <Link to="/sign-in" className="btn-registro-form editor-page-save">
              Iniciar sesión
            </Link>
          )}
        </div>
        {downloadError && (
          <p className="editor-page-error" role="alert">
            {downloadError}
          </p>
        )}

        <div className="editor-page-layout">
          <div className="editor-page-canvas card card--elevated">
            <FabricMoodboardEditor
              ownerUsername={board.ownerUsername}
              moodboardId={board.id}
              initialContent={board.content}
              readOnly
              publicAccess={!isAuthenticated}
              exportImageRef={exportImageRef}
            />
          </div>
          {isAuthenticated && (
            <MoodboardSharingPanel
              moodboard={board}
              isOwner={isOwner}
              onMoodboardUpdate={setBoard}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

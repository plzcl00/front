import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  createMoodboard,
  deleteMoodboard,
  getLikedMoodboardIds,
  getLikeCount,
  listMoodboards,
  setVisibility,
} from '../api/moodboards';
import { createEmptyMoodboardContent } from '../lib/moodboardContent';
import type { Moodboard } from '../types/api';
import { MarketingHeader } from '../components/MarketingHeader';
import './Dashboard.css';

export function Dashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const username = session!.username;

  const [boards, setBoards] = useState<Moodboard[]>([]);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, liked] = await Promise.all([
        listMoodboards(username),
        getLikedMoodboardIds(username),
      ]);
      setBoards(list);
      setLikedIds(liked);

      const counts: Record<number, number> = {};
      await Promise.all(
        list.map(async (b) => {
          try {
            counts[b.id] = await getLikeCount(username, b.id);
          } catch {
            counts[b.id] = 0;
          }
        }),
      );
      setLikeCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los moodboards');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await createMoodboard(username, createEmptyMoodboardContent());
      navigate(`/app/moodboards/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el moodboard');
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este moodboard?')) return;
    setBusy(true);
    try {
      await deleteMoodboard(username, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePublic = async (board: Moodboard) => {
    setBusy(true);
    try {
      await setVisibility(username, board.id, !board.isPublic);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar visibilidad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <MarketingHeader />
      <div className="dashboard contenido-pagina">
        <div className="dashboard-main">
          <h1>Mis moodboards</h1>
          <button
            type="button"
            className="btn-registro-form"
            disabled={busy}
            onClick={() => void handleCreate()}
          >
            Nuevo moodboard
          </button>

          {loading && <p>Cargando…</p>}
          {error && <p className="dashboard-error">{error}</p>}

          <div className="dashboard-grid">
            {boards.map((board) => (
              <article key={board.id} className="dashboard-card">
                <h2>Moodboard #{board.id}</h2>
                <p>{board.isPublic ? 'Público' : 'Privado'}</p>
                <p>Me gusta: {likeCounts[board.id] ?? '—'}</p>
                <div className="dashboard-card-actions">
                  <Link to={`/app/moodboards/${board.id}`}>Editar</Link>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleTogglePublic(board)}
                  >
                    {board.isPublic ? 'Privado' : 'Público'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleDelete(board.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!loading && boards.length === 0 && (
            <p>Aún no tienes moodboards. Crea el primero.</p>
          )}
        </div>

        <aside className="dashboard-sidebar">
          <h2>Mis favoritos</h2>
          {likedIds.length === 0 ? (
            <p>No has marcado moodboards con me gusta.</p>
          ) : (
            <ul>
              {likedIds.map((id) => (
                <li key={id}>Moodboard #{id}</li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}

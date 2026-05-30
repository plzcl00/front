import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/useSession';
import {
  createMoodboard,
  deleteMoodboard,
  getLikedMoodboards,
  listMoodboards,
  setVisibility,
} from '../api/moodboards';
import { getDiaryEntry } from '../api/diary';
import { createEmptyMoodboardContent } from '../lib/moodboardContent';
import { moodboardDisplayName } from '../lib/moodboardDisplay';
import type { LikedMoodboardSummary, Moodboard } from '../types/api';
import { AppShell } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { matchesMoodboardSearch, useSearch } from '../search/SearchContext';
import { MoodboardCardThumbnail } from '../components/MoodboardCardThumbnail';
import { FeedCardThumbnail } from '../components/FeedCardThumbnail';
import { MoodboardLikeButton } from '../components/MoodboardLikeButton';
import './Dashboard.css';
import './ExplorePage.css';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function Dashboard() {
  const { username } = useSession();
  const navigate = useNavigate();
  const { query } = useSearch();

  const [boards, setBoards] = useState<Moodboard[]>([]);
  const [likedBoards, setLikedBoards] = useState<LikedMoodboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [todayDiaryFilled, setTodayDiaryFilled] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, liked, todayEntry] = await Promise.all([
        listMoodboards(username),
        getLikedMoodboards(username),
        getDiaryEntry(username, todayIso()),
      ]);
      setBoards(list);
      setLikedBoards(liked);
      setTodayDiaryFilled(todayEntry !== null);
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
    setBusy(true);
    try {
      await deleteMoodboard(username, id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setBusy(false);
    }
  };

  const filteredBoards = boards.filter((board) => matchesMoodboardSearch(board, query));
  const filteredLikedBoards = likedBoards.filter((board) =>
    matchesMoodboardSearch(board, query),
  );
  const hasSearch = query.trim().length > 0;

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

  const handleFavoriteLikeChange = (
    board: LikedMoodboardSummary,
    next: { liked: boolean; likeCount: number },
  ) => {
    if (!next.liked) {
      setLikedBoards((prev) =>
        prev.filter(
          (item) => !(item.ownerUsername === board.ownerUsername && item.id === board.id),
        ),
      );
      return;
    }

    setLikedBoards((prev) =>
      prev.map((item) =>
        item.ownerUsername === board.ownerUsername && item.id === board.id
          ? { ...item, likeCount: next.likeCount }
          : item,
      ),
    );
  };

  return (
    <AppShell title="Mis moodboards">
      <div className="dashboard">
        <div className="dashboard-main card card--elevated">
          <div className="dashboard-header">
            <button
              type="button"
              className="btn-registro dashboard-new-btn"
              disabled={busy}
              onClick={() => void handleCreate()}
            >
              Nuevo moodboard
            </button>
          </div>

          {loading && <p className="dashboard-status">Cargando…</p>}
          {error && (
            <p className="dashboard-error" role="alert">
              {error}
            </p>
          )}

          <div className="dashboard-grid">
            {filteredBoards.map((board, index) => (
              <article
                key={board.id}
                className={`dashboard-card ${index % 3 === 1 ? 'dashboard-card--tall' : ''}`}
              >
                <Link
                  to={`/app/moodboards/${board.id}`}
                  className="dashboard-card-link"
                >
                  <MoodboardCardThumbnail
                    ownerUsername={board.ownerUsername}
                    moodboardId={board.id}
                    hasThumbnail={board.hasThumbnail}
                    content={board.content}
                  />
                  <div className="dashboard-card-body">
                    <h2>{moodboardDisplayName(board)}</h2>
                    <span className={`pill-badge ${board.isPublic ? 'pill-badge--public' : ''}`}>
                      {board.isPublic ? 'Público' : 'Privado'}
                    </span>
                    <p className="dashboard-card-likes">Me gusta: {board.likeCount ?? 0}</p>
                  </div>
                </Link>
                <div className="dashboard-card-actions">
                  <button
                    type="button"
                    className="dashboard-card-btn"
                    disabled={busy}
                    onClick={() => void handleTogglePublic(board)}
                  >
                    {board.isPublic ? 'Privado' : 'Público'}
                  </button>
                  <button
                    type="button"
                    className="dashboard-card-btn dashboard-card-btn--danger"
                    disabled={busy}
                    onClick={() => setDeleteTarget(board.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!loading && boards.length === 0 && (
            <p className="dashboard-empty">Aún no tienes moodboards. Crea el primero.</p>
          )}
          {!loading && boards.length > 0 && filteredBoards.length === 0 && hasSearch && (
            <p className="dashboard-empty">Ningún moodboard coincide con tu búsqueda.</p>
          )}
        </div>

        <aside className="dashboard-sidebar card card--elevated">
          <h2 className="dashboard-sidebar-title">Entrada de hoy</h2>
          {todayDiaryFilled === null ? (
            <p className="dashboard-sidebar-empty">Comprobando diario…</p>
          ) : todayDiaryFilled ? (
            <p className="dashboard-diary-status dashboard-diary-status--done">
              Ya has escrito en tu diario hoy.
            </p>
          ) : (
            <p className="dashboard-diary-status">
              Aún no has registrado cómo te sientes hoy.
            </p>
          )}
          <Link to="/app/diario" className="dashboard-diary-link">
            {todayDiaryFilled ? 'Ver diario' : 'Escribir en el diario'}
          </Link>

          <h2 className="dashboard-sidebar-title dashboard-sidebar-title--spaced">Mis favoritos</h2>
          {likedBoards.length === 0 ? (
            <p className="dashboard-sidebar-empty">No has marcado moodboards con me gusta.</p>
          ) : filteredLikedBoards.length === 0 && hasSearch ? (
            <p className="dashboard-sidebar-empty">Ningún favorito coincide con tu búsqueda.</p>
          ) : (
            <div className="dashboard-favorites-grid">
              {filteredLikedBoards.map((liked) => (
                <article
                  key={`${liked.ownerUsername}-${liked.id}`}
                  className="dashboard-card dashboard-card--sidebar"
                >
                  <Link
                    to={`/u/${liked.ownerUsername}/moodboards/${liked.id}`}
                    className="dashboard-card-link"
                  >
                    <FeedCardThumbnail
                      ownerUsername={liked.ownerUsername}
                      moodboardId={liked.id}
                      hasThumbnail={liked.hasThumbnail}
                    />
                    <div className="dashboard-card-body">
                      <p className="explore-card-owner">@{liked.ownerUsername}</p>
                      <h2>{moodboardDisplayName(liked)}</h2>
                    </div>
                  </Link>
                  {liked.ownerUsername !== username && (
                    <div className="explore-card-footer explore-card-footer--sidebar">
                      <MoodboardLikeButton
                        ownerUsername={liked.ownerUsername}
                        moodboardId={liked.id}
                        liked
                        likeCount={liked.likeCount ?? 0}
                        onChange={(next) => handleFavoriteLikeChange(liked, next)}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar moodboard"
        message="¿Eliminar este moodboard? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget !== null) {
            void handleDelete(deleteTarget);
          }
        }}
      />
    </AppShell>
  );
}

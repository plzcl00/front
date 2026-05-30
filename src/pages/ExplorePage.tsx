import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLikedMoodboards, listPublicMoodboards } from '../api/moodboards';
import { useSession } from '../auth/useSession';
import { AppShell } from '../components/AppShell';
import { FeedCardThumbnail } from '../components/FeedCardThumbnail';
import { MoodboardLikeButton } from '../components/MoodboardLikeButton';
import { moodboardDisplayName } from '../lib/moodboardDisplay';
import { matchesMoodboardSearch, useSearch } from '../search/SearchContext';
import type { PublicMoodboardFeedItem } from '../types/api';
import './Dashboard.css';
import './ExplorePage.css';

const PAGE_SIZE = 24;

function likedBoardKey(ownerUsername: string, moodboardId: number): string {
  return `${ownerUsername}-${moodboardId}`;
}

export function ExplorePage() {
  const { username } = useSession();
  const { query } = useSearch();
  const [items, setItems] = useState<PublicMoodboardFeedItem[]>([]);
  const [likedKeys, setLikedKeys] = useState<Set<string>>(() => new Set());
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (pageIndex: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await listPublicMoodboards(pageIndex, PAGE_SIZE);
      setPage(result.page);
      setHasNext(result.hasNext);
      setTotalItems(result.totalItems);
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

  useEffect(() => {
    void getLikedMoodboards(username)
      .then((liked) => {
        setLikedKeys(
          new Set(liked.map((board) => likedBoardKey(board.ownerUsername, board.id))),
        );
      })
      .catch(() => {
        setLikedKeys(new Set());
      });
  }, [username]);

  const handleLikeChange = (
    board: PublicMoodboardFeedItem,
    next: { liked: boolean; likeCount: number },
  ) => {
    const key = likedBoardKey(board.ownerUsername, board.id);
    setLikedKeys((prev) => {
      const updated = new Set(prev);
      if (next.liked) {
        updated.add(key);
      } else {
        updated.delete(key);
      }
      return updated;
    });
    setItems((prev) =>
      prev.map((item) =>
        item.ownerUsername === board.ownerUsername && item.id === board.id
          ? { ...item, likeCount: next.likeCount }
          : item,
      ),
    );
  };

  const handleLoadMore = () => {
    if (!hasNext || loadingMore) {
      return;
    }
    void loadPage(page + 1, true);
  };

  const filteredItems = items.filter((board) => matchesMoodboardSearch(board, query));
  const hasSearch = query.trim().length > 0;

  return (
    <AppShell title="Explorar">
      <div className="explore-page card card--elevated">
        {loading && <p className="explore-page-status">Cargando…</p>}
        {error && (
          <p className="explore-page-error" role="alert">
            {error}
          </p>
        )}

        {!loading && items.length === 0 && !error && (
          <p className="explore-page-empty">
            Todavía no hay moodboards públicos de otros usuarios.
          </p>
        )}

        {!loading && items.length > 0 && filteredItems.length === 0 && hasSearch && (
          <p className="explore-page-empty">Ningún moodboard coincide con tu búsqueda.</p>
        )}

        <div className="dashboard-grid">
          {filteredItems.map((board, index) => (
            <article
              key={`${board.ownerUsername}-${board.id}`}
              className={`dashboard-card ${index % 3 === 1 ? 'dashboard-card--tall' : ''}`}
            >
              <Link
                to={`/u/${board.ownerUsername}/moodboards/${board.id}`}
                className="dashboard-card-link"
              >
                <FeedCardThumbnail
                  ownerUsername={board.ownerUsername}
                  moodboardId={board.id}
                  hasThumbnail={board.hasThumbnail}
                />
                <div className="dashboard-card-body">
                  <p className="explore-card-owner">@{board.ownerUsername}</p>
                  <h2>{moodboardDisplayName(board)}</h2>
                  <span className="pill-badge pill-badge--public">Público</span>
                </div>
              </Link>
              {board.ownerUsername !== username && (
                <div className="explore-card-footer">
                  <MoodboardLikeButton
                    ownerUsername={board.ownerUsername}
                    moodboardId={board.id}
                    liked={likedKeys.has(likedBoardKey(board.ownerUsername, board.id))}
                    likeCount={board.likeCount ?? 0}
                    onChange={(next) => handleLikeChange(board, next)}
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        {!loading && items.length > 0 && (
          <div className="explore-page-footer">
            <p className="explore-page-count">
              Mostrando {items.length} de {totalItems}
            </p>
            {hasNext && (
              <button
                type="button"
                className="btn-registro explore-page-load-more"
                disabled={loadingMore}
                onClick={handleLoadMore}
              >
                {loadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

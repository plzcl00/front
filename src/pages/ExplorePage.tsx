import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLikeCount, listPublicMoodboards } from '../api/moodboards';
import { AppShell } from '../components/AppShell';
import { FeedCardThumbnail } from '../components/FeedCardThumbnail';
import { moodboardDisplayName } from '../lib/moodboardDisplay';
import { matchesMoodboardSearch, useSearch } from '../search/SearchContext';
import type { PublicMoodboardFeedItem } from '../types/api';
import './Dashboard.css';
import './ExplorePage.css';

const PAGE_SIZE = 24;

export function ExplorePage() {
  const { query } = useSearch();
  const [items, setItems] = useState<PublicMoodboardFeedItem[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLikeCounts = useCallback(async (boards: PublicMoodboardFeedItem[]) => {
    const counts: Record<number, number> = {};
    await Promise.all(
      boards.map(async (board) => {
        try {
          counts[board.id] = await getLikeCount(board.ownerUsername, board.id);
        } catch {
          counts[board.id] = 0;
        }
      }),
    );
    setLikeCounts((prev) => ({ ...prev, ...counts }));
  }, []);

  const loadPage = useCallback(
    async (pageIndex: number, append: boolean) => {
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
        void loadLikeCounts(result.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el feed');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [loadLikeCounts],
  );

  useEffect(() => {
    void loadPage(0, false);
  }, [loadPage]);

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
        {error && <p className="explore-page-error">{error}</p>}

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
                  <p className="dashboard-card-likes">
                    Me gusta: {likeCounts[board.id] ?? 0}
                  </p>
                </div>
              </Link>
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

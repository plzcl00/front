import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getLikedMoodboards } from '../api/moodboards';
import { moodboardDisplayName } from '../lib/moodboardDisplay';
import type { LikedMoodboardSummary } from '../types/api';
import { AppShell } from '../components/AppShell';
import { FeedCardThumbnail } from '../components/FeedCardThumbnail';
import { MoodboardLikeButton } from '../components/MoodboardLikeButton';
import { matchesMoodboardSearch, useSearch } from '../search/SearchContext';
import './Dashboard.css';
import './ExplorePage.css';
import './FavoritesPage.css';

export function FavoritesPage() {
  const { session } = useAuth();
  const username = session!.username;
  const { query } = useSearch();
  const [likedBoards, setLikedBoards] = useState<LikedMoodboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const liked = await getLikedMoodboards(username);
      setLikedBoards(liked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los favoritos');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredLikedBoards = likedBoards.filter((board) =>
    matchesMoodboardSearch(board, query),
  );
  const hasSearch = query.trim().length > 0;

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
    <AppShell title="Mis favoritos">
      <div className="favorites-page card card--elevated">
        {loading && <p>Cargando…</p>}
        {error && <p className="favorites-page-error">{error}</p>}
        {!loading && likedBoards.length === 0 && (
          <p>No has marcado moodboards con me gusta todavía.</p>
        )}
        {!loading && likedBoards.length > 0 && filteredLikedBoards.length === 0 && hasSearch && (
          <p>Ningún favorito coincide con tu búsqueda.</p>
        )}

        <div className="dashboard-grid">
          {filteredLikedBoards.map((board, index) => (
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
                </div>
              </Link>
              {board.ownerUsername !== username && (
                <div className="explore-card-footer">
                  <MoodboardLikeButton
                    ownerUsername={board.ownerUsername}
                    moodboardId={board.id}
                    liked
                    likeCount={board.likeCount ?? 0}
                    onChange={(next) => handleFavoriteLikeChange(board, next)}
                  />
                </div>
              )}
            </article>
          ))}
        </div>

        <Link to="/app" className="favorites-page-back">
          Volver al panel
        </Link>
      </div>
    </AppShell>
  );
}

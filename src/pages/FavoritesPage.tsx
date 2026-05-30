import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getLikedMoodboards } from '../api/moodboards';
import { moodboardDisplayName } from '../lib/moodboardDisplay';
import type { LikedMoodboardSummary } from '../types/api';
import { AppShell } from '../components/AppShell';
import './FavoritesPage.css';

export function FavoritesPage() {
  const { session } = useAuth();
  const username = session!.username;
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

  return (
    <AppShell title="Mis favoritos">
      <div className="favorites-page card card--elevated">
        {loading && <p>Cargando…</p>}
        {error && <p className="favorites-page-error">{error}</p>}
        {!loading && likedBoards.length === 0 && (
          <p>No has marcado moodboards con me gusta todavía.</p>
        )}
        <ul className="favorites-page-list">
          {likedBoards.map((liked) => (
            <li key={liked.id}>
              <span>{moodboardDisplayName(liked)}</span>
              <Link to={`/u/${liked.ownerUsername}/moodboards/${liked.id}`}>
                Abrir
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/app" className="favorites-page-back">
          Volver al panel
        </Link>
      </div>
    </AppShell>
  );
}

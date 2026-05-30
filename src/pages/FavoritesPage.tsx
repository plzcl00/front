import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getLikedMoodboardIds } from '../api/moodboards';
import { AppShell } from '../components/AppShell';
import './FavoritesPage.css';

export function FavoritesPage() {
  const { session } = useAuth();
  const username = session!.username;
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = await getLikedMoodboardIds(username);
      setLikedIds(ids);
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
        {!loading && likedIds.length === 0 && (
          <p>No has marcado moodboards con me gusta todavía.</p>
        )}
        <ul className="favorites-page-list">
          {likedIds.map((id) => (
            <li key={id}>
              <span>Moodboard #{id}</span>
              <Link to={`/app/moodboards/${id}`}>Abrir</Link>
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

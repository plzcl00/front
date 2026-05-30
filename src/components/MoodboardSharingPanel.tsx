import { useCallback, useEffect, useState } from 'react';
import type { Moodboard } from '../types/api';
import {
  getLikeCount,
  getLikes,
  grantPermission,
  likeMoodboard,
  revokePermission,
  setVisibility,
  unlikeMoodboard,
} from '../api/moodboards';
import { useAuth } from '../auth/AuthContext';
import './MoodboardSharingPanel.css';

interface MoodboardSharingPanelProps {
  moodboard: Moodboard;
  isOwner: boolean;
  onMoodboardUpdate: (board: Moodboard) => void;
}

export function MoodboardSharingPanel({
  moodboard,
  isOwner,
  onMoodboardUpdate,
}: MoodboardSharingPanelProps) {
  const { session } = useAuth();
  const [grantTo, setGrantTo] = useState('');
  const [grantedUsers, setGrantedUsers] = useState<string[]>([]);
  const [likers, setLikers] = useState<string[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const owner = moodboard.ownerUsername;
  const id = moodboard.id;
  const currentUser = session?.username ?? '';

  const refreshLikes = useCallback(async () => {
    const [count, list] = await Promise.all([
      getLikeCount(owner, id),
      getLikes(owner, id),
    ]);
    setLikeCount(count);
    setLikers(list);
  }, [owner, id]);

  useEffect(() => {
    void refreshLikes().catch(() => {
      setLikeCount(0);
      setLikers([]);
    });
  }, [refreshLikes]);

  const userHasLiked = likers.includes(currentUser);

  const handleVisibility = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await setVisibility(owner, id, !moodboard.isPublic);
      onMoodboardUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantTo.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await grantPermission(owner, id, grantTo.trim());
      setGrantedUsers((prev) =>
        prev.includes(grantTo.trim()) ? prev : [...prev, grantTo.trim()],
      );
      setGrantTo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (username: string) => {
    setBusy(true);
    setError(null);
    try {
      await revokePermission(owner, id, username);
      setGrantedUsers((prev) => prev.filter((u) => u !== username));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const handleLikeToggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (userHasLiked) {
        await unlikeMoodboard(owner, id);
      } else {
        await likeMoodboard(owner, id);
      }
      await refreshLikes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="sharing-panel">
      <h3>Compartir y social</h3>
      {error && <p className="sharing-error">{error}</p>}

      <p>
        Visibilidad:{' '}
        <strong>{moodboard.isPublic ? 'Público' : 'Privado'}</strong>
      </p>

      {isOwner && (
        <>
          <button type="button" disabled={busy} onClick={() => void handleVisibility()}>
            {moodboard.isPublic ? 'Hacer privado' : 'Hacer público'}
          </button>

          <form onSubmit={(e) => void handleGrant(e)} className="sharing-grant-form">
            <label htmlFor="grantTo">Dar acceso a usuario</label>
            <input
              id="grantTo"
              value={grantTo}
              onChange={(e) => setGrantTo(e.target.value)}
              placeholder="nombre_usuario"
              disabled={busy}
            />
            <button type="submit" disabled={busy}>
              Conceder
            </button>
          </form>

          {grantedUsers.length > 0 && (
            <ul className="sharing-granted-list">
              {grantedUsers.map((u) => (
                <li key={u}>
                  {u}{' '}
                  <button type="button" disabled={busy} onClick={() => void handleRevoke(u)}>
                    Revocar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p>Me gusta: {likeCount}</p>
      {!isOwner && (
        <button type="button" disabled={busy} onClick={() => void handleLikeToggle()}>
          {userHasLiked ? 'Quitar me gusta' : 'Me gusta'}
        </button>
      )}
      {likers.length > 0 && (
        <p className="sharing-likers">Les gusta: {likers.join(', ')}</p>
      )}
    </aside>
  );
}

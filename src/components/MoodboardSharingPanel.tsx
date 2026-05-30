import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Moodboard } from '../types/api';
import {
  getLikeCount,
  getLikes,
  getPermissions,
  grantPermission,
  revokePermission,
  setVisibility,
} from '../api/moodboards';
import { useOptionalSession } from '../auth/useSession';
import { MoodboardLikeButton } from './MoodboardLikeButton';
import { UsernameAutocomplete } from './UsernameAutocomplete';
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
  const { session } = useOptionalSession();
  const [grantTo, setGrantTo] = useState('');
  const [grantToValid, setGrantToValid] = useState(false);
  const [grantedUsers, setGrantedUsers] = useState<string[]>([]);
  const [likers, setLikers] = useState<string[]>([]);
  const [likeCount, setLikeCount] = useState(moodboard.likeCount ?? 0);
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
      setLikeCount(moodboard.likeCount ?? 0);
      setLikers([]);
    });
  }, [refreshLikes, moodboard.likeCount]);

  useEffect(() => {
    if (!isOwner) {
      return;
    }
    void getPermissions(owner, id)
      .then(setGrantedUsers)
      .catch(() => setGrantedUsers([]));
  }, [isOwner, owner, id]);

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

  const handleGrant = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = grantTo.trim();
    if (!username || !grantToValid) return;
    setBusy(true);
    setError(null);
    try {
      await grantPermission(owner, id, username);
      setGrantedUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username],
      );
      setGrantTo('');
      setGrantToValid(false);
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

  return (
    <aside className="sharing-panel">
      <h3>Compartir y social</h3>
      {error && (
        <p className="sharing-error" role="alert">
          {error}
        </p>
      )}

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
            <UsernameAutocomplete
              id="grantTo"
              value={grantTo}
              onChange={setGrantTo}
              onValidUserChange={setGrantToValid}
              exclude={[owner, currentUser, ...grantedUsers]}
              disabled={busy}
              placeholder="nombre_usuario"
            />
            <button type="submit" disabled={busy || !grantToValid}>
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

      <div className="sharing-like-row">
        <MoodboardLikeButton
          ownerUsername={owner}
          moodboardId={id}
          liked={userHasLiked}
          likeCount={likeCount}
          readOnly={isOwner || !currentUser}
          onChange={(next) => {
            setLikeCount(next.likeCount);
            void refreshLikes();
          }}
        />
      </div>
      {likers.length > 0 && (
        <p className="sharing-likers">Les gusta: {likers.join(', ')}</p>
      )}
    </aside>
  );
}

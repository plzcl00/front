import { useState, type MouseEvent } from 'react';
import { likeMoodboard, unlikeMoodboard } from '../api/moodboards';
import iconHeart from '../assets/icons/heart.svg';
import './MoodboardLikeButton.css';

interface MoodboardLikeButtonProps {
  ownerUsername: string;
  moodboardId: number;
  liked: boolean;
  likeCount: number;
  onChange: (next: { liked: boolean; likeCount: number }) => void;
}

export function MoodboardLikeButton({
  ownerUsername,
  moodboardId,
  liked,
  likeCount,
  onChange,
}: MoodboardLikeButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      if (liked) {
        await unlikeMoodboard(ownerUsername, moodboardId);
        onChange({ liked: false, likeCount: Math.max(0, likeCount - 1) });
      } else {
        await likeMoodboard(ownerUsername, moodboardId);
        onChange({ liked: true, likeCount: likeCount + 1 });
      }
    } catch {
      // Keep current state on failure.
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`moodboard-like-btn ${liked ? 'moodboard-like-btn--active' : ''}`}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
      onClick={(event) => void handleClick(event)}
    >
      <img src={iconHeart} alt="" draggable={false} />
      <span>{likeCount}</span>
    </button>
  );
}

import type { LikedMoodboardSummary, Moodboard } from '../types/api';

type NamedMoodboard = Pick<Moodboard, 'id' | 'name'> | LikedMoodboardSummary;

export function moodboardDisplayName(board: NamedMoodboard): string {
  const trimmed = board.name?.trim();
  if (trimmed) {
    return trimmed;
  }
  return `Moodboard #${board.id}`;
}

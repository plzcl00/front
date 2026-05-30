import type { MoodboardContent } from '../types/api';
import { FeedCardThumbnail } from './FeedCardThumbnail';
import { MoodboardCardPreview } from './MoodboardCardPreview';

interface MoodboardCardThumbnailProps {
  ownerUsername: string;
  moodboardId: number;
  hasThumbnail: boolean;
  content?: MoodboardContent;
}

export function MoodboardCardThumbnail({
  ownerUsername,
  moodboardId,
  hasThumbnail,
  content,
}: MoodboardCardThumbnailProps) {
  if (hasThumbnail) {
    return (
      <FeedCardThumbnail
        ownerUsername={ownerUsername}
        moodboardId={moodboardId}
        hasThumbnail
        content={content}
      />
    );
  }

  if (content) {
    return (
      <MoodboardCardPreview
        content={content}
        ownerUsername={ownerUsername}
        moodboardId={moodboardId}
      />
    );
  }

  return (
    <div
      className="dashboard-card-preview dashboard-card-preview--empty"
      aria-hidden
    />
  );
}

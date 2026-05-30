import { useEffect, useState } from 'react';
import { fetchThumbnailBlob } from '../api/moodboards';

interface FeedCardThumbnailProps {
  ownerUsername: string;
  moodboardId: number;
  hasThumbnail: boolean;
}

export function FeedCardThumbnail({
  ownerUsername,
  moodboardId,
  hasThumbnail,
}: FeedCardThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!hasThumbnail) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const blob = await fetchThumbnailBlob(ownerUsername, moodboardId);
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) {
          setSrc(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hasThumbnail, ownerUsername, moodboardId]);

  if (!hasThumbnail || !src) {
    return (
      <div
        className="dashboard-card-preview dashboard-card-preview--empty"
        aria-hidden
      />
    );
  }

  return (
    <div className="dashboard-card-preview" aria-hidden>
      <img src={src} alt="" />
    </div>
  );
}

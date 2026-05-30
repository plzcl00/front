import { useEffect, useRef, useState } from 'react';
import type { MoodboardContent } from '../types/api';
import { fetchThumbnailBlob } from '../api/moodboards';
import { MoodboardCardPreview } from './MoodboardCardPreview';

interface FeedCardThumbnailProps {
  ownerUsername: string;
  moodboardId: number;
  hasThumbnail: boolean;
  content?: MoodboardContent;
}

export function FeedCardThumbnail({
  ownerUsername,
  moodboardId,
  hasThumbnail,
  content,
}: FeedCardThumbnailProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [thumbnailFailed, setThumbnailFailed] = useState(!hasThumbnail);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasThumbnail) {
      setSrc(null);
      setThumbnailFailed(true);
      return;
    }

    let cancelled = false;
    setThumbnailFailed(false);

    void (async () => {
      try {
        const blob = await fetchThumbnailBlob(ownerUsername, moodboardId);
        if (cancelled) {
          return;
        }
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setSrc(objectUrl);
        setThumbnailFailed(false);
      } catch {
        if (!cancelled) {
          setSrc(null);
          setThumbnailFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [hasThumbnail, ownerUsername, moodboardId]);

  if (src) {
    return (
      <div className="dashboard-card-preview" aria-hidden>
        <img src={src} alt="" />
      </div>
    );
  }

  if (content && thumbnailFailed) {
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

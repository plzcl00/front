import { Canvas } from 'fabric';
import { useEffect, useState } from 'react';
import type { MoodboardContent } from '../types/api';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  extractFabricJson,
} from '../lib/moodboardContent';
import { hydrateFabricMedia } from '../fabric/mediaAssets';

interface MoodboardCardPreviewProps {
  content: MoodboardContent;
  ownerUsername: string;
  moodboardId: number;
}

export function MoodboardCardPreview({
  content,
  ownerUsername,
  moodboardId,
}: MoodboardCardPreviewProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const background =
    content.canvas?.background ??
    (typeof extractFabricJson(content)?.background === 'string'
      ? (extractFabricJson(content)?.background as string)
      : '#ffffff');

  useEffect(() => {
    let cancelled = false;
    const blobUrls: string[] = [];

    (async () => {
      const rawJson = extractFabricJson(content);
      if (!rawJson) {
        return;
      }

      const canvasEl = document.createElement('canvas');
      const width = content.canvas?.width ?? CANVAS_WIDTH;
      const height = content.canvas?.height ?? CANVAS_HEIGHT;

      const canvas = new Canvas(canvasEl, {
        width,
        height,
        backgroundColor: background,
        selection: false,
        enableRetinaScaling: false,
      });

      try {
        const hydrated = await hydrateFabricMedia(
          rawJson,
          ownerUsername,
          moodboardId,
          blobUrls,
        );
        if (cancelled) {
          return;
        }

        await canvas.loadFromJSON(hydrated);
        canvas.renderAll();

        const dataUrl = canvas.toDataURL({
          format: 'jpeg',
          quality: 0.82,
          multiplier: Math.min(1, 400 / width),
        });

        if (!cancelled) {
          setPreviewSrc(dataUrl);
        }
      } catch {
        if (!cancelled) {
          setPreviewSrc(null);
        }
      } finally {
        void canvas.dispose();
        for (const url of blobUrls) {
          URL.revokeObjectURL(url);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [content, ownerUsername, moodboardId, background]);

  return (
    <div
      className="dashboard-card-preview"
      aria-hidden
      style={{ backgroundColor: background }}
    >
      {previewSrc && <img src={previewSrc} alt="" />}
    </div>
  );
}

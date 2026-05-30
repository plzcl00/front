import { Canvas, Circle, FabricImage, IText, Rect } from 'fabric';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MoodboardContent } from '../types/api';
import { uploadMedia, deleteMedia } from '../api/moodboards';
import {
  buildContentFromFabric,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  extractFabricJson,
} from '../lib/moodboardContent';
import {
  collectAssetIds,
  EDIARY_ASSET_ID,
  EDIARY_MEDIA_OWNER,
  EDIARY_MOODBOARD_ID,
  hydrateFabricMedia,
  revokeAllBlobUrls,
  trackBlobUrl,
} from './mediaAssets';
import './FabricMoodboardEditor.css';

interface FabricMoodboardEditorProps {
  ownerUsername: string;
  moodboardId: number;
  initialContent: MoodboardContent;
  readOnly?: boolean;
  onSaved?: (content: MoodboardContent) => void;
  saveRef?: React.MutableRefObject<(() => Promise<MoodboardContent>) | null>;
}

export function FabricMoodboardEditor({
  ownerUsername,
  moodboardId,
  initialContent,
  readOnly = false,
  onSaved,
  saveRef,
}: FabricMoodboardEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialAssetIds = useRef<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const persistCanvas = useCallback(async (): Promise<MoodboardContent> => {
    const canvas = fabricRef.current;
    if (!canvas) {
      throw new Error('Canvas no inicializado');
    }
    const fabricJson = canvas.toDatalessObject([
      EDIARY_ASSET_ID,
      EDIARY_MEDIA_OWNER,
      EDIARY_MOODBOARD_ID,
    ]) as Record<string, unknown>;
    const content = buildContentFromFabric(fabricJson);
    onSaved?.(content);
    return content;
  }, [onSaved]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = persistCanvas;
    }
    return () => {
      if (saveRef) {
        saveRef.current = null;
      }
    };
  }, [saveRef, persistCanvas]);

  useEffect(() => {
    let cancelled = false;
    const canvasEl = canvasElRef.current;
    if (!canvasEl) {
      return;
    }

    revokeAllBlobUrls();

    const canvas = new Canvas(canvasEl, {
      width: initialContent.canvas?.width ?? CANVAS_WIDTH,
      height: initialContent.canvas?.height ?? CANVAS_HEIGHT,
      backgroundColor: initialContent.canvas?.background ?? '#ffffff',
      selection: !readOnly,
    });
    fabricRef.current = canvas;

    const rawJson = extractFabricJson(initialContent);
    initialAssetIds.current = rawJson ? collectAssetIds(rawJson) : [];

    (async () => {
      try {
        if (rawJson) {
          const hydrated = await hydrateFabricMedia(
            rawJson,
            ownerUsername,
            moodboardId,
          );
          if (!cancelled) {
            await canvas.loadFromJSON(hydrated);
            canvas.renderAll();
          }
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(
            err instanceof Error ? err.message : 'No se pudo cargar el lienzo',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    if (readOnly) {
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    }

    return () => {
      cancelled = true;
      canvas.dispose();
      fabricRef.current = null;
      revokeAllBlobUrls();
    };
  }, [initialContent, ownerUsername, moodboardId, readOnly]);

  const addText = () => {
    const canvas = fabricRef.current;
    if (!canvas || readOnly) return;
    const text = new IText('Escribe aquí…', {
      left: 80,
      top: 80,
      fontSize: 24,
      fill: '#333333',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRect = () => {
    const canvas = fabricRef.current;
    if (!canvas || readOnly) return;
    const rect = new Rect({
      left: 120,
      top: 120,
      width: 160,
      height: 100,
      fill: '#e8f4fc',
      stroke: '#4a90d9',
      strokeWidth: 2,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    const canvas = fabricRef.current;
    if (!canvas || readOnly) return;
    const circle = new Circle({
      left: 200,
      top: 200,
      radius: 50,
      fill: '#fce8e8',
      stroke: '#d94a4a',
      strokeWidth: 2,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const removeSelected = async () => {
    const canvas = fabricRef.current;
    if (!canvas || readOnly) return;
    const active = canvas.getActiveObjects();
    for (const obj of active) {
      const assetId = obj.get(EDIARY_ASSET_ID) as number | undefined;
      if (assetId != null) {
        try {
          await deleteMedia(ownerUsername, moodboardId, assetId);
        } catch {
          // still remove from canvas if server delete fails
        }
      }
      canvas.remove(obj);
    }
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handleImageUpload = async (file: File) => {
    const canvas = fabricRef.current;
    if (!canvas || readOnly) return;
    setBusy(true);
    setMessage(null);
    try {
      const uploaded = await uploadMedia(ownerUsername, moodboardId, file);
      const blob = URL.createObjectURL(file);
      trackBlobUrl(blob);
      const img = await FabricImage.fromURL(blob);
      img.set({
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5,
      });
      img.set(EDIARY_ASSET_ID, uploaded.assetId);
      img.set(EDIARY_MEDIA_OWNER, ownerUsername);
      img.set(EDIARY_MOODBOARD_ID, moodboardId);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const content = await persistCanvas();
      const currentIds = extractFabricJson(content)
        ? collectAssetIds(extractFabricJson(content)!)
        : [];
      const removed = initialAssetIds.current.filter((id) => !currentIds.includes(id));
      for (const assetId of removed) {
        try {
          await deleteMedia(ownerUsername, moodboardId, assetId);
        } catch {
          // ignore orphan cleanup errors
        }
      }
      initialAssetIds.current = currentIds;
      setMessage('Guardado correctamente');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fabric-editor">
      {!readOnly && (
        <div className="fabric-toolbar">
          <button type="button" onClick={addText} disabled={loading || busy}>
            Texto
          </button>
          <button type="button" onClick={addRect} disabled={loading || busy}>
            Rectángulo
          </button>
          <button type="button" onClick={addCircle} disabled={loading || busy}>
            Círculo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || busy}
          >
            Imagen
          </button>
          <button type="button" onClick={removeSelected} disabled={loading || busy}>
            Eliminar
          </button>
          <button type="button" onClick={handleSave} disabled={loading || busy}>
            Guardar lienzo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleImageUpload(file);
              }
              e.target.value = '';
            }}
          />
        </div>
      )}
      {loading && <p className="fabric-status">Cargando lienzo…</p>}
      {message && <p className="fabric-status">{message}</p>}
      <div className="fabric-canvas-wrap">
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}

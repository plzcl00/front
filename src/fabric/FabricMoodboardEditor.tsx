import { Canvas, Circle, FabricImage, IText, Point, Rect } from 'fabric';
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { MoodboardContent } from '../types/api';
import { uploadMedia, deleteMedia } from '../api/moodboards';
import {
  buildContentFromFabric,
  CANVAS_FONT_FAMILY,
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
import iconText from '../assets/icons/text-size.svg';
import iconDraw from '../assets/icons/draw.svg';
import iconCircle from '../assets/icons/circle.svg';
import iconImage from '../assets/icons/image-add.svg';
import './FabricMoodboardEditor.css';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_FACTOR = 1.2;

function clampUserZoom(scale: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

interface FabricMoodboardEditorProps {
  ownerUsername: string;
  moodboardId: number;
  initialContent: MoodboardContent;
  readOnly?: boolean;
  onSaved?: (content: MoodboardContent) => void;
  onPersist?: (content: MoodboardContent) => Promise<void>;
  saveRef?: MutableRefObject<(() => Promise<MoodboardContent>) | null>;
  exportThumbnailRef?: MutableRefObject<(() => Promise<Blob>) | null>;
  publicAccess?: boolean;
}

function applyReadOnly(canvas: Canvas) {
  canvas.selection = false;
  for (const obj of canvas.getObjects()) {
    obj.selectable = false;
    obj.evented = false;
  }
}

function tuneRenderedObjects(canvas: Canvas) {
  for (const obj of canvas.getObjects()) {
    if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
      obj.set({
        fontFamily: CANVAS_FONT_FAMILY,
        objectCaching: false,
      });
    } else {
      obj.set({ objectCaching: false });
    }
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

export function FabricMoodboardEditor({
  ownerUsername,
  moodboardId,
  initialContent,
  readOnly = false,
  onSaved,
  onPersist,
  saveRef,
  exportThumbnailRef,
  publicAccess = false,
}: FabricMoodboardEditorProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialAssetIds = useRef<number[]>([]);
  const initialContentRef = useRef(initialContent);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const controlPressedRef = useRef(false);
  const baseFitZoomRef = useRef(1);
  const userZoomScaleRef = useRef(1);

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

  const saveCanvas = useCallback(async (): Promise<MoodboardContent> => {
    setMessage(null);
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
    if (onPersist) {
      await onPersist(content);
    }
    setMessage('Guardado correctamente');
    return content;
  }, [persistCanvas, onPersist, ownerUsername, moodboardId]);

  const exportThumbnail = useCallback(async (): Promise<Blob> => {
    const canvas = fabricRef.current;
    if (!canvas) {
      throw new Error('Canvas no inicializado');
    }
    const width = canvas.getWidth();
    const dataUrl = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.82,
      multiplier: Math.min(1, 400 / width),
    });
    return dataUrlToBlob(dataUrl);
  }, []);

  const syncCanvasLayout = useCallback((resetPan = false) => {
    const wrap = wrapRef.current;
    const canvas = fabricRef.current;
    if (!wrap || !canvas) {
      return;
    }

    const logicalWidth = canvas.getWidth();
    const logicalHeight = canvas.getHeight();
    const availableWidth = Math.floor(wrap.clientWidth);

    if (availableWidth <= 0 || logicalWidth <= 0) {
      return;
    }

    canvas.setDimensions({ width: logicalWidth, height: logicalHeight });

    baseFitZoomRef.current = availableWidth / logicalWidth;
    const absoluteZoom =
      baseFitZoomRef.current * clampUserZoom(userZoomScaleRef.current);

    const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const panX = resetPan ? 0 : vpt[4];
    const panY = resetPan ? 0 : vpt[5];

    canvas.setViewportTransform([absoluteZoom, 0, 0, absoluteZoom, panX, panY]);
    setZoomPercent(Math.round(userZoomScaleRef.current * 100));
    canvas.calcOffset();
    canvas.requestRenderAll();
  }, []);

  const getZoomCenter = useCallback((): Point => {
    const wrap = wrapRef.current;
    if (!wrap) {
      return new Point(0, 0);
    }
    return new Point(wrap.clientWidth / 2, wrap.clientHeight / 2);
  }, []);

  const applyZoom = useCallback(
    (nextUserScale: number, point?: Point) => {
      const canvas = fabricRef.current;
      if (!canvas) {
        return;
      }
      userZoomScaleRef.current = clampUserZoom(nextUserScale);
      const absoluteZoom =
        baseFitZoomRef.current * userZoomScaleRef.current;
      canvas.zoomToPoint(point ?? getZoomCenter(), absoluteZoom);
      canvas.requestRenderAll();
      setZoomPercent(Math.round(userZoomScaleRef.current * 100));
    },
    [getZoomCenter],
  );

  const zoomIn = useCallback(() => {
    applyZoom(userZoomScaleRef.current * ZOOM_FACTOR);
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    applyZoom(userZoomScaleRef.current / ZOOM_FACTOR);
  }, [applyZoom]);

  const resetZoom = useCallback(() => {
    userZoomScaleRef.current = 1;
    syncCanvasLayout(true);
  }, [syncCanvasLayout]);

  useEffect(() => {
    if (saveRef) {
      saveRef.current = saveCanvas;
    }
    return () => {
      if (saveRef) {
        saveRef.current = null;
      }
    };
  }, [saveRef, saveCanvas]);

  useEffect(() => {
    if (exportThumbnailRef) {
      exportThumbnailRef.current = exportThumbnail;
    }
    return () => {
      if (exportThumbnailRef) {
        exportThumbnailRef.current = null;
      }
    };
  }, [exportThumbnailRef, exportThumbnail]);

  useEffect(() => {
    let cancelled = false;
    const canvasEl = canvasElRef.current;
    if (!canvasEl) {
      return;
    }

    revokeAllBlobUrls();
    setLoading(true);

    const canvas = new Canvas(canvasEl, {
      width: initialContentRef.current.canvas?.width ?? CANVAS_WIDTH,
      height: initialContentRef.current.canvas?.height ?? CANVAS_HEIGHT,
      backgroundColor: initialContentRef.current.canvas?.background ?? '#ffffff',
      selection: !readOnly,
      enableRetinaScaling: true,
      containerClass: 'canvas-container',
    });
    fabricRef.current = canvas;
    userZoomScaleRef.current = 1;

    const rawJson = extractFabricJson(initialContentRef.current);
    initialAssetIds.current = rawJson ? collectAssetIds(rawJson) : [];

    (async () => {
      try {
        if (rawJson) {
          const hydrated = await hydrateFabricMedia(
            rawJson,
            ownerUsername,
            moodboardId,
            undefined,
            { auth: !publicAccess },
          );
          if (!cancelled) {
            await canvas.loadFromJSON(hydrated);
            tuneRenderedObjects(canvas);
            if (readOnly) {
              applyReadOnly(canvas);
            }
            canvas.renderAll();
            syncCanvasLayout();
          }
        } else if (readOnly) {
          applyReadOnly(canvas);
          syncCanvasLayout();
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(
            err instanceof Error ? err.message : 'No se pudo cargar el lienzo',
          );
        }
      } finally {
        if (!cancelled) {
          syncCanvasLayout();
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      void canvas.dispose();
      fabricRef.current = null;
      revokeAllBlobUrls();
    };
  }, [ownerUsername, moodboardId, readOnly, syncCanvasLayout]);

  useEffect(() => {
    if (loading) {
      return;
    }

    syncCanvasLayout();
    const wrap = wrapRef.current;
    const parent = wrap?.parentElement;
    if (!parent) {
      return;
    }

    const observer = new ResizeObserver(() => {
      syncCanvasLayout(false);
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, [loading, syncCanvasLayout]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = fabricRef.current;
    if (!wrap || !canvas || loading) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const point = new Point(
        event.clientX - rect.left,
        event.clientY - rect.top,
      );
      const nextUserScale =
        userZoomScaleRef.current * 0.999 ** event.deltaY;
      applyZoom(nextUserScale, point);
    };

    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, [loading, applyZoom]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = fabricRef.current;
    if (!wrap || !canvas || loading) {
      return;
    }

    let panning = false;
    let lastX = 0;
    let lastY = 0;

    const isEditingText = () => {
      const active = canvas.getActiveObject();
      return (
        active != null &&
        'isEditing' in active &&
        Boolean((active as IText).isEditing)
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.code !== 'ControlLeft' && event.code !== 'ControlRight') ||
        event.repeat ||
        isEditingText()
      ) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      controlPressedRef.current = true;
      wrap.classList.add('fabric-canvas-wrap--pan');
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'ControlLeft' && event.code !== 'ControlRight') {
        return;
      }
      controlPressedRef.current = false;
      panning = false;
      wrap.classList.remove('fabric-canvas-wrap--pan');
    };

    const onMouseDown = (opt: { e: globalThis.TouchEvent | MouseEvent }) => {
      if (!controlPressedRef.current) {
        return;
      }
      if (!('clientX' in opt.e)) {
        return;
      }
      panning = true;
      canvas.selection = false;
      canvas.discardActiveObject();
      lastX = opt.e.clientX;
      lastY = opt.e.clientY;
    };

    const onMouseMove = (opt: { e: globalThis.TouchEvent | MouseEvent }) => {
      if (!panning || !controlPressedRef.current) {
        return;
      }
      if (!('clientX' in opt.e)) {
        return;
      }
      const vpt = canvas.viewportTransform;
      if (!vpt) {
        return;
      }
      vpt[4] += opt.e.clientX - lastX;
      vpt[5] += opt.e.clientY - lastY;
      lastX = opt.e.clientX;
      lastY = opt.e.clientY;
      canvas.setViewportTransform(vpt);
      canvas.requestRenderAll();
    };

    const onMouseUp = () => {
      if (panning) {
        canvas.selection = !readOnly;
      }
      panning = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.off('mouse:down', onMouseDown);
      canvas.off('mouse:move', onMouseMove);
      canvas.off('mouse:up', onMouseUp);
      wrap.classList.remove('fabric-canvas-wrap--pan');
    };
  }, [loading, readOnly]);

  const addText = () => {
    const canvas = fabricRef.current;
    if (!canvas || readOnly) return;
    const text = new IText('Escribe aquí…', {
      left: 80,
      top: 80,
      fontSize: 24,
      fill: '#333333',
      fontFamily: CANVAS_FONT_FAMILY,
      objectCaching: false,
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

  return (
    <div className="fabric-editor">
      {!readOnly && (
        <div className="fabric-toolbar">
          <button type="button" onClick={addText} disabled={loading || busy}>
            <img src={iconText} alt="" />
            Texto
          </button>
          <button type="button" onClick={addRect} disabled={loading || busy}>
            <img src={iconDraw} alt="" />
            Rectángulo
          </button>
          <button type="button" onClick={addCircle} disabled={loading || busy}>
            <img src={iconCircle} alt="" />
            Círculo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || busy}
          >
            <img src={iconImage} alt="" />
            Imagen
          </button>
          <button type="button" onClick={removeSelected} disabled={loading || busy}>
            Eliminar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
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
      <div className="fabric-zoom-bar">
        <button
          type="button"
          className="fabric-zoom-btn"
          onClick={zoomOut}
          disabled={loading || zoomPercent <= MIN_ZOOM * 100}
          title="Alejar"
          aria-label="Alejar"
        >
          −
        </button>
        <span className="fabric-zoom-label">{zoomPercent}%</span>
        <button
          type="button"
          className="fabric-zoom-btn"
          onClick={zoomIn}
          disabled={loading || zoomPercent >= MAX_ZOOM * 100}
          title="Acercar"
          aria-label="Acercar"
        >
          +
        </button>
        <button
          type="button"
          className="fabric-zoom-reset"
          onClick={resetZoom}
          disabled={loading}
        >
          Ajustar
        </button>
        <span className="fabric-zoom-hint">Rueda del ratón · Ctrl + arrastrar para mover</span>
      </div>
      {loading && <p className="fabric-status">Cargando lienzo…</p>}
      {message && <p className="fabric-status">{message}</p>}
      <div className="fabric-canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}

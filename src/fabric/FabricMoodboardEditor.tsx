import {
  Canvas,
  Circle,
  FabricImage,
  IText,
  PencilBrush,
  Point,
  Rect,
  type FabricObject,
} from 'fabric';
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
import iconDraw from '../assets/icons/MdOutlineGesture.svg';
import iconRect from '../assets/icons/MdOutlineCropDin.svg';
import iconCircle from '../assets/icons/circle.svg';
import iconImage from '../assets/icons/image-add.svg';
import { ColorPickerButton } from '../components/ColorPickerButton';
import './FabricMoodboardEditor.css';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_FACTOR = 1.2;

const DEFAULT_CANVAS_BG = '#ffffff';
const DEFAULT_TEXT_FILL = '#333333';
const DEFAULT_SHAPE_FILL = '#e8f4fc';
const DEFAULT_SHAPE_STROKE = '#4a90d9';
const DEFAULT_DRAW_WIDTH = 3;

type EditorMode = 'select' | 'draw';

function readColorValue(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function isTextObject(obj: FabricObject): boolean {
  return obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text';
}

function isShapeObject(obj: FabricObject): boolean {
  return obj.type === 'rect' || obj.type === 'circle';
}

function objectSupportsFill(obj: FabricObject): boolean {
  return isTextObject(obj) || isShapeObject(obj);
}

function objectSupportsStroke(obj: FabricObject): boolean {
  return isShapeObject(obj) || obj.type === 'path';
}

function getSelectedObjects(canvas: Canvas): FabricObject[] {
  const active = canvas.getActiveObject();
  if (!active) {
    return [];
  }
  if (active.type === 'activeselection' && 'getObjects' in active) {
    return (active as FabricObject & { getObjects(): FabricObject[] }).getObjects();
  }
  return [active];
}

function touchDistance(t1: Touch, t2: Touch): number {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
}

function touchCenterPoint(
  t1: Touch,
  t2: Touch,
  rect: DOMRect,
): Point {
  return new Point(
    (t1.clientX + t2.clientX) / 2 - rect.left,
    (t1.clientY + t2.clientY) / 2 - rect.top,
  );
}

function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 768px)').matches;
}

function clampUserZoom(scale: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
}

function getVisibleCenterScenePoint(canvas: Canvas, wrap: HTMLElement | null): Point {
  canvas.calcOffset();
  if (wrap) {
    const wrapRect = wrap.getBoundingClientRect();
    return canvas.getScenePoint({
      clientX: wrapRect.left + wrapRect.width / 2,
      clientY: wrapRect.top + wrapRect.height / 2,
    } as MouseEvent);
  }
  return canvas.getVpCenter();
}

function placeObjectAtVisibleCenter(
  object: FabricObject,
  canvas: Canvas,
  wrap: HTMLElement | null,
) {
  const center = getVisibleCenterScenePoint(canvas, wrap);
  object.setPositionByOrigin(center, 'center', 'center');
  object.setCoords();
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
  const layoutStateRef = useRef({ width: 0, absoluteZoom: 0 });
  const lastZoomPercentRef = useRef(100);
  const defaultTextFillRef = useRef(DEFAULT_TEXT_FILL);
  const defaultShapeFillRef = useRef(DEFAULT_SHAPE_FILL);
  const defaultShapeStrokeRef = useRef(DEFAULT_SHAPE_STROKE);

  const initialBg =
    initialContent.canvas?.background ?? DEFAULT_CANVAS_BG;
  const [backgroundColor, setBackgroundColor] = useState(initialBg);
  const [fillColor, setFillColor] = useState(DEFAULT_SHAPE_FILL);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_SHAPE_STROKE);
  const [fillControlEnabled, setFillControlEnabled] = useState(true);
  const [strokeControlEnabled, setStrokeControlEnabled] = useState(true);
  const [editorMode, setEditorMode] = useState<EditorMode>('select');

  const syncColorControlsFromCanvas = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    setBackgroundColor(
      readColorValue(canvas.backgroundColor, DEFAULT_CANVAS_BG),
    );

    if (canvas.isDrawingMode) {
      setFillColor(defaultShapeFillRef.current);
      setStrokeColor(defaultShapeStrokeRef.current);
      setFillControlEnabled(true);
      setStrokeControlEnabled(true);
      return;
    }

    const selected = getSelectedObjects(canvas);
    if (selected.length === 0) {
      setFillColor(defaultShapeFillRef.current);
      setStrokeColor(defaultShapeStrokeRef.current);
      setFillControlEnabled(true);
      setStrokeControlEnabled(true);
      return;
    }

    const hasImage = selected.some((obj) => obj.type === 'image');
    const fillable = selected.filter(objectSupportsFill);
    const strokeable = selected.filter(objectSupportsStroke);

    setFillControlEnabled(!hasImage && fillable.length > 0);
    setStrokeControlEnabled(!hasImage && strokeable.length > 0);

    if (fillable.length > 0) {
      setFillColor(readColorValue(fillable[0].get('fill'), defaultShapeFillRef.current));
    }
    if (strokeable.length > 0) {
      setStrokeColor(
        readColorValue(strokeable[0].get('stroke'), defaultShapeStrokeRef.current),
      );
    }
  }, []);

  const applyCanvasBackground = useCallback((color: string) => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }
    canvas.backgroundColor = color;
    canvas.requestRenderAll();
  }, []);

  const handleBackgroundColorChange = useCallback(
    (color: string) => {
      setBackgroundColor(color);
      applyCanvasBackground(color);
    },
    [applyCanvasBackground],
  );

  const handleFillColorChange = useCallback((color: string) => {
    setFillColor(color);
    const canvas = fabricRef.current;
    if (!canvas) {
      defaultShapeFillRef.current = color;
      defaultTextFillRef.current = color;
      return;
    }

    const selected = getSelectedObjects(canvas).filter(objectSupportsFill);
    if (selected.length === 0) {
      defaultShapeFillRef.current = color;
      defaultTextFillRef.current = color;
      return;
    }

    for (const obj of selected) {
      obj.set('fill', color);
      if (isTextObject(obj)) {
        defaultTextFillRef.current = color;
      }
      if (isShapeObject(obj)) {
        defaultShapeFillRef.current = color;
      }
    }
    canvas.requestRenderAll();
  }, []);

  const handleStrokeColorChange = useCallback((color: string) => {
    setStrokeColor(color);
    defaultShapeStrokeRef.current = color;

    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
    }

    const selected = getSelectedObjects(canvas).filter(objectSupportsStroke);
    for (const obj of selected) {
      obj.set('stroke', color);
    }
    canvas.requestRenderAll();
  }, []);

  const exitDrawMode = useCallback(() => {
    const canvas = fabricRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !canvas.isDrawingMode) {
      return;
    }
    canvas.isDrawingMode = false;
    canvas.selection = !readOnly;
    wrap?.classList.remove('fabric-canvas-wrap--draw');
    setEditorMode('select');
    canvas.requestRenderAll();
  }, [readOnly]);

  const enterDrawMode = useCallback(() => {
    const canvas = fabricRef.current;
    const wrap = wrapRef.current;
    if (!canvas || readOnly) {
      return;
    }
    canvas.discardActiveObject();
    canvas.isDrawingMode = true;
    canvas.selection = false;
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new PencilBrush(canvas);
    }
    canvas.freeDrawingBrush.color = defaultShapeStrokeRef.current;
    canvas.freeDrawingBrush.width = DEFAULT_DRAW_WIDTH;
    wrap?.classList.add('fabric-canvas-wrap--draw');
    setEditorMode('draw');
    syncColorControlsFromCanvas();
    canvas.requestRenderAll();
  }, [readOnly, syncColorControlsFromCanvas]);

  const toggleDrawMode = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || readOnly) {
      return;
    }
    if (canvas.isDrawingMode) {
      exitDrawMode();
    } else {
      enterDrawMode();
    }
  }, [enterDrawMode, exitDrawMode, readOnly]);

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

    const widthRatio = availableWidth / logicalWidth;
    const fittedHeight = availableWidth * (logicalHeight / logicalWidth);
    const mobileMaxHeight = Math.min(window.innerHeight * 0.6, 600);
    const availableHeight = isMobileViewport()
      ? Math.min(fittedHeight, mobileMaxHeight)
      : fittedHeight;
    const heightRatio = availableHeight / logicalHeight;
    baseFitZoomRef.current = isMobileViewport()
      ? Math.min(widthRatio, heightRatio)
      : widthRatio;
    const absoluteZoom =
      baseFitZoomRef.current * clampUserZoom(userZoomScaleRef.current);

    if (
      !resetPan &&
      availableWidth === layoutStateRef.current.width &&
      Math.abs(absoluteZoom - layoutStateRef.current.absoluteZoom) < 0.0001
    ) {
      return;
    }
    layoutStateRef.current = { width: availableWidth, absoluteZoom };

    const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
    const panX = resetPan ? 0 : vpt[4];
    const panY = resetPan ? 0 : vpt[5];

    canvas.setViewportTransform([absoluteZoom, 0, 0, absoluteZoom, panX, panY]);
    const nextPercent = Math.round(userZoomScaleRef.current * 100);
    if (nextPercent !== lastZoomPercentRef.current) {
      lastZoomPercentRef.current = nextPercent;
      setZoomPercent(nextPercent);
    }
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
    layoutStateRef.current = { width: 0, absoluteZoom: 0 };
    lastZoomPercentRef.current = 100;

    const onPathCreated = (opt: { path: FabricObject }) => {
      opt.path.set({ objectCaching: false });
    };
    canvas.on('path:created', onPathCreated);

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
      canvas.off('path:created', onPathCreated);
      void canvas.dispose();
      fabricRef.current = null;
      revokeAllBlobUrls();
    };
  }, [ownerUsername, moodboardId, readOnly, syncCanvasLayout]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || loading || readOnly) {
      return;
    }

    const onSelectionChange = () => {
      syncColorControlsFromCanvas();
    };

    canvas.on('selection:created', onSelectionChange);
    canvas.on('selection:updated', onSelectionChange);
    canvas.on('selection:cleared', onSelectionChange);
    syncColorControlsFromCanvas();

    return () => {
      canvas.off('selection:created', onSelectionChange);
      canvas.off('selection:updated', onSelectionChange);
      canvas.off('selection:cleared', onSelectionChange);
    };
  }, [loading, readOnly, syncColorControlsFromCanvas]);

  useEffect(() => {
    if (loading) {
      return;
    }

    syncCanvasLayout();
    const wrap = wrapRef.current;
    if (!wrap) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (width <= 0 || width === layoutStateRef.current.width) {
        return;
      }
      syncCanvasLayout(false);
    });
    observer.observe(wrap);
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

    const canPanWithoutCtrl = () =>
      isCoarsePointer() &&
      (readOnly || userZoomScaleRef.current > 1.01);

    const shouldStartPan = (hasTarget: boolean) => {
      if (canvas.isDrawingMode) {
        return false;
      }
      if (isEditingText()) {
        return false;
      }
      if (controlPressedRef.current) {
        return true;
      }
      if (!canPanWithoutCtrl()) {
        return false;
      }
      return !hasTarget;
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

    const onMouseDown = (opt: {
      e: globalThis.TouchEvent | MouseEvent;
      target?: unknown;
    }) => {
      const hasTarget = opt.target != null;
      if (!shouldStartPan(hasTarget)) {
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
      if (canPanWithoutCtrl() || controlPressedRef.current) {
        wrap.classList.add('fabric-canvas-wrap--pan');
      }
    };

    const onMouseMove = (opt: { e: globalThis.TouchEvent | MouseEvent }) => {
      if (!panning) {
        return;
      }
      if (
        !controlPressedRef.current &&
        !canPanWithoutCtrl()
      ) {
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
        canvas.calcOffset();
      }
      panning = false;
      if (!controlPressedRef.current) {
        wrap.classList.remove('fabric-canvas-wrap--pan');
      }
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

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = fabricRef.current;
    if (!wrap || !canvas || loading) {
      return;
    }

    let lastPinchDistance = 0;
    let pinching = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinching = true;
        lastPinchDistance = touchDistance(event.touches[0], event.touches[1]);
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pinching || event.touches.length !== 2) {
        return;
      }
      event.preventDefault();
      const distance = touchDistance(event.touches[0], event.touches[1]);
      if (lastPinchDistance > 0) {
        const rect = wrap.getBoundingClientRect();
        const center = touchCenterPoint(
          event.touches[0],
          event.touches[1],
          rect,
        );
        const scaleFactor = distance / lastPinchDistance;
        applyZoom(userZoomScaleRef.current * scaleFactor, center);
      }
      lastPinchDistance = distance;
    };

    const endPinch = () => {
      if (pinching) {
        pinching = false;
        lastPinchDistance = 0;
        canvas.calcOffset();
        canvas.requestRenderAll();
      }
    };

    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchmove', onTouchMove, { passive: false });
    wrap.addEventListener('touchend', endPinch);
    wrap.addEventListener('touchcancel', endPinch);

    return () => {
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchmove', onTouchMove);
      wrap.removeEventListener('touchend', endPinch);
      wrap.removeEventListener('touchcancel', endPinch);
    };
  }, [loading, applyZoom]);

  const addText = () => {
    const canvas = fabricRef.current;
    const wrap = wrapRef.current;
    if (!canvas || readOnly) return;
    exitDrawMode();
    const text = new IText('Escribe aquí…', {
      fontSize: 24,
      fill: defaultTextFillRef.current,
      fontFamily: CANVAS_FONT_FAMILY,
      objectCaching: false,
    });
    canvas.add(text);
    placeObjectAtVisibleCenter(text, canvas, wrap);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addRect = () => {
    const canvas = fabricRef.current;
    const wrap = wrapRef.current;
    if (!canvas || readOnly) return;
    exitDrawMode();
    const rect = new Rect({
      width: 160,
      height: 100,
      fill: defaultShapeFillRef.current,
      stroke: defaultShapeStrokeRef.current,
      strokeWidth: 2,
    });
    canvas.add(rect);
    placeObjectAtVisibleCenter(rect, canvas, wrap);
    canvas.setActiveObject(rect);
    canvas.renderAll();
  };

  const addCircle = () => {
    const canvas = fabricRef.current;
    const wrap = wrapRef.current;
    if (!canvas || readOnly) return;
    exitDrawMode();
    const circle = new Circle({
      radius: 50,
      fill: defaultShapeFillRef.current,
      stroke: defaultShapeStrokeRef.current,
      strokeWidth: 2,
    });
    canvas.add(circle);
    placeObjectAtVisibleCenter(circle, canvas, wrap);
    canvas.setActiveObject(circle);
    canvas.renderAll();
  };

  const removeSelected = async () => {
    const canvas = fabricRef.current;
    if (!canvas || readOnly) return;
    exitDrawMode();
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
    const wrap = wrapRef.current;
    if (!canvas || readOnly) return;
    exitDrawMode();
    setBusy(true);
    setMessage(null);
    try {
      const uploaded = await uploadMedia(ownerUsername, moodboardId, file);
      const blob = URL.createObjectURL(file);
      trackBlobUrl(blob);
      const img = await FabricImage.fromURL(blob);
      img.set({
        scaleX: 0.5,
        scaleY: 0.5,
      });
      img.set(EDIARY_ASSET_ID, uploaded.assetId);
      img.set(EDIARY_MEDIA_OWNER, ownerUsername);
      img.set(EDIARY_MOODBOARD_ID, moodboardId);
      canvas.add(img);
      placeObjectAtVisibleCenter(img, canvas, wrap);
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
          <button
            type="button"
            className={editorMode === 'draw' ? 'is-active' : undefined}
            onClick={toggleDrawMode}
            disabled={loading || busy}
          >
            <img src={iconDraw} alt="" />
            Dibujar
          </button>
          <button type="button" onClick={addRect} disabled={loading || busy}>
            <img src={iconRect} alt="" />
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
          <div className="fabric-color-controls">
            <ColorPickerButton
              label="Fondo"
              value={backgroundColor}
              disabled={loading || busy}
              onChange={handleBackgroundColorChange}
            />
            <ColorPickerButton
              label="Relleno"
              value={fillColor}
              disabled={loading || busy || !fillControlEnabled}
              onChange={handleFillColorChange}
            />
            <ColorPickerButton
              label="Borde"
              value={strokeColor}
              disabled={loading || busy || !strokeControlEnabled}
              onChange={handleStrokeColorChange}
            />
          </div>
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
        <span className="fabric-zoom-hint fabric-zoom-hint--desktop">
          Rueda del ratón · Ctrl + arrastrar para mover
        </span>
        <span className="fabric-zoom-hint fabric-zoom-hint--mobile">
          Pellizca para zoom · Arrastra el fondo para mover
        </span>
      </div>
      {loading && <p className="fabric-status">Cargando lienzo…</p>}
      {message && <p className="fabric-status">{message}</p>}
      <div className="fabric-canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}

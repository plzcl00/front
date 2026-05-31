import type { Canvas } from 'fabric';

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

export function getCanvasContentBounds(canvas: Canvas) {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  let left = 0;
  let top = 0;
  let right = canvasWidth;
  let bottom = canvasHeight;

  for (const obj of canvas.getObjects()) {
    if (obj.visible === false) {
      continue;
    }
    const rect = obj.getBoundingRect();
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.left + rect.width);
    bottom = Math.max(bottom, rect.top + rect.height);
  }

  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

type ExportCanvasOptions = {
  format?: 'png' | 'jpeg';
  multiplier?: number;
  quality?: number;
};

export function exportCanvasToBlob(
  canvas: Canvas,
  options: ExportCanvasOptions = {},
): Blob {
  const format = options.format ?? 'png';
  const multiplier = options.multiplier ?? 1;
  const quality = options.quality ?? 0.92;

  const prevVpt = canvas.viewportTransform?.slice() ?? [1, 0, 0, 1, 0, 0];
  const activeObject = canvas.getActiveObject();

  canvas.discardActiveObject();
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.renderAll();

  const bounds = getCanvasContentBounds(canvas);

  try {
    const dataUrl = canvas.toDataURL({
      format,
      quality,
      multiplier,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    });
    return dataUrlToBlob(dataUrl);
  } finally {
    canvas.setViewportTransform(prevVpt as [number, number, number, number, number, number]);
    if (activeObject) {
      canvas.setActiveObject(activeObject);
    }
    canvas.requestRenderAll();
  }
}

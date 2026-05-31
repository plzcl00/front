export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name: string): string {
  const trimmed = name.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/-+/g, '-');
  return trimmed || 'moodboard';
}

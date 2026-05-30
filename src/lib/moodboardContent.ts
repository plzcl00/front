import type { MoodboardContent } from '../types/api';

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 600;
export const FABRIC_ELEMENT_ID = 'main';
export const CANVAS_FONT_FAMILY = 'Montserrat, sans-serif';

export function createEmptyMoodboardContent(): MoodboardContent {
  return {
    version: 1,
    canvas: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      background: '#ffffff',
    },
    elements: [
      {
        id: FABRIC_ELEMENT_ID,
        type: 'fabric',
        fabricJson: {
          version: '7.4.0',
          objects: [],
          background: '#ffffff',
        },
      },
    ],
  };
}

export function extractFabricJson(
  content: MoodboardContent,
): Record<string, unknown> | null {
  const fabricEl = content.elements?.find(
    (el) => el.type === 'fabric' && el.id === FABRIC_ELEMENT_ID,
  );
  return fabricEl?.fabricJson ?? null;
}

export function buildContentFromFabric(
  fabricJson: Record<string, unknown>,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
): MoodboardContent {
  const background =
    typeof fabricJson.background === 'string'
      ? fabricJson.background
      : '#ffffff';

  return {
    version: 1,
    canvas: { width, height, background },
    elements: [
      {
        id: FABRIC_ELEMENT_ID,
        type: 'fabric',
        fabricJson,
      },
    ],
  };
}

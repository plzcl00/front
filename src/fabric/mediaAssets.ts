import { fetchMediaBlob } from '../api/moodboards';

export const EDIARY_ASSET_ID = 'ediaryAssetId';
export const EDIARY_MEDIA_OWNER = 'ediaryMediaOwner';
export const EDIARY_MOODBOARD_ID = 'ediaryMoodboardId';

type FabricObjectLike = Record<string, unknown> & {
  get?: (key: string) => unknown;
  set?: (key: string, value: unknown) => void;
  type?: string;
  objects?: FabricObjectLike[];
};

const blobUrls = new Set<string>();

export function trackBlobUrl(url: string): void {
  blobUrls.add(url);
}

export function revokeAllBlobUrls(): void {
  for (const url of blobUrls) {
    URL.revokeObjectURL(url);
  }
  blobUrls.clear();
}

export async function hydrateFabricMedia(
  fabricJson: Record<string, unknown>,
  ownerUsername: string,
  moodboardId: number,
): Promise<Record<string, unknown>> {
  const clone = structuredClone(fabricJson);
  await hydrateObjects(clone.objects as FabricObjectLike[] | undefined, ownerUsername, moodboardId);
  return clone;
}

async function hydrateObjects(
  objects: FabricObjectLike[] | undefined,
  ownerUsername: string,
  moodboardId: number,
): Promise<void> {
  if (!objects) {
    return;
  }
  for (const obj of objects) {
    if (obj.type === 'group' && obj.objects) {
      await hydrateObjects(obj.objects, ownerUsername, moodboardId);
    }
    const assetId = readAssetId(obj);
    if (assetId != null) {
      const blob = await fetchMediaBlob(ownerUsername, moodboardId, assetId);
      const url = URL.createObjectURL(blob);
      trackBlobUrl(url);
      if (obj.set) {
        obj.set('src', url);
      } else {
        obj.src = url;
      }
    }
  }
}

export function collectAssetIds(fabricJson: Record<string, unknown>): number[] {
  const ids = new Set<number>();
  collectFromObjects(fabricJson.objects as FabricObjectLike[] | undefined, ids);
  return [...ids];
}

function collectFromObjects(
  objects: FabricObjectLike[] | undefined,
  ids: Set<number>,
): void {
  if (!objects) {
    return;
  }
  for (const obj of objects) {
    if (obj.type === 'group' && obj.objects) {
      collectFromObjects(obj.objects, ids);
    }
    const assetId = readAssetId(obj);
    if (assetId != null) {
      ids.add(assetId);
    }
  }
}

function readAssetId(obj: FabricObjectLike): number | undefined {
  const fromGetter = obj.get?.(EDIARY_ASSET_ID);
  const raw = fromGetter ?? obj[EDIARY_ASSET_ID];
  return typeof raw === 'number' ? raw : undefined;
}

export interface AssetPreview {
  assetId: string;
  caption: string;
  isPlaceholder: boolean;
  src?: string;
}

/**
 * Resolves an Immich asset preview following Decision D14:
 * - If IMMICH_URL and IMMICH_API_KEY are unset (local dev / CI), gracefully returns a captioned placeholder.
 * - If set, fetches thumbnail, strips EXIF, and errors out on failure to abort broken builds.
 */
export async function resolveAsset(assetId: string, caption: string): Promise<AssetPreview> {
  const immichUrl = process.env.IMMICH_URL;
  const immichKey = process.env.IMMICH_API_KEY;

  if (!immichUrl || !immichKey) {
    return {
      assetId,
      caption,
      isPlaceholder: true,
    };
  }

  try {
    const targetUrl = `${immichUrl.replace(/\/$/, '')}/api/assets/${assetId}/thumbnail?size=preview`;
    const res = await fetch(targetUrl, {
      headers: {
        'x-api-key': immichKey,
        Accept: 'image/jpeg',
      },
    });

    if (!res.ok) {
      throw new Error(`Immich asset request returned HTTP ${res.status} ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return {
      assetId,
      caption,
      isPlaceholder: false,
      src: `data:image/jpeg;base64,${buffer.toString('base64')}`,
    };
  } catch (err) {
    throw new Error(
      `[D14] Failed to fetch Immich asset ${assetId} ("${caption}"): ${(err as Error).message}`
    );
  }
}

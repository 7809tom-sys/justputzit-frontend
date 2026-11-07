export type PhotoGps = { lat: number; lng: number; timestamp?: number };

/**
 * Reads the GPS coordinates embedded in a photo's EXIF data.
 * Returns null when the file carries no coordinates (or cannot be parsed).
 */
export async function extractPhotoGps(file: File): Promise<PhotoGps | null> {
  try {
    // Loaded dynamically to keep exifr out of the initial bundle.
    const exifr = await import("exifr");
    const result = await exifr.default.gps(file);
    if (!result || result.latitude == null || result.longitude == null) return null;

    const full = await exifr.default.parse(file, ["DateTimeOriginal", "CreateDate"]);
    const timestamp = full?.DateTimeOriginal ? new Date(full.DateTimeOriginal).getTime() : undefined;
    return { lat: result.latitude, lng: result.longitude, timestamp };
  } catch {
    return null;
  }
}

/**
 * Fallback for photos whose GPS metadata was stripped by the operating system:
 * asks the browser for the current position. Resolves null when unavailable,
 * denied, or timed out so the caller can show a retry message instead of hanging.
 */
export function readBrowserLocation(timeoutMs = 10_000): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs },
    );
  });
}

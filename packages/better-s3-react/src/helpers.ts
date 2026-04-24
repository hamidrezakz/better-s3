/**
 * Parses the filename from a `Content-Disposition` header value.
 * Prefers `filename*` (RFC 5987, full Unicode) over `filename`.
 * Returns `fallback` if no filename is found.
 */
export function parseContentDispositionFilename(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;
  const starMatch = header.match(/filename\*=UTF-8''([^;,\s]+)/i);
  if (starMatch) {
    try {
      return decodeURIComponent(starMatch[1]);
    } catch {
      // fall through
    }
  }
  const match = header.match(/filename="([^"]+)"/i);
  if (match) return match[1];
  return fallback;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

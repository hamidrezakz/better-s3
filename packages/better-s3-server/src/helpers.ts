/**
 * Builds a RFC 6266 `Content-Disposition` value for a file attachment.
 * Includes both the ASCII-safe `filename` fallback and the RFC 5987
 * `filename*` parameter for full Unicode support.
 *
 * @example
 * buildContentDisposition("résumé finale.pdf")
 * // → 'attachment; filename="resume finale.pdf"; filename*=UTF-8\'\'r%C3%A9sum%C3%A9%20finale.pdf'
 */
export function buildContentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function parseBody<T extends Record<string, unknown>>(
  request: Request,
): Promise<T | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as T) : null;
  } catch {
    return null;
  }
}

export function requireString(value: unknown, name: string): string | Response {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    return Response.json({ message: `${name} is required` }, { status: 400 });
  }
  return trimmed;
}

export function normalizeExpiresIn(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 600;
}

export function withS3ErrorHandler(
  handler: (request: Request) => Promise<Response>,
) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Internal server error";
      console.error("[S3 API]", message);
      return Response.json({ message }, { status: 500 });
    }
  };
}

/**
 * Run a server hook. Returns a Response if the hook rejects (throws),
 * or `null` if the hook passes (or is undefined).
 */
export async function runHook<T>(
  hook: ((context: T) => Promise<void> | void) | undefined,
  context: T,
): Promise<Response | null> {
  if (!hook) return null;
  try {
    await hook(context);
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Forbidden";
    const status =
      typeof (err as Record<string, unknown>)?.status === "number"
        ? ((err as Record<string, unknown>).status as number)
        : 403;
    return Response.json({ message }, { status });
  }
}

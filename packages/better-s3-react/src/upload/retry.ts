import { RETRY_BASE_DELAY } from "./constants";

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  signal?: AbortSignal,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      lastError = err;
      if (attempt < retries) {
        const delay = RETRY_BASE_DELAY * 2 ** attempt;
        await new Promise((r) => setTimeout(r, delay));
        if (signal?.aborted)
          throw new DOMException("Upload aborted", "AbortError");
      }
    }
  }
  throw lastError;
}

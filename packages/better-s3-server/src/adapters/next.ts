import { createRouter } from "../router";
import type { S3RouteHandlerConfig } from "../types";

/**
 * Creates a Next.js App Router catch-all route handler.
 *
 * Usage in `app/api/s3/[...s3]/route.ts`:
 * ```ts
 * import { createRouteHandler } from "@better-s3/server/next";
 *
 * const handler = createRouteHandler({ s3, defaultBucket: "my-bucket", basePath: "/api/s3" });
 * export { handler as GET, handler as POST, handler as DELETE };
 * ```
 */
export function createRouteHandler(config: S3RouteHandlerConfig) {
  return createRouter(config);
}

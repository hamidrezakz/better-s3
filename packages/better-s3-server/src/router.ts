import type { S3RouteHandlerConfig } from "./types";
import { createHandlers } from "./create-handlers";
import { runHook } from "./helpers";

export function createRouter(config: S3RouteHandlerConfig) {
  const handlers = createHandlers(config);
  const base = config.basePath.replace(/\/$/, "");

  return async (request: Request): Promise<Response> => {
    // Global guard — runs before every request
    const guardResult = await runHook(config.hooks?.guard, { request });
    if (guardResult) return guardResult;

    const url = new URL(request.url);
    const subpath = url.pathname.slice(base.length).replace(/^\//, "");
    const method = request.method;

    if (method === "POST" && subpath === "presign/upload")
      return handlers.presign.upload(request);
    if (method === "POST" && subpath === "presign/upload/confirm")
      return handlers.presign.confirm(request);
    if (method === "GET" && subpath === "presign/download")
      return handlers.presign.download(request);
    if (method === "DELETE" && subpath === "delete")
      return handlers.delete(request);
    if (method === "POST" && subpath === "presign/multipart/init")
      return handlers.multipart.init(request);
    if (method === "POST" && subpath === "presign/multipart/part")
      return handlers.multipart.part(request);
    if (method === "POST" && subpath === "presign/multipart/complete")
      return handlers.multipart.complete(request);
    if (method === "POST" && subpath === "presign/multipart/abort")
      return handlers.multipart.abort(request);

    return Response.json({ message: "Not Found" }, { status: 404 });
  };
}

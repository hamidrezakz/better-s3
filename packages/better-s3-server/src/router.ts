import type { S3RouteHandlerConfig } from "./types";
import { createHandlers } from "./create-handlers";
import { runHook } from "./helpers";

const disabled = () => Response.json({ message: "Not Found" }, { status: 404 });

export function createRouter(config: S3RouteHandlerConfig) {
  const handlers = createHandlers(config);
  const base = config.basePath.replace(/\/$/, "");
  const { features } = config;

  return async (request: Request): Promise<Response> => {
    // Global guard — runs before every request
    const guardResult = await runHook(config.hooks?.guard, { request });
    if (guardResult) return guardResult;

    const url = new URL(request.url);
    const subpath = url.pathname.slice(base.length).replace(/^\//, "");
    const method = request.method;

    if (method === "POST" && subpath === "presign/upload")
      return features.upload ? handlers.presign.upload(request) : disabled();
    if (method === "POST" && subpath === "presign/upload/confirm")
      return features.upload ? handlers.presign.confirm(request) : disabled();
    if (method === "GET" && subpath === "presign/download")
      return features.download
        ? handlers.presign.download(request)
        : disabled();
    if (method === "DELETE" && subpath === "delete")
      return features.delete ? handlers.delete(request) : disabled();
    if (method === "POST" && subpath === "presign/multipart/init")
      return features.multipart ? handlers.multipart.init(request) : disabled();
    if (method === "POST" && subpath === "presign/multipart/part")
      return features.multipart ? handlers.multipart.part(request) : disabled();
    if (method === "POST" && subpath === "presign/multipart/complete")
      return features.multipart
        ? handlers.multipart.complete(request)
        : disabled();
    if (method === "POST" && subpath === "presign/multipart/abort")
      return features.multipart
        ? handlers.multipart.abort(request)
        : disabled();

    return Response.json({ message: "Not Found" }, { status: 404 });
  };
}

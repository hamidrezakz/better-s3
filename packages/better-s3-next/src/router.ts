import type { S3HandlerConfig } from "./types";
import { createHandlers } from "./create-handlers";

export type RouteHandlerConfig = S3HandlerConfig & {
  basePath: string;
};

export function createRouteHandler(config: RouteHandlerConfig) {
  const handlers = createHandlers(config);
  const base = config.basePath.replace(/\/$/, "");

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const subpath = url.pathname.slice(base.length).replace(/^\//, "");
    const method = request.method;

    if (method === "POST" && subpath === "presign/upload")
      return handlers.upload(request);
    if (method === "GET" && subpath === "presign/download")
      return handlers.download(request);
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

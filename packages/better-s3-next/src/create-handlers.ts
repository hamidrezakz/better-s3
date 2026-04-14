import type { S3HandlerConfig } from "./types";
import { createUploadHandler } from "./handlers/upload";
import { createDownloadHandler } from "./handlers/download";
import { createDeleteHandler } from "./handlers/delete";
import { createMultipartInitHandler } from "./handlers/multipart-init";
import { createMultipartPartHandler } from "./handlers/multipart-part";
import { createMultipartCompleteHandler } from "./handlers/multipart-complete";
import { createMultipartAbortHandler } from "./handlers/multipart-abort";

export function createHandlers(config: S3HandlerConfig) {
  return {
    upload: createUploadHandler(config),
    download: createDownloadHandler(config),
    delete: createDeleteHandler(config),
    multipart: {
      init: createMultipartInitHandler(config),
      part: createMultipartPartHandler(config),
      complete: createMultipartCompleteHandler(config),
      abort: createMultipartAbortHandler(config),
    },
  };
}

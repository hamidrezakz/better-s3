import type { S3HandlerConfig, S3Handlers } from "./types";
import { createUploadHandler } from "./handlers/presign/upload";
import { createDownloadHandler } from "./handlers/presign/download";
import { createDeleteHandler } from "./handlers/delete";
import { createMultipartInitHandler } from "./handlers/multipart/init";
import { createMultipartPartHandler } from "./handlers/multipart/part";
import { createMultipartCompleteHandler } from "./handlers/multipart/complete";
import { createMultipartAbortHandler } from "./handlers/multipart/abort";

export function createHandlers(config: S3HandlerConfig): S3Handlers {
  return {
    presign: {
      upload: createUploadHandler(config),
      download: createDownloadHandler(config),
    },
    multipart: {
      init: createMultipartInitHandler(config),
      part: createMultipartPartHandler(config),
      complete: createMultipartCompleteHandler(config),
      abort: createMultipartAbortHandler(config),
    },
    delete: createDeleteHandler(config),
  };
}

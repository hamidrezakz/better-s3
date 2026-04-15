import type { S3Client } from "@better-s3/core";

export type S3HandlerConfig = {
  s3: S3Client;
  defaultBucket: string;
};

export type S3RouteHandlerConfig = S3HandlerConfig & {
  basePath: string;
};

export type S3Handler = (request: Request) => Promise<Response>;

export type S3Handlers = {
  presign: {
    upload: S3Handler;
    download: S3Handler;
  };
  multipart: {
    init: S3Handler;
    part: S3Handler;
    complete: S3Handler;
    abort: S3Handler;
  };
  delete: S3Handler;
};

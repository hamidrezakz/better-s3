import type {
  UploadConfig,
  UploadProgress,
  UploadResult,
  UploadRequestOptions,
} from "../types";
import type { S3Api } from "@better-s3/server";
import {
  DEFAULT_MULTIPART_THRESHOLD,
  DEFAULT_CONCURRENT_PARTS,
  DEFAULT_PART_SIZE,
  MAX_RETRIES,
} from "./constants";
import { withRetry } from "./retry";
import { uploadSimple } from "./simple";
import { uploadMultipart } from "./multipart";

export type UploadEngineCallbacks = {
  onProgress?: (progress: UploadProgress) => void;
};

export async function uploadFile(
  api: S3Api,
  file: File,
  objectKey: string,
  config: UploadConfig = {},
  callbacks: UploadEngineCallbacks = {},
  signal?: AbortSignal,
  requestOptions?: UploadRequestOptions,
): Promise<UploadResult> {
  const threshold = config.multipartThreshold ?? DEFAULT_MULTIPART_THRESHOLD;
  const useMultipart = config.multipart === true && file.size >= threshold;
  const concurrentParts = config.concurrentParts ?? DEFAULT_CONCURRENT_PARTS;
  const contentType = requestOptions?.contentType ?? file.type;

  let eTag: string | undefined;

  if (useMultipart) {
    eTag = await uploadMultipart(
      api,
      file,
      objectKey,
      DEFAULT_PART_SIZE,
      concurrentParts,
      callbacks.onProgress,
      signal,
      requestOptions,
    );
  } else {
    await withRetry(
      async () => {
        const presign = await api.upload({
          key: objectKey,
          contentType,
          fileSize: file.size,
          fileName:
            requestOptions?.fileName !== null
              ? (requestOptions?.fileName ?? file.name)
              : undefined,
          metadata: requestOptions?.metadata,
          bucket: requestOptions?.bucket,
          acl: requestOptions?.acl,
        });
        await uploadSimple(
          file,
          presign.url,
          presign.fields,
          callbacks.onProgress,
          signal,
        );
      },
      MAX_RETRIES,
      signal,
    );

    const confirmed = await api.confirm({
      key: objectKey,
      bucket: requestOptions?.bucket,
    });
    eTag = confirmed.eTag;
  }

  return { key: objectKey, eTag };
}

import type { UploadConfig, UploadProgress, UploadResult } from "../types";
import type { PresignApi } from "../presign-api";
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
  presignApi: PresignApi,
  file: File,
  objectKey: string,
  config: UploadConfig = {},
  callbacks: UploadEngineCallbacks = {},
  signal?: AbortSignal,
): Promise<UploadResult> {
  const threshold = config.multipartThreshold ?? DEFAULT_MULTIPART_THRESHOLD;
  const useMultipart = config.multipart === true && file.size >= threshold;
  const concurrentParts = config.concurrentParts ?? DEFAULT_CONCURRENT_PARTS;

  let eTag: string | undefined;

  if (useMultipart) {
    await uploadMultipart(
      presignApi,
      file,
      objectKey,
      DEFAULT_PART_SIZE,
      concurrentParts,
      callbacks.onProgress,
      signal,
    );
  } else {
    eTag = await withRetry(
      async () => {
        const presign = await presignApi.upload({
          key: objectKey,
          contentType: file.type,
        });
        return uploadSimple(file, presign.url, callbacks.onProgress, signal);
      },
      MAX_RETRIES,
      signal,
    );
  }

  return { key: objectKey, eTag };
}

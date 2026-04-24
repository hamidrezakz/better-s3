import type { UploadProgress, UploadRequestOptions } from "../types";
import type { S3Api } from "@better-s3/server";
import { MAX_RETRIES } from "./constants";
import { withRetry } from "./retry";
import { uploadPart } from "./part";

export async function uploadMultipart(
  api: S3Api,
  file: File,
  objectKey: string,
  partSize: number,
  concurrentParts: number,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal,
  requestOptions?: UploadRequestOptions,
): Promise<string | undefined> {
  const contentType = requestOptions?.contentType ?? file.type;
  const { uploadId, key } = await api.multipart.init({
    key: objectKey,
    contentType,
    fileSize: file.size,
    metadata: requestOptions?.metadata,
    bucket: requestOptions?.bucket,
    acl: requestOptions?.acl,
  });

  const totalParts = Math.ceil(file.size / partSize);
  const parts: Array<{ partNumber: number; eTag: string }> = [];

  const partProgress: Array<{ bytes: number }> = Array.from(
    { length: totalParts },
    () => ({ bytes: 0 }),
  );

  const reportProgress = () => {
    const loaded = partProgress.reduce((sum, p) => sum + p.bytes, 0);
    onProgress?.({
      loaded,
      total: file.size,
      percent: Math.round((loaded / file.size) * 100),
    });
  };

  try {
    for (
      let batchStart = 0;
      batchStart < totalParts;
      batchStart += concurrentParts
    ) {
      if (signal?.aborted) {
        throw new DOMException("Upload aborted", "AbortError");
      }

      const batchEnd = Math.min(batchStart + concurrentParts, totalParts);
      const batch: Array<Promise<{ partNumber: number; eTag: string }>> = [];

      for (let i = batchStart; i < batchEnd; i++) {
        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const blob = file.slice(start, end);
        const partNumber = i + 1;

        batch.push(
          withRetry(
            async () => {
              const { presignedUrl } = await api.multipart.signPart({
                key,
                uploadId,
                partNumber,
                bucket: requestOptions?.bucket,
              });

              partProgress[i].bytes = 0;

              const eTag = await uploadPart(
                blob,
                presignedUrl,
                partProgress[i],
                file.size,
                reportProgress,
                signal,
              );

              return { partNumber, eTag: eTag.replace(/"/g, "") };
            },
            MAX_RETRIES,
            signal,
          ),
        );
      }

      const batchResults = await Promise.all(batch);
      parts.push(...batchResults);
    }

    parts.sort((a, b) => a.partNumber - b.partNumber);

    const result = await api.multipart.complete({
      key,
      uploadId,
      parts,
      bucket: requestOptions?.bucket,
    });
    onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
    return result.eTag;
  } catch (err) {
    api.multipart
      .abort({ key, uploadId, bucket: requestOptions?.bucket })
      .catch(() => {});
    throw err;
  }
}

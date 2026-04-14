import type { UploadProgress } from "../types";
import type { PresignApi } from "../presign-api";
import { MAX_RETRIES } from "./constants";
import { withRetry } from "./retry";
import { uploadPart } from "./part";

export async function uploadMultipart(
  presignApi: PresignApi,
  file: File,
  objectKey: string,
  partSize: number,
  concurrentParts: number,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { uploadId, key } = await presignApi.multipart.init({
    key: objectKey,
    contentType: file.type,
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
              const { presignedUrl } = await presignApi.multipart.signPart({
                key,
                uploadId,
                partNumber,
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

    await presignApi.multipart.complete({ key, uploadId, parts });
    onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
  } catch (err) {
    presignApi.multipart.abort({ key, uploadId }).catch(() => {});
    throw err;
  }
}

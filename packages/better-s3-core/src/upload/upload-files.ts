import type { UploadConfig, UploadProgress, UploadResult } from "../types";
import type { PresignApi } from "../presign-api";
import { DEFAULT_CONCURRENT_FILES } from "./constants";
import { uploadFile } from "./upload-file";

export type FileItemStatus = "pending" | "uploading" | "success" | "error";

export type FileItem = {
  id: string;
  file: File;
  objectKey: string;
  status: FileItemStatus;
  progress: UploadProgress;
  result: UploadResult | null;
  error: string | null;
};

export type MultiUploadCallbacks = {
  onFileProgress?: (id: string, progress: UploadProgress) => void;
  onFileSuccess?: (id: string, result: UploadResult) => void;
  onFileError?: (id: string, error: string) => void;
  onTotalProgress?: (progress: UploadProgress) => void;
};

export async function uploadFiles(
  presignApi: PresignApi,
  items: Array<{ id: string; file: File; objectKey: string }>,
  config: UploadConfig = {},
  callbacks: MultiUploadCallbacks = {},
  signal?: AbortSignal,
): Promise<FileItem[]> {
  const results: FileItem[] = items.map((item) => ({
    ...item,
    status: "pending" as FileItemStatus,
    progress: { loaded: 0, total: item.file.size, percent: 0 },
    result: null,
    error: null,
  }));

  const reportTotalProgress = () => {
    const loaded = results.reduce((sum, r) => sum + r.progress.loaded, 0);
    const total = results.reduce((sum, r) => sum + r.progress.total, 0);
    callbacks.onTotalProgress?.({
      loaded,
      total,
      percent: total > 0 ? Math.round((loaded / total) * 100) : 0,
    });
  };

  let nextIndex = 0;

  const processNext = async (): Promise<void> => {
    while (nextIndex < results.length) {
      if (signal?.aborted) return;
      const idx = nextIndex++;
      const item = results[idx];

      item.status = "uploading";

      try {
        const result = await uploadFile(
          presignApi,
          item.file,
          item.objectKey,
          config,
          {
            onProgress: (progress) => {
              item.progress = progress;
              callbacks.onFileProgress?.(item.id, progress);
              reportTotalProgress();
            },
          },
          signal,
        );
        item.status = "success";
        item.result = result;
        item.progress = {
          loaded: item.file.size,
          total: item.file.size,
          percent: 100,
        };
        callbacks.onFileSuccess?.(item.id, result);
        reportTotalProgress();
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          item.status = "error";
          item.error = "Upload cancelled";
          return;
        }
        const message = err instanceof Error ? err.message : "Upload failed";
        item.status = "error";
        item.error = message;
        callbacks.onFileError?.(item.id, message);
        reportTotalProgress();
      }
    }
  };

  const concurrentFiles = config.concurrentFiles ?? DEFAULT_CONCURRENT_FILES;
  const workers = Array.from(
    { length: Math.min(concurrentFiles, items.length) },
    () => processNext(),
  );
  await Promise.all(workers);

  return results;
}

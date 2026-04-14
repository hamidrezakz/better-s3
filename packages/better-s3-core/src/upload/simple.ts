import type { UploadProgress } from "../types";

export function uploadSimple(
  file: File,
  presignedUrl: string,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException("Upload aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress?.({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    });

    xhr.addEventListener("load", () => {
      signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ loaded: file.size, total: file.size, percent: 100 });
        const eTag = xhr.getResponseHeader("ETag")?.replace(/"/g, "");
        resolve(eTag ?? undefined);
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Upload failed: network error"));
    });

    xhr.addEventListener("abort", () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Upload aborted", "AbortError"));
    });

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.send(file);
  });
}

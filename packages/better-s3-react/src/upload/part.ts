export function uploadPart(
  blob: Blob,
  presignedUrl: string,
  partLoaded: { bytes: number },
  totalSize: number,
  reportProgress: () => void,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException("Upload aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        partLoaded.bytes = e.loaded;
        reportProgress();
      }
    });

    xhr.addEventListener("load", () => {
      signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        partLoaded.bytes = blob.size;
        reportProgress();
        const eTag = xhr.getResponseHeader("ETag") ?? "";
        resolve(eTag);
      } else {
        reject(new Error(`Part upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Part upload failed: network error"));
    });

    xhr.addEventListener("abort", () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Upload aborted", "AbortError"));
    });

    xhr.open("PUT", presignedUrl);
    xhr.send(blob);
  });
}

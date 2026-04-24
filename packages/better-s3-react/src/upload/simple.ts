import type { UploadProgress } from "../types";

/**
 * Uploads a file directly to S3 using a presigned POST form.
 *
 * All policy fields (acl, Content-Type, content-length-range, signature, etc.)
 * are embedded in `fields` and must be appended to the FormData **before** the
 * file — this is an S3 requirement.  The size constraint is enforced by S3 at
 * the storage layer, so the server never needs to re-validate it.
 */
export function uploadSimple(
  file: File,
  url: string,
  fields: Record<string, string>,
  onProgress?: (progress: UploadProgress) => void,
  signal?: AbortSignal,
): Promise<void> {
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
        resolve();
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

    // S3 presigned POST: policy fields must come before the file field.
    const formData = new FormData();
    for (const [k, v] of Object.entries(fields)) {
      formData.append(k, v);
    }
    formData.append("file", file);

    xhr.open("POST", url);
    xhr.send(formData);
  });
}

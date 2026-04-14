import type {
  PresignResponse,
  MultipartInitResponse,
  MultipartPartResponse,
} from "./types";

export type PresignApi = {
  upload: (payload: {
    key: string;
    contentType?: string;
    metadata?: Record<string, string>;
  }) => Promise<PresignResponse>;
  download: (key: string, fileName?: string) => Promise<PresignResponse>;
  delete: (
    key: string,
  ) => Promise<{ success: boolean; bucket: string; key: string }>;
  multipart: {
    init: (payload: {
      key: string;
      contentType?: string;
      metadata?: Record<string, string>;
    }) => Promise<MultipartInitResponse>;
    signPart: (payload: {
      key: string;
      uploadId: string;
      partNumber: number;
    }) => Promise<MultipartPartResponse>;
    complete: (payload: {
      key: string;
      uploadId: string;
      parts: Array<{ partNumber: number; eTag: string }>;
    }) => Promise<{ key: string; bucket: string; uploadId: string }>;
    abort: (payload: {
      key: string;
      uploadId: string;
    }) => Promise<{ aborted: boolean }>;
  };
};

export function createPresignApi(basePath = "/api/s3"): PresignApi {
  const base = basePath.replace(/\/$/, "");

  const json = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? res.statusText);
    }
    return res.json() as Promise<T>;
  };

  const post = <T>(url: string, body: unknown): Promise<T> =>
    json<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  return {
    upload(payload) {
      return post<PresignResponse>(`${base}/presign/upload`, payload);
    },

    download(key, fileName?) {
      const params = new URLSearchParams({ key });
      if (fileName) {
        const safe = fileName.replace(/["\\\r\n]/g, "_");
        params.set("fileName", safe);
      }
      return json<PresignResponse>(`${base}/presign/download?${params}`);
    },

    delete(key) {
      return json<{ success: boolean; bucket: string; key: string }>(
        `${base}/delete?key=${encodeURIComponent(key)}`,
        { method: "DELETE" },
      );
    },

    multipart: {
      init(payload) {
        return post<MultipartInitResponse>(
          `${base}/presign/multipart/init`,
          payload,
        );
      },

      signPart(payload) {
        return post<MultipartPartResponse>(
          `${base}/presign/multipart/part`,
          payload,
        );
      },

      complete(payload) {
        return post<{ key: string; bucket: string; uploadId: string }>(
          `${base}/presign/multipart/complete`,
          payload,
        );
      },

      abort(payload) {
        return post<{ aborted: boolean }>(
          `${base}/presign/multipart/abort`,
          payload,
        );
      },
    },
  };
}

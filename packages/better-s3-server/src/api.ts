export type PresignResponse = {
  key: string;
  bucket: string;
  url: string;
  expiresIn: number;
};

export type PresignedPostResponse = {
  key: string;
  bucket: string;
  url: string;
  fields: Record<string, string>;
  expiresIn: number;
};

export type MultipartInitResponse = {
  key: string;
  bucket: string;
  uploadId: string;
};

export type MultipartPartResponse = {
  presignedUrl: string;
  partNumber: number;
  uploadId: string;
  bucket: string;
  expiresIn: number;
};

export type UploadConfirmResponse = {
  key: string;
  bucket: string;
  contentType?: string;
  contentLength: number;
  eTag?: string;
};

export type S3Api = {
  upload: (payload: {
    key: string;
    contentType?: string;
    /**
     * Exact byte size of the file. When provided the presigned POST policy
     * locks `content-length-range` to `[fileSize, fileSize]` so S3 rejects
     * uploads of any other size at the storage layer.
     */
    fileSize?: number;
    metadata?: Record<string, string>;
    bucket?: string;
    acl?: "private" | "public-read";
  }) => Promise<PresignedPostResponse>;
  confirm: (payload: {
    key: string;
    bucket?: string;
  }) => Promise<UploadConfirmResponse>;
  download: (
    key: string,
    options?: { fileName?: string; bucket?: string },
  ) => Promise<PresignResponse>;
  delete: (
    key: string,
    options?: { bucket?: string },
  ) => Promise<{ success: boolean; bucket: string; key: string }>;
  multipart: {
    init: (payload: {
      key: string;
      contentType?: string;
      /** Declared total byte size of the file. Used for quota/guard checks and stored in `onInit` context. */
      fileSize?: number;
      metadata?: Record<string, string>;
      bucket?: string;
      acl?: "private" | "public-read";
    }) => Promise<MultipartInitResponse>;
    signPart: (payload: {
      key: string;
      uploadId: string;
      partNumber: number;
      bucket?: string;
    }) => Promise<MultipartPartResponse>;
    complete: (payload: {
      key: string;
      uploadId: string;
      parts: Array<{ partNumber: number; eTag: string }>;
      bucket?: string;
    }) => Promise<{
      key: string;
      bucket: string;
      uploadId: string;
      contentLength: number;
      contentType?: string;
      eTag?: string;
    }>;
    abort: (payload: {
      key: string;
      uploadId: string;
      bucket?: string;
    }) => Promise<{ aborted: boolean }>;
  };
};

export function createS3Api(basePath = "/api/s3"): S3Api {
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
      return post<PresignedPostResponse>(`${base}/presign/upload`, payload);
    },

    confirm(payload) {
      return post<UploadConfirmResponse>(
        `${base}/presign/upload/confirm`,
        payload,
      );
    },

    download(key, options?) {
      const params = new URLSearchParams({ key });
      if (options?.fileName) {
        const safe = options.fileName.replace(/["\\\r\n]/g, "_");
        params.set("fileName", safe);
      }
      if (options?.bucket) params.set("bucket", options.bucket);
      return json<PresignResponse>(`${base}/presign/download?${params}`);
    },

    delete(key, options?) {
      const params = new URLSearchParams({ key });
      if (options?.bucket) params.set("bucket", options.bucket);
      return json<{ success: boolean; bucket: string; key: string }>(
        `${base}/delete?${params}`,
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
        return post<{
          key: string;
          bucket: string;
          uploadId: string;
          contentLength: number;
          contentType?: string;
          eTag?: string;
        }>(`${base}/presign/multipart/complete`, payload);
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

"use client";

import { useCallback, useRef, useState } from "react";
import type { S3Api } from "@better-s3/server";
import { parseContentDispositionFilename } from "./helpers";

export type FetchDownloadPhase =
  | "idle"
  | "presigning"
  | "downloading"
  | "success"
  | "error";

export type FetchDownloadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type FetchDownloadHooks = {
  beforeDownload?: (key: string) => Promise<boolean> | boolean;
  onDownloadStart?: (key: string) => void;
  onProgress?: (key: string, progress: FetchDownloadProgress) => void;
  onSuccess?: (key: string, fileName: string) => Promise<void> | void;
  onError?: (key: string, error: unknown, phase: FetchDownloadPhase) => void;
  onCancel?: (key: string) => void;
};

export type UseFetchDownloadOptions = FetchDownloadHooks & {
  api: S3Api;
  /** Target bucket (overrides server default) */
  bucket?: string;
};

export type UseFetchDownloadState = {
  phase: FetchDownloadPhase;
  progress: FetchDownloadProgress;
  error: string | null;
  fileName: string | null;
  fileSize: number | null;
};

export type UseFetchDownloadReturn = UseFetchDownloadState & {
  download: (key: string, downloadName?: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

const INITIAL_PROGRESS: FetchDownloadProgress = {
  loaded: 0,
  total: 0,
  percent: 0,
};

const INITIAL_STATE: UseFetchDownloadState = {
  phase: "idle",
  progress: INITIAL_PROGRESS,
  error: null,
  fileName: null,
  fileSize: null,
};

export function useFetchDownload(
  options: UseFetchDownloadOptions,
): UseFetchDownloadReturn {
  const [state, setState] = useState<UseFetchDownloadState>(INITIAL_STATE);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const abortRef = useRef<AbortController | null>(null);

  const download = useCallback(async (key: string, downloadName?: string) => {
    const fallback = key.split("/").pop() ?? key;
    const opts = optionsRef.current;

    if (opts.beforeDownload) {
      const allowed = await opts.beforeDownload(key);
      if (!allowed) {
        setState((s) => ({
          ...s,
          phase: "error",
          error: "Download blocked by beforeDownload hook",
        }));
        opts.onError?.(key, new Error("blocked"), "presigning");
        return;
      }
    }

    setState({
      phase: "presigning",
      progress: INITIAL_PROGRESS,
      error: null,
      fileName: downloadName ?? null,
      fileSize: null,
    });

    try {
      const { url } = await opts.api.download(key, {
        fileName: downloadName,
        bucket: opts.bucket,
      });

      setState((s) => ({ ...s, phase: "downloading" }));
      opts.onDownloadStart?.(key);

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? "File not found"
            : `Download failed (${res.status})`,
        );
      }

      const contentLength = Number(res.headers.get("content-length") || 0);
      const name =
        downloadName ??
        parseContentDispositionFilename(
          res.headers.get("content-disposition"),
          fallback,
        );
      setState((s) => ({
        ...s,
        fileName: name,
        fileSize: contentLength || null,
      }));

      const reader = res.body?.getReader();
      if (!reader) throw new Error("ReadableStream not supported");

      const chunks: BlobPart[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.byteLength;
        const percent =
          contentLength > 0 ? Math.round((loaded / contentLength) * 100) : 0;
        const progress: FetchDownloadProgress = {
          loaded,
          total: contentLength,
          percent,
        };
        setState((s) => ({ ...s, progress }));
        opts.onProgress?.(key, progress);
      }

      const blob = new Blob(chunks);
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = name ?? fallback;
      anchor.click();
      URL.revokeObjectURL(blobUrl);

      setState((s) => ({
        ...s,
        phase: "success",
        fileSize: blob.size,
        progress: { loaded: blob.size, total: blob.size, percent: 100 },
      }));
      await opts.onSuccess?.(key, name ?? fallback);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        opts.onCancel?.(key);
        setState(INITIAL_STATE);
        return;
      }
      const message = err instanceof Error ? err.message : "Download failed";
      setState((s) => ({ ...s, phase: "error", error: message }));
      opts.onError?.(key, err, "downloading");
    } finally {
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, download, cancel, reset };
}

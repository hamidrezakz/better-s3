"use client";

import { useCallback, useRef, useState } from "react";
import type {
  PresignApi,
  DownloadPhase,
  DownloadProgress,
  DownloadHooks,
} from "@better-s3/core";

export type UseDownloadOptions = DownloadHooks & {
  presignApi: PresignApi;
  /**
   * `"native"` — browser handles download natively via presigned URL (default)
   * `"fetch"`  — streams via fetch, enables in-app progress tracking
   */
  mode?: "native" | "fetch";
};

export type UseDownloadState = {
  phase: DownloadPhase;
  progress: DownloadProgress;
  error: string | null;
  fileName: string | null;
  fileSize: number | null;
};

export type UseDownloadReturn = UseDownloadState & {
  download: (key: string, downloadName?: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

const INITIAL_PROGRESS: DownloadProgress = { loaded: 0, total: 0, percent: 0 };

const INITIAL_STATE: UseDownloadState = {
  phase: "idle",
  progress: INITIAL_PROGRESS,
  error: null,
  fileName: null,
  fileSize: null,
};

export function useDownload(options: UseDownloadOptions): UseDownloadReturn {
  const [state, setState] = useState<UseDownloadState>(INITIAL_STATE);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const abortRef = useRef<AbortController | null>(null);

  const download = useCallback(async (key: string, downloadName?: string) => {
    const name = downloadName ?? key.split("/").pop() ?? key;
    const opts = optionsRef.current;
    const mode = opts.mode ?? "native";

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
      fileName: name,
      fileSize: null,
    });

    try {
      const { url } = await opts.presignApi.download(key, name);

      if (mode === "native") {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = name;
        anchor.click();
        setState((s) => ({ ...s, phase: "success" }));
        await opts.onSuccess?.(key);
        setState(INITIAL_STATE);
        return;
      }

      // ── Fetch mode ───────────────────────────────────────────────
      setState((s) => ({ ...s, phase: "downloading" }));
      opts.onDownloadStart?.(key);

      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

      const contentLength = Number(res.headers.get("content-length") || 0);
      setState((s) => ({ ...s, fileSize: contentLength || null }));

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
        const progress: DownloadProgress = {
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
      anchor.download = name;
      anchor.click();
      URL.revokeObjectURL(blobUrl);

      setState((s) => ({
        ...s,
        phase: "success",
        fileSize: blob.size,
        progress: { loaded: blob.size, total: blob.size, percent: 100 },
      }));
      await opts.onSuccess?.(key);
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

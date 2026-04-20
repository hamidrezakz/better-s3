"use client";

import { useCallback, useRef, useState } from "react";
import type { S3Api } from "@better-s3/server";

export type DownloadPhase = "idle" | "downloading" | "success" | "error";

export type DownloadHooks = {
  beforeDownload?: (key: string) => Promise<boolean> | boolean;
  onSuccess?: (key: string) => Promise<void> | void;
  onError?: (key: string, error: unknown) => void;
};

export type UseDownloadOptions = DownloadHooks & {
  api: S3Api;
  /** Target bucket (overrides server default) */
  bucket?: string;
};

export type UseDownloadState = {
  phase: DownloadPhase;
  error: string | null;
  fileName: string | null;
};

export type UseDownloadReturn = UseDownloadState & {
  download: (key: string, downloadName?: string) => Promise<void>;
  reset: () => void;
};

const INITIAL_STATE: UseDownloadState = {
  phase: "idle",
  error: null,
  fileName: null,
};

export function useDownload(options: UseDownloadOptions): UseDownloadReturn {
  const [state, setState] = useState<UseDownloadState>(INITIAL_STATE);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const download = useCallback(async (key: string, downloadName?: string) => {
    const name = downloadName ?? key.split("/").pop() ?? key;
    const opts = optionsRef.current;

    if (opts.beforeDownload) {
      const allowed = await opts.beforeDownload(key);
      if (!allowed) {
        setState({
          phase: "error",
          error: "Download blocked by beforeDownload hook",
          fileName: name,
        });
        opts.onError?.(key, new Error("blocked"));
        return;
      }
    }

    setState({ phase: "downloading", error: null, fileName: name });

    try {
      const { url } = await opts.api.download(key, {
        fileName: name,
        bucket: opts.bucket,
      });

      // Fetch as blob so the download attribute works correctly
      // (cross-origin presigned URLs ignore anchor.download).
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? "File not found"
            : `Download failed (${res.status})`,
        );
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = name;
      anchor.click();
      URL.revokeObjectURL(blobUrl);

      setState({ phase: "success", error: null, fileName: name });
      await opts.onSuccess?.(key);
      setState(INITIAL_STATE);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setState({ phase: "error", error: message, fileName: name });
      opts.onError?.(key, err);
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { ...state, download, reset };
}

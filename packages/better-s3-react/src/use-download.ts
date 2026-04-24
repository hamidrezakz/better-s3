"use client";

import { useCallback, useRef, useState } from "react";
import type { S3Api } from "@better-s3/server";

/** "presigning" = fetching the presigned URL from the server; download itself is native */
export type DownloadPhase = "idle" | "presigning" | "error";

export type DownloadHooks = {
  beforeDownload?: (key: string) => Promise<boolean> | boolean;
  /** Fires as soon as the browser has been handed the URL — not when download completes. */
  onInitiated?: (key: string) => void;
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
};

export type UseDownloadReturn = UseDownloadState & {
  download: (key: string, downloadName?: string) => Promise<void>;
  reset: () => void;
};

const INITIAL_STATE: UseDownloadState = {
  phase: "idle",
  error: null,
};

export function useDownload(options: UseDownloadOptions): UseDownloadReturn {
  const [state, setState] = useState<UseDownloadState>(INITIAL_STATE);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const download = useCallback(async (key: string, downloadName?: string) => {
    const opts = optionsRef.current;

    if (opts.beforeDownload) {
      const allowed = await opts.beforeDownload(key);
      if (!allowed) {
        setState({
          phase: "error",
          error: "Download blocked by beforeDownload hook",
        });
        opts.onError?.(key, new Error("blocked"));
        return;
      }
    }

    setState({ phase: "presigning", error: null });

    try {
      const { url } = await opts.api.download(key, {
        fileName: downloadName,
        bucket: opts.bucket,
      });

      // Native browser download — no fetch, no RAM usage.
      // S3 uses the Content-Disposition stored at upload time for the filename.
      // Pass downloadName only if the caller explicitly wants to override it.
      const anchor = document.createElement("a");
      anchor.href = url;
      if (downloadName) anchor.download = downloadName;
      anchor.click();

      setState(INITIAL_STATE);
      opts.onInitiated?.(key);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setState({ phase: "error", error: message });
      opts.onError?.(key, err);
    }
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { ...state, download, reset };
}

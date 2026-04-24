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
  /** Presigned URL — set after a successful presign, cleared on reset */
  url: string | null;
  /** Validity window in seconds for the presigned URL */
  expiresIn: number | null;
};

export type UseDownloadReturn = UseDownloadState & {
  download: (key: string, downloadName?: string) => Promise<void>;
  /** Fetch the presigned URL without triggering a browser download — for headless use */
  presign: (
    key: string,
    downloadName?: string,
  ) => Promise<{ url: string; expiresIn: number } | null>;
  reset: () => void;
};

const INITIAL_STATE: UseDownloadState = {
  phase: "idle",
  error: null,
  url: null,
  expiresIn: null,
};

export function useDownload(options: UseDownloadOptions): UseDownloadReturn {
  const [state, setState] = useState<UseDownloadState>(INITIAL_STATE);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const presign = useCallback(async (key: string, downloadName?: string) => {
    const opts = optionsRef.current;
    setState({ phase: "presigning", error: null, url: null, expiresIn: null });
    try {
      const result = await opts.api.download(key, {
        fileName: downloadName,
        bucket: opts.bucket,
      });
      setState({
        phase: "idle",
        error: null,
        url: result.url,
        expiresIn: result.expiresIn,
      });
      return { url: result.url, expiresIn: result.expiresIn };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setState({ phase: "error", error: message, url: null, expiresIn: null });
      opts.onError?.(key, err);
      return null;
    }
  }, []);

  const download = useCallback(
    async (key: string, downloadName?: string) => {
      const opts = optionsRef.current;

      if (opts.beforeDownload) {
        const allowed = await opts.beforeDownload(key);
        if (!allowed) {
          setState({
            phase: "error",
            error: "Download blocked by beforeDownload hook",
            url: null,
            expiresIn: null,
          });
          opts.onError?.(key, new Error("blocked"));
          return;
        }
      }

      const result = await presign(key, downloadName);
      if (!result) return; // presign already set error state

      // Native browser download via location — server sets Content-Disposition: attachment.
      window.location.href = result.url;

      opts.onInitiated?.(key);
    },
    [presign],
  );

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { ...state, download, presign, reset };
}

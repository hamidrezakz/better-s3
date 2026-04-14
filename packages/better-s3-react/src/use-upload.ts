"use client";

import { useCallback, useRef, useState } from "react";
import type {
  PresignApi,
  UploadConfig,
  UploadHooks,
  UploadPhase,
  UploadProgress,
  UploadResult,
} from "@better-s3/core";
import { uploadFile, validateFile } from "@better-s3/core";

export type UseUploadOptions = UploadConfig &
  UploadHooks & {
    presignApi: PresignApi;
  };

export type UseUploadState = {
  phase: UploadPhase;
  progress: UploadProgress;
  error: string | null;
  result: UploadResult | null;
  fileName: string | null;
  fileSize: number | null;
};

export type UseUploadReturn = UseUploadState & {
  upload: (file: File, objectKey: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

const INITIAL_PROGRESS: UploadProgress = { loaded: 0, total: 0, percent: 0 };

const INITIAL_STATE: UseUploadState = {
  phase: "idle",
  progress: INITIAL_PROGRESS,
  error: null,
  result: null,
  fileName: null,
  fileSize: null,
};

export function useUpload(options: UseUploadOptions): UseUploadReturn {
  const [state, setState] = useState<UseUploadState>(INITIAL_STATE);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File, objectKey: string) => {
    setState({
      ...INITIAL_STATE,
      phase: "validating",
      fileName: file.name,
      fileSize: file.size,
    });
    const opts = optionsRef.current;

    const validationError = validateFile(file, {
      accept: opts.accept,
      maxFileSize: opts.maxFileSize,
    });
    if (validationError) {
      setState((s) => ({ ...s, phase: "error", error: validationError }));
      opts.onError?.(file, new Error(validationError), "validating");
      return;
    }

    if (opts.beforeUpload) {
      const allowed = await opts.beforeUpload(file);
      if (!allowed) {
        setState((s) => ({
          ...s,
          phase: "error",
          error: "Upload blocked by beforeUpload hook",
        }));
        opts.onError?.(file, new Error("blocked"), "validating");
        return;
      }
    }

    setState((s) => ({ ...s, phase: "uploading" }));
    opts.onUploadStart?.(file, objectKey);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await uploadFile(
        opts.presignApi,
        file,
        objectKey,
        {
          multipart: opts.multipart,
          multipartThreshold: opts.multipartThreshold,
          concurrentParts: opts.concurrentParts,
        },
        {
          onProgress: (progress) => {
            setState((s) => ({ ...s, progress }));
            opts.onProgress?.(file, progress);
          },
        },
        controller.signal,
      );

      setState((s) => ({
        ...s,
        phase: "success",
        result,
        progress: { loaded: file.size, total: file.size, percent: 100 },
      }));
      await opts.onSuccess?.(file, result);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        opts.onCancel?.(file);
        setState(INITIAL_STATE);
        return;
      }
      const message = err instanceof Error ? err.message : "Upload failed";
      setState((s) => ({ ...s, phase: "error", error: message }));
      opts.onError?.(file, err, "uploading");
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

  return { ...state, upload, cancel, reset };
}

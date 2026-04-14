"use client";

import { useCallback, useRef, useState } from "react";
import type {
  PresignApi,
  UploadConfig,
  UploadProgress,
  UploadResult,
  MultiUploadPhase,
  MultiUploadFileState,
  MultiUploadHooks,
} from "@better-s3/core";
import { uploadFiles, validateFile } from "@better-s3/core";

export type UseMultiUploadOptions = UploadConfig &
  MultiUploadHooks & {
    presignApi: PresignApi;
  };

export type UseMultiUploadState = {
  phase: MultiUploadPhase;
  files: MultiUploadFileState[];
  totalProgress: UploadProgress;
  error: string | null;
};

export type UseMultiUploadReturn = UseMultiUploadState & {
  upload: (files: File[], resolveKey: (file: File) => string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

const INITIAL_PROGRESS: UploadProgress = { loaded: 0, total: 0, percent: 0 };

const INITIAL_STATE: UseMultiUploadState = {
  phase: "idle",
  files: [],
  totalProgress: INITIAL_PROGRESS,
  error: null,
};

let nextId = 0;
function generateId() {
  return `file-${++nextId}`;
}

export function useMultiUpload(
  options: UseMultiUploadOptions,
): UseMultiUploadReturn {
  const [state, setState] = useState<UseMultiUploadState>(INITIAL_STATE);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const abortRef = useRef<AbortController | null>(null);
  const fileMapRef = useRef<Map<string, File>>(new Map());

  const upload = useCallback(
    async (files: File[], resolveKey: (file: File) => string) => {
      const opts = optionsRef.current;

      const items: Array<{
        id: string;
        file: File;
        objectKey: string;
      }> = [];
      const fileStates: MultiUploadFileState[] = [];
      const fileMap = new Map<string, File>();

      setState((s) => ({ ...s, phase: "validating", error: null }));

      if (opts.maxFiles && files.length > opts.maxFiles) {
        const msg = `Too many files. Maximum is ${opts.maxFiles}.`;
        setState((s) => ({ ...s, phase: "error", error: msg }));
        opts.onError?.(new Error(msg));
        return;
      }

      for (const file of files) {
        const validationError = validateFile(file, {
          accept: opts.accept,
          maxFileSize: opts.maxFileSize,
        });
        if (validationError) {
          const msg = `${file.name}: ${validationError}`;
          setState((s) => ({ ...s, phase: "error", error: msg }));
          opts.onError?.(new Error(msg));
          return;
        }
      }

      if (opts.beforeUpload) {
        const allowed = await opts.beforeUpload(files);
        if (!allowed) {
          setState((s) => ({
            ...s,
            phase: "error",
            error: "Upload blocked by beforeUpload hook",
          }));
          opts.onError?.(new Error("blocked"));
          return;
        }
      }

      for (const file of files) {
        const id = generateId();
        const objectKey = resolveKey(file);
        items.push({ id, file, objectKey });
        fileMap.set(id, file);
        fileStates.push({
          id,
          fileName: file.name,
          fileSize: file.size,
          status: "pending",
          progress: { loaded: 0, total: file.size, percent: 0 },
          error: null,
        });
      }

      fileMapRef.current = fileMap;

      setState({
        phase: "uploading",
        files: fileStates,
        totalProgress: {
          loaded: 0,
          total: files.reduce((s, f) => s + f.size, 0),
          percent: 0,
        },
        error: null,
      });

      opts.onUploadStart?.(files);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const results = await uploadFiles(
          opts.presignApi,
          items,
          {
            multipart: opts.multipart,
            multipartThreshold: opts.multipartThreshold,
            concurrentParts: opts.concurrentParts,
            concurrentFiles: opts.concurrentFiles,
          },
          {
            onFileProgress: (id, progress) => {
              setState((s) => ({
                ...s,
                files: s.files.map((f) =>
                  f.id === id ? { ...f, status: "uploading", progress } : f,
                ),
              }));
              const file = fileMap.get(id);
              if (file) opts.onFileProgress?.(file, progress);
            },
            onFileSuccess: (id, result) => {
              setState((s) => ({
                ...s,
                files: s.files.map((f) =>
                  f.id === id
                    ? {
                        ...f,
                        status: "success",
                        progress: {
                          loaded: f.fileSize,
                          total: f.fileSize,
                          percent: 100,
                        },
                      }
                    : f,
                ),
              }));
              const file = fileMap.get(id);
              if (file) opts.onFileSuccess?.(file, result);
            },
            onFileError: (id, error) => {
              setState((s) => ({
                ...s,
                files: s.files.map((f) =>
                  f.id === id ? { ...f, status: "error", error } : f,
                ),
              }));
              const file = fileMap.get(id);
              if (file) opts.onFileError?.(file, error);
            },
            onTotalProgress: (progress) => {
              setState((s) => ({ ...s, totalProgress: progress }));
              opts.onProgress?.(progress);
            },
          },
          controller.signal,
        );

        const hasErrors = results.some((r) => r.status === "error");
        const successResults = results
          .filter((r) => r.result !== null)
          .map((r) => r.result!);

        setState((s) => ({
          ...s,
          phase: hasErrors ? "error" : "success",
          error: hasErrors
            ? `${results.filter((r) => r.status === "error").length} file(s) failed`
            : null,
          totalProgress: hasErrors
            ? s.totalProgress
            : {
                loaded: s.totalProgress.total,
                total: s.totalProgress.total,
                percent: 100,
              },
        }));

        if (!hasErrors) {
          await opts.onSuccess?.(successResults);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          opts.onCancel?.();
          setState(INITIAL_STATE);
          return;
        }
        const message = err instanceof Error ? err.message : "Upload failed";
        setState((s) => ({ ...s, phase: "error", error: message }));
        opts.onError?.(err);
      } finally {
        abortRef.current = null;
      }
    },
    [],
  );

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

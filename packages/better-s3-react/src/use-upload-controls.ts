"use client";

import { useRef, useState } from "react";
import type {
  UploadPhase,
  UploadProgress,
  UploadResult,
  UploadRequestOptions,
  MultiUploadFileState,
  MultiUploadPhase,
} from "./types";
import { useUpload, type UseUploadOptions } from "./use-upload";
import { useMultiUpload, type UseMultiUploadOptions } from "./use-multi-upload";
import type { S3Api } from "@better-s3/server";
import type { UploadConfig } from "./types";

const INITIAL_PROGRESS: UploadProgress = { loaded: 0, total: 0, percent: 0 };

export type UseUploadControlsOptions = UploadConfig & {
  api: S3Api;
  objectKey: string | ((file: File) => string);
  /**
   * Maximum number of files. When > 1 the hook switches to multi-upload mode
   * and the native file picker allows selecting multiple files.
   * @default 1
   */
  maxFiles?: number;
  /** Static request options applied to all files (multi mode) */
  uploadOptions?: UploadRequestOptions;
  /** Per-file request options */
  getUploadOptions?: (file: File) => UploadRequestOptions;
  // Callbacks – typed as a union to support both single and multi modes
  beforeUpload?:
    | ((file: File) => boolean | Promise<boolean>)
    | ((files: File[]) => boolean | Promise<boolean>);
  onUploadStart?:
    | ((file: File, key: string) => void)
    | ((files: File[]) => void);
  onProgress?:
    | ((file: File, progress: UploadProgress) => void)
    | ((progress: UploadProgress) => void);
  onSuccess?:
    | ((file: File, result: UploadResult) => void | Promise<void>)
    | ((results: UploadResult[]) => void | Promise<void>);
  onError?:
    | ((file: File | null, error: unknown, phase: UploadPhase) => void)
    | ((error: unknown) => void);
  onCancel?: ((file: File | null) => void) | (() => void);
  // Multi-only callbacks
  onFileProgress?: (file: File, progress: UploadProgress) => void;
  onFileSuccess?: (file: File, result: UploadResult) => void;
  onFileError?: (file: File, error: string) => void;
};

export type UseUploadControlsReturn = {
  /** Whether the hook is in single-file or multi-file mode */
  mode: "single" | "multi";
  phase: UploadPhase | MultiUploadPhase;
  /** Info about the selected file (single mode only) */
  fileInfo: { name: string; size: number } | null;
  /** Upload progress (single mode) */
  progress: UploadProgress;
  /** Per-file states (multi mode only) */
  files: MultiUploadFileState[];
  /** Aggregated progress across all files (multi mode) */
  totalProgress: UploadProgress;
  error: string | null;
  isUploading: boolean;
  handleFiles: (files: FileList | null) => void;
  openFilePicker: () => void;
  cancel: () => void;
  reset: () => void;
  /** Spread on a hidden `<input>` element */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    type: "file";
    multiple?: true;
    accept?: string;
    hidden: true;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  /** Spread on a container to enable drag-and-drop */
  dropHandlers: {
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
};

export function useUploadControls(
  options: UseUploadControlsOptions,
): UseUploadControlsReturn {
  const isMulti = (options.maxFiles ?? 1) > 1;

  // Build per-mode options. Both hooks are called unconditionally (React rules).
  const singleOpts: UseUploadOptions = {
    api: options.api,
    accept: options.accept,
    maxFileSize: options.maxFileSize,
    multipart: options.multipart,
    multipartThreshold: options.multipartThreshold,
    concurrentParts: options.concurrentParts,
    beforeUpload: options.beforeUpload as UseUploadOptions["beforeUpload"],
    onUploadStart: options.onUploadStart as UseUploadOptions["onUploadStart"],
    onProgress: options.onProgress as UseUploadOptions["onProgress"],
    onSuccess: options.onSuccess as UseUploadOptions["onSuccess"],
    onError: options.onError as UseUploadOptions["onError"],
    onCancel: options.onCancel as UseUploadOptions["onCancel"],
  };

  const multiOpts: UseMultiUploadOptions = {
    api: options.api,
    accept: options.accept,
    maxFileSize: options.maxFileSize,
    maxFiles: options.maxFiles,
    multipart: options.multipart,
    multipartThreshold: options.multipartThreshold,
    concurrentParts: options.concurrentParts,
    concurrentFiles: options.concurrentFiles,
    uploadOptions: options.uploadOptions,
    getUploadOptions: options.getUploadOptions,
    beforeUpload: options.beforeUpload as UseMultiUploadOptions["beforeUpload"],
    onUploadStart:
      options.onUploadStart as UseMultiUploadOptions["onUploadStart"],
    onProgress: options.onProgress as UseMultiUploadOptions["onProgress"],
    onSuccess: options.onSuccess as UseMultiUploadOptions["onSuccess"],
    onError: options.onError as UseMultiUploadOptions["onError"],
    onCancel: options.onCancel as UseMultiUploadOptions["onCancel"],
    onFileProgress: options.onFileProgress,
    onFileSuccess: options.onFileSuccess,
    onFileError: options.onFileError,
  };

  const single = useUpload(singleOpts);
  const multi = useMultiUpload(multiOpts);

  const inputRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const resolveKey = (file: File): string =>
    typeof options.objectKey === "function"
      ? options.objectKey(file)
      : options.objectKey;

  const handleFiles = async (files: FileList | null) => {
    if (isMulti) {
      if (!files?.length) return;
      await multi.upload(Array.from(files), resolveKey);
    } else {
      const file = files?.[0];
      if (!file) return;
      setFileInfo({ name: file.name, size: file.size });
      await single.upload(
        file,
        resolveKey(file),
        options.getUploadOptions?.(file),
      );
    }
  };

  const openFilePicker = () => inputRef.current?.click();
  const isUploading = isMulti
    ? multi.phase === "uploading"
    : single.phase === "uploading";

  return {
    mode: isMulti ? "multi" : "single",
    phase: isMulti ? multi.phase : single.phase,
    fileInfo: isMulti ? null : fileInfo,
    progress: isMulti ? INITIAL_PROGRESS : single.progress,
    files: isMulti ? multi.files : [],
    totalProgress: isMulti ? multi.totalProgress : INITIAL_PROGRESS,
    error: isMulti ? multi.error : single.error,
    isUploading,
    handleFiles,
    openFilePicker,
    cancel: isMulti ? multi.cancel : single.cancel,
    reset: isMulti
      ? multi.reset
      : () => {
          single.reset();
          setFileInfo(null);
        },
    inputProps: {
      ref: inputRef,
      type: "file",
      ...(isMulti && { multiple: true as const }),
      accept: options.accept?.join(","),
      hidden: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        e.target.value = "";
      },
    },
    dropHandlers: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isUploading) handleFiles(e.dataTransfer.files);
      },
    },
  };
}

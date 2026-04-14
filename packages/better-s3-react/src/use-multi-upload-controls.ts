"use client";

import { useRef } from "react";
import type {
  UploadProgress,
  MultiUploadPhase,
  MultiUploadFileState,
} from "@better-s3/core";
import { useMultiUpload, type UseMultiUploadOptions } from "./use-multi-upload";

export type UseMultiUploadControlsOptions = UseMultiUploadOptions & {
  objectKey: (file: File) => string;
};

export type UseMultiUploadControlsReturn = {
  /** Current upload phase */
  phase: MultiUploadPhase;
  /** Per-file upload state */
  files: MultiUploadFileState[];
  /** Aggregated progress across all files */
  totalProgress: UploadProgress;
  /** Error message if upload failed */
  error: string | null;
  /** Whether an upload is currently in progress */
  isUploading: boolean;
  /** Trigger upload from a FileList (e.g. from a file input or drop event) */
  handleFiles: (files: FileList | null) => void;
  /** Open the native file picker dialog */
  openFilePicker: () => void;
  /** Cancel all uploads */
  cancel: () => void;
  /** Reset to idle state */
  reset: () => void;
  /** Spread on a hidden `<input>` element */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    type: "file";
    multiple: true;
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

export function useMultiUploadControls(
  options: UseMultiUploadControlsOptions,
): UseMultiUploadControlsReturn {
  const { objectKey, ...hookOptions } = options;
  const ctx = useMultiUpload(hookOptions);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    await ctx.upload(Array.from(files), objectKey);
  };

  const openFilePicker = () => inputRef.current?.click();

  const isUploading = ctx.phase === "uploading";

  return {
    phase: ctx.phase,
    files: ctx.files,
    totalProgress: ctx.totalProgress,
    error: ctx.error,
    isUploading,
    handleFiles,
    openFilePicker,
    cancel: ctx.cancel,
    reset: ctx.reset,
    inputProps: {
      ref: inputRef,
      type: "file",
      multiple: true,
      accept: hookOptions.accept?.join(","),
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

"use client";

import { useRef, useState } from "react";
import type { UploadPhase, UploadProgress } from "@better-s3/core";
import { useUpload, type UseUploadOptions } from "./use-upload";

export type UseUploadControlsOptions = UseUploadOptions & {
  objectKey: string | ((file: File) => string);
};

export type UseUploadControlsReturn = {
  /** Current upload phase */
  phase: UploadPhase;
  /** Upload progress (loaded, total, percent) */
  progress: UploadProgress;
  /** Error message if upload failed */
  error: string | null;
  /** Info about the selected file */
  fileInfo: { name: string; size: number } | null;
  /** Whether an upload is currently in progress */
  isUploading: boolean;
  /** Trigger upload from a FileList (e.g. from a file input or drop event) */
  handleFiles: (files: FileList | null) => void;
  /** Open the native file picker dialog */
  openFilePicker: () => void;
  /** Cancel the current upload */
  cancel: () => void;
  /** Reset to idle state */
  reset: () => void;
  /** Spread on a hidden `<input>` element */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    type: "file";
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
  const { objectKey, ...hookOptions } = options;
  const ctx = useUpload(hookOptions);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
  } | null>(null);

  const resolveKey = (file: File): string =>
    typeof objectKey === "function" ? objectKey(file) : objectKey;

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setFileInfo({ name: file.name, size: file.size });
    await ctx.upload(file, resolveKey(file));
  };

  const openFilePicker = () => inputRef.current?.click();

  const isUploading = ctx.phase === "uploading";

  return {
    phase: ctx.phase,
    progress: ctx.progress,
    error: ctx.error,
    fileInfo,
    isUploading,
    handleFiles,
    openFilePicker,
    cancel: ctx.cancel,
    reset: () => {
      ctx.reset();
      setFileInfo(null);
    },
    inputProps: {
      ref: inputRef,
      type: "file",
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

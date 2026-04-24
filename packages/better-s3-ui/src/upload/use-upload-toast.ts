"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatFileSize } from "@better-s3/react";

const truncateMsg = (msg: string, max = 100) =>
  msg.length > max ? msg.slice(0, max) + "…" : msg;
import type { UseUploadControlsReturn } from "@better-s3/react";

/**
 * Drives sonner toasts for upload progress/success/error.
 * Shared between UploadButton and UploadDropzone.
 */
export function useUploadToast(
  ctrl: Pick<
    UseUploadControlsReturn,
    | "mode"
    | "phase"
    | "fileInfo"
    | "progress"
    | "files"
    | "totalProgress"
    | "error"
    | "cancel"
  >,
  enabled: boolean,
) {
  const toastIdRef = useRef<string | null>(null);
  const isMulti = ctrl.mode === "multi";

  // Phase-transition toasts (runs synchronously during render to fire exactly once)
  const prevPhaseRef = useRef(ctrl.phase);
  if (prevPhaseRef.current !== ctrl.phase) {
    prevPhaseRef.current = ctrl.phase;
    if (enabled) {
      if (ctrl.phase === "idle" && toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      if (ctrl.phase === "success") {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        if (isMulti) {
          toast.success(`${ctrl.files.length} file(s) uploaded`, {
            description: formatFileSize(ctrl.totalProgress.total),
          });
        } else if (ctrl.fileInfo) {
          toast.success("Upload complete", {
            description: formatFileSize(ctrl.fileInfo.size),
          });
        }
        toastIdRef.current = null;
      }
      if (ctrl.phase === "error") {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        if (isMulti && ctrl.files.length > 0) {
          const succeeded = ctrl.files.filter(
            (f) => f.status === "success",
          ).length;
          const failed = ctrl.files.filter((f) => f.status === "error").length;
          toast.error("Upload finished with errors", {
            description: `${succeeded} succeeded, ${failed} failed`,
          });
        } else {
          toast.error("Upload failed", {
            description: truncateMsg(ctrl.error ?? "Unknown error"),
          });
        }
        toastIdRef.current = null;
      }
    }
  }

  // Progress toast (updated on each progress tick)
  useEffect(() => {
    if (!enabled || ctrl.phase !== "uploading") return;
    const id = toastIdRef.current ?? `upload-${Date.now()}`;
    toastIdRef.current = id;
    if (isMulti) {
      const done = ctrl.files.filter((f) => f.status === "success").length;
      toast.loading(`Uploading… ${done}/${ctrl.files.length}`, {
        id,
        description: `${formatFileSize(ctrl.totalProgress.loaded)} / ${formatFileSize(ctrl.totalProgress.total)} (${ctrl.totalProgress.percent}%)`,
        cancel: { label: "Cancel", onClick: () => ctrl.cancel() },
      });
    } else if (ctrl.fileInfo) {
      toast.loading("Uploading…", {
        id,
        description: `${formatFileSize(ctrl.progress.loaded)} / ${formatFileSize(ctrl.fileInfo.size)} (${ctrl.progress.percent}%)`,
        cancel: { label: "Cancel", onClick: () => ctrl.cancel() },
      });
    }
  }, [
    enabled,
    ctrl.phase,
    isMulti,
    ctrl.progress.loaded,
    ctrl.progress.percent,
    ctrl.totalProgress.loaded,
    ctrl.totalProgress.total,
    ctrl.totalProgress.percent,
    ctrl.fileInfo,
    ctrl.files,
    ctrl.cancel,
  ]);
}

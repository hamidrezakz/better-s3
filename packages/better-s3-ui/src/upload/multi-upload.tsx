"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { UploadIcon } from "lucide-react";
import { formatFileSize } from "@better-s3/core";
import type { UseMultiUploadOptions } from "@better-s3/react";
import { useMultiUploadControls } from "@better-s3/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MultiUploadStatus } from "./multi-upload-status";

export type MultiUploadProps = UseMultiUploadOptions & {
  objectKey: (file: File) => string;
  variant?: "button" | "dropzone";
  className?: string;
  label?: string;
  disabled?: boolean;
  tooltipText?: string;
  /** Enable sonner toasts (default: `true`) */
  toast?: boolean;
  /** Show inline status below the trigger (default: `true`) */
  showStatus?: boolean;
};

export function MultiUpload({
  variant = "button",
  objectKey,
  className,
  label,
  disabled,
  tooltipText = "Upload files",
  toast: enableToast = true,
  showStatus = true,
  ...options
}: MultiUploadProps) {
  const ctrl = useMultiUploadControls({ ...options, objectKey });
  const toastIdRef = useRef<string | null>(null);
  const isDisabled = disabled || ctrl.isUploading;

  // ── Toast ─────────────────────────────────────────────────────────

  const prevPhaseRef = useRef(ctrl.phase);
  if (prevPhaseRef.current !== ctrl.phase) {
    prevPhaseRef.current = ctrl.phase;
    if (enableToast) {
      if (ctrl.phase === "idle" && toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      if (ctrl.phase === "success") {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        toast.success(`${ctrl.files.length} file(s) uploaded`, {
          description: formatFileSize(ctrl.totalProgress.total),
        });
        toastIdRef.current = null;
      }
      if (ctrl.phase === "error" && ctrl.files.length > 0) {
        const succeeded = ctrl.files.filter(
          (f) => f.status === "success",
        ).length;
        const failed = ctrl.files.filter((f) => f.status === "error").length;
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        toast.error("Upload finished with errors", {
          description: `${succeeded} succeeded, ${failed} failed`,
        });
        toastIdRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (enableToast && ctrl.phase === "uploading") {
      const id = toastIdRef.current ?? `multi-upload-${Date.now()}`;
      toastIdRef.current = id;
      const done = ctrl.files.filter((f) => f.status === "success").length;
      toast.loading(`Uploading… ${done}/${ctrl.files.length}`, {
        id,
        description: `${formatFileSize(ctrl.totalProgress.loaded)} / ${formatFileSize(ctrl.totalProgress.total)} (${ctrl.totalProgress.percent}%)`,
        cancel: { label: "Cancel", onClick: () => ctrl.cancel() },
      });
    }
  }, [
    enableToast,
    ctrl.phase,
    ctrl.totalProgress.percent,
    ctrl.totalProgress.loaded,
    ctrl.files,
    ctrl.cancel,
  ]);

  // ── Render ────────────────────────────────────────────────────────

  const status = showStatus ? (
    <MultiUploadStatus
      phase={ctrl.phase}
      files={ctrl.files}
      totalProgress={ctrl.totalProgress}
      error={ctrl.error}
      onCancel={ctrl.cancel}
    />
  ) : null;

  if (variant === "dropzone") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDisabled
            ? "cursor-not-allowed border-muted-foreground/25"
            : "cursor-pointer border-muted-foreground/25 hover:border-primary/50",
          className,
        )}
        onClick={isDisabled ? undefined : ctrl.openFilePicker}
        {...(isDisabled ? {} : ctrl.dropHandlers)}>
        <input {...ctrl.inputProps} />
        <UploadIcon
          className={cn(
            "size-6 text-muted-foreground",
            isDisabled && "opacity-50",
          )}
        />
        <p
          className={cn(
            "text-sm text-muted-foreground",
            isDisabled && "opacity-50",
          )}>
          {label ?? "Click or drag & drop files to upload"}
        </p>
        {status && <div className="w-full text-left">{status}</div>}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col gap-2", className)}>
      <div className="inline-flex items-center gap-2">
        <input {...ctrl.inputProps} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="default"
                  disabled={isDisabled}
                  onClick={ctrl.openFilePicker}
                />
              }>
              <UploadIcon data-icon="inline-start" />
              {label ?? "Upload files"}
            </TooltipTrigger>
            <TooltipContent>{tooltipText}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {status}
    </div>
  );
}

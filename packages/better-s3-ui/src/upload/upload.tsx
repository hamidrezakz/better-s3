"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { UploadIcon } from "lucide-react";
import { formatFileSize } from "@better-s3/core";
import type { UseUploadOptions } from "@better-s3/react";
import { useUploadControls } from "@better-s3/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UploadStatus } from "./upload-status";

export type UploadProps = UseUploadOptions & {
  objectKey: string | ((file: File) => string);
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

export function Upload({
  variant = "button",
  objectKey,
  className,
  label,
  disabled,
  tooltipText = "Upload file",
  toast: enableToast = true,
  showStatus = true,
  ...options
}: UploadProps) {
  const ctrl = useUploadControls({ ...options, objectKey });
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
      if (ctrl.phase === "success" && ctrl.fileInfo) {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        toast.success("Upload complete", {
          description: formatFileSize(ctrl.fileInfo.size),
        });
        toastIdRef.current = null;
      }
      if (ctrl.phase === "error") {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        toast.error("Upload failed", {
          description: ctrl.error ?? "Unknown error",
        });
        toastIdRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (enableToast && ctrl.phase === "uploading" && ctrl.fileInfo) {
      const id = toastIdRef.current ?? `upload-${Date.now()}`;
      toastIdRef.current = id;
      toast.loading("Uploading…", {
        id,
        description: `${formatFileSize(ctrl.progress.loaded)} / ${formatFileSize(ctrl.fileInfo.size)} (${ctrl.progress.percent}%)`,
        cancel: { label: "Cancel", onClick: () => ctrl.cancel() },
      });
    }
  }, [
    enableToast,
    ctrl.phase,
    ctrl.progress.percent,
    ctrl.progress.loaded,
    ctrl.fileInfo,
    ctrl.cancel,
  ]);

  // ── Render ────────────────────────────────────────────────────────

  const status = showStatus ? (
    <UploadStatus
      phase={ctrl.phase}
      progress={ctrl.progress}
      error={ctrl.error}
      fileInfo={ctrl.fileInfo}
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
          {label ?? "Click or drag & drop to upload"}
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
              {label ?? "Upload file"}
            </TooltipTrigger>
            <TooltipContent>{tooltipText}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {status}
    </div>
  );
}

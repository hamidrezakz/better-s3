"use client";

import { UploadIcon } from "lucide-react";
import type { UseUploadControlsOptions } from "@better-s3/react";
import { useUploadControls } from "@better-s3/react";
import { cn } from "@/lib/utils";
import { UploadStatus } from "./upload-status";
import { MultiUploadStatus } from "./multi-upload-status";
import { useUploadToast } from "./use-upload-toast";

export type UploadDropzoneProps = UseUploadControlsOptions & {
  className?: string;
  label?: string;
  disabled?: boolean;
  /** Enable sonner toasts (default: `true`) */
  toast?: boolean;
  /** Show inline status inside the dropzone (default: `true`) */
  showStatus?: boolean;
};

export function UploadDropzone({
  className,
  label,
  disabled,
  toast: enableToast = true,
  showStatus = true,
  ...options
}: UploadDropzoneProps) {
  const ctrl = useUploadControls(options);
  const isMulti = ctrl.mode === "multi";
  const isDisabled = disabled || ctrl.isUploading;

  useUploadToast(ctrl, enableToast);

  const status = showStatus ? (
    isMulti ? (
      <MultiUploadStatus
        phase={ctrl.phase}
        files={ctrl.files}
        totalProgress={ctrl.totalProgress}
        error={ctrl.error}
        onCancel={ctrl.cancel}
      />
    ) : (
      <UploadStatus
        phase={ctrl.phase}
        progress={ctrl.progress}
        error={ctrl.error}
        fileInfo={ctrl.fileInfo}
        onCancel={ctrl.cancel}
      />
    )
  ) : null;

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
        {label ??
          (isMulti
            ? "Click or drag & drop files to upload"
            : "Click or drag & drop to upload")}
      </p>
      {status && <div className="w-full text-left">{status}</div>}
    </div>
  );
}

"use client";

import { UploadIcon } from "lucide-react";
import type { UseUploadControlsOptions } from "@better-s3/react";
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
import { MultiUploadStatus } from "./multi-upload-status";
import { useUploadToast } from "./use-upload-toast";

export type UploadButtonProps = UseUploadControlsOptions & {
  className?: string;
  label?: string;
  disabled?: boolean;
  tooltipText?: string;
  /** Enable sonner toasts (default: `true`) */
  toast?: boolean;
  /** Show inline status below the button (default: `true`) */
  showStatus?: boolean;
};

export function UploadButton({
  className,
  label,
  disabled,
  tooltipText,
  toast: enableToast = true,
  showStatus = true,
  ...options
}: UploadButtonProps) {
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
              {label ?? (isMulti ? "Upload files" : "Upload file")}
            </TooltipTrigger>
            <TooltipContent>
              {tooltipText ?? (isMulti ? "Upload files" : "Upload file")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {status}
    </div>
  );
}

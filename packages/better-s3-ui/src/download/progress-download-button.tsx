"use client";

import { DownloadIcon, AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@better-s3/react";
import type { S3Api, FetchDownloadHooks } from "@better-s3/react";
import { useFetchDownload } from "@better-s3/react";

const truncateMsg = (msg: string, max = 100) =>
  msg.length > max ? msg.slice(0, max) + "…" : msg;
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ProgressDownloadButtonProps = FetchDownloadHooks & {
  api: S3Api;
  objectKey: string;
  fileName?: string;
  fileSize?: number;
  /** Target bucket (overrides server default) */
  bucket?: string;
  label?: string;
  className?: string;
  fillClassName?: string;
  disabled?: boolean;
  tooltipText?: string;
  /** Enable sonner toasts (default: `true`) */
  toast?: boolean;
  /** Show inline error status below the button (default: `true`) */
  showStatus?: boolean;
};

export function ProgressDownloadButton({
  api,
  objectKey,
  fileName,
  fileSize,
  bucket,
  label,
  className,
  fillClassName,
  disabled,
  tooltipText = "Download file",
  toast: enableToast = true,
  showStatus = true,
  beforeDownload,
  onDownloadStart,
  onProgress,
  onSuccess,
  onError,
  onCancel,
}: ProgressDownloadButtonProps) {
  const displayName = fileName ?? objectKey.split("/").pop() ?? objectKey;

  const dl = useFetchDownload({
    api,
    bucket,
    beforeDownload,
    onDownloadStart,
    onProgress,
    onSuccess: (key, actualFileName) => {
      if (enableToast) {
        toast.dismiss(`dl-${objectKey}`);
        toast.success("Download complete", {
          description: `${actualFileName}${fileSize != null ? ` · ${formatFileSize(fileSize)}` : ""}`,
        });
      }
      onSuccess?.(key, actualFileName);
    },
    onError: (key, error, phase) => {
      if (enableToast) {
        toast.dismiss(`dl-${objectKey}`);
        toast.error("Download failed", {
          description: truncateMsg(
            error instanceof Error ? error.message : "Unknown error",
          ),
        });
      }
      onError?.(key, error, phase);
    },
    onCancel: (key) => {
      if (enableToast) {
        toast.dismiss(`dl-${objectKey}`);
        toast.info("Download cancelled", { description: displayName });
      }
      onCancel?.(key);
    },
  });

  const isDownloading = dl.phase === "downloading" || dl.phase === "presigning";

  const handleClick = () => {
    if (isDownloading) {
      dl.cancel();
      return;
    }
    dl.download(objectKey, fileName);
  };

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="default"
                variant="outline"
                disabled={disabled}
                className={cn("relative min-w-24 overflow-hidden")}
                onClick={handleClick}
              />
            }>
            {isDownloading && (
              <span
                className={cn(
                  "absolute inset-0 bg-primary/15 transition-[width] duration-200",
                  fillClassName,
                )}
                style={{ width: `${dl.progress.percent}%` }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1">
              <DownloadIcon data-icon="inline-start" />
              {isDownloading
                ? formatFileSize(dl.progress.loaded)
                : (label ?? "Download")}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {isDownloading ? "Cancel download" : tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showStatus && dl.phase === "error" && (
        <div className="flex min-w-0 items-start gap-1.5 text-xs">
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="min-w-0 [overflow-wrap:anywhere] text-destructive">
            {dl.error ?? "Download failed"}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { XIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { formatFileSize } from "@better-s3/core";
import type { UploadPhase, UploadProgress } from "@better-s3/core";
import { Button } from "@/components/ui/button";
import { CircleProgress } from "@/components/ui/circle-progress";

export function UploadStatus({
  phase,
  progress,
  error,
  fileInfo,
  onCancel,
}: {
  phase: UploadPhase;
  progress: UploadProgress;
  error: string | null;
  fileInfo: { name: string; size: number } | null;
  onCancel?: () => void;
}) {
  if (phase === "idle") return null;

  if (phase === "uploading" && fileInfo) {
    return (
      <div className="flex w-full items-center gap-1.5 text-xs">
        <CircleProgress percent={progress.percent} size={14} strokeWidth={2} />
        <span className="max-w-32 min-w-16 truncate sm:max-w-48">
          {fileInfo.name}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {formatFileSize(progress.loaded)} / {formatFileSize(fileInfo.size)} (
          {progress.percent}%)
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-6 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onCancel?.();
          }}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
    );
  }

  if (phase === "success" && fileInfo) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <CheckCircleIcon className="size-3.5 shrink-0 text-green-600" />
        <span className="max-w-32 min-w-16 truncate sm:max-w-48">
          {fileInfo.name}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {formatFileSize(fileInfo.size)}
        </span>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1.5">
          <AlertCircleIcon className="size-3.5 shrink-0 text-destructive" />
          {fileInfo && (
            <>
              <span className="max-w-32 min-w-16 truncate sm:max-w-48">
                {fileInfo.name}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatFileSize(fileInfo.size)}
              </span>
            </>
          )}
        </div>
        <span className="text-destructive">{error ?? "Upload failed"}</span>
      </div>
    );
  }

  if (phase === "validating" || phase === "presigning") {
    return <span className="text-xs text-muted-foreground">Preparing…</span>;
  }

  return null;
}

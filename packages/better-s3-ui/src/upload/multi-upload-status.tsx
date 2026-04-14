"use client";

import { XIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { formatFileSize } from "@better-s3/core";
import type { UploadProgress, MultiUploadFileState } from "@better-s3/core";
import { Button } from "@/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { CircleProgress } from "@/components/ui/circle-progress";

export function MultiUploadStatus({
  phase,
  files,
  totalProgress,
  error,
  onCancel,
}: {
  phase: string;
  files: MultiUploadFileState[];
  totalProgress: UploadProgress;
  error: string | null;
  onCancel?: () => void;
}) {
  if (phase === "idle") return null;

  if (phase === "uploading") {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full items-center gap-1.5">
          <Progress value={totalProgress.percent} className="flex-1">
            <ProgressLabel>
              {files.filter((f) => f.status === "success").length}/
              {files.length} files
            </ProgressLabel>
            <ProgressValue />
          </Progress>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onCancel?.();
            }}>
            <XIcon className="size-4" />
          </Button>
        </div>
        <FileList files={files} />
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="flex w-full flex-col gap-1">
        <span className="text-xs text-green-600">
          All {files.length} file(s) uploaded
        </span>
        <FileList files={files} />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex w-full flex-col gap-1">
        <span className="text-xs text-destructive">
          {error ?? "Upload failed"}
        </span>
        {files.length > 0 && <FileList files={files} />}
      </div>
    );
  }

  if (phase === "validating") {
    return <span className="text-xs text-muted-foreground">Validating…</span>;
  }

  return null;
}

// ─── File List ──────────────────────────────────────────────────────────

function FileList({ files }: { files: MultiUploadFileState[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {files.map((f) => (
        <li key={f.id} className="flex flex-col gap-0.5 text-xs">
          <div className="flex items-center gap-1.5">
            {f.status === "success" && (
              <CheckCircleIcon className="size-3.5 shrink-0 text-green-600" />
            )}
            {f.status === "error" && (
              <AlertCircleIcon className="size-3.5 shrink-0 text-destructive" />
            )}
            {(f.status === "pending" || f.status === "uploading") && (
              <CircleProgress
                percent={f.status === "uploading" ? f.progress.percent : 0}
                size={14}
                strokeWidth={2}
              />
            )}
            <span className="max-w-32 min-w-16 truncate sm:max-w-48">
              {f.fileName}
            </span>
            {f.status === "uploading" ? (
              <span className="shrink-0 text-muted-foreground">
                {formatFileSize(f.progress.loaded)} /{" "}
                {formatFileSize(f.fileSize)} ({f.progress.percent}%)
              </span>
            ) : (
              <span className="shrink-0 text-muted-foreground">
                {formatFileSize(f.fileSize)}
              </span>
            )}
          </div>
          {f.status === "error" && f.error && (
            <span className="pl-5 text-destructive">{f.error}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

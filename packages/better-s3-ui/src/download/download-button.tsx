"use client";

import { DownloadIcon, LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { S3Api } from "@better-s3/react";
import { useDownload } from "@better-s3/react";
import { Button } from "@/components/ui/button";

type DownloadButtonProps = {
  api: S3Api;
  objectKey: string;
  fileName?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  /** Enable sonner toasts (default: `true`) */
  toast?: boolean;
};

export function DownloadButton({
  api,
  objectKey,
  fileName,
  label,
  className,
  disabled,
  toast: enableToast = true,
}: DownloadButtonProps) {
  const dl = useDownload({
    api,
    onInitiated: () => {
      if (enableToast) toast.success("Download started");
    },
    onError: (_key, error) => {
      if (enableToast) {
        toast.error("Download failed", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  });

  const isPending = dl.phase === "presigning";

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <Button
        size="default"
        variant="outline"
        disabled={disabled || isPending}
        onClick={() => dl.download(objectKey, fileName)}>
        <span className="inline-flex items-center gap-1">
          {isPending ? (
            <LoaderIcon className="animate-spin" data-icon="inline-start" />
          ) : (
            <DownloadIcon data-icon="inline-start" />
          )}
          {label ?? "Download"}
        </span>
      </Button>

      {dl.phase === "error" && (
        <span className="text-xs text-destructive">
          {dl.error ?? "Download failed"}
        </span>
      )}
    </div>
  );
}

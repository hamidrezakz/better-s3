"use client";

import {
  Trash2Icon,
  LoaderIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@better-s3/react";
import type { S3Api, DeleteHooks } from "@better-s3/react";
import { useDelete } from "@better-s3/react";

const truncateMsg = (msg: string, max = 100) =>
  msg.length > max ? msg.slice(0, max) + "…" : msg;
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DeleteButtonProps = DeleteHooks & {
  api: S3Api;
  objectKey: string;
  fileName?: string;
  fileSize?: number;
  /** Target bucket (overrides server default) */
  bucket?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  tooltipText?: string;
  /** Enable sonner toasts (default: `true`) */
  toast?: boolean;
  /** Show inline error status below the button (default: `true`) */
  showStatus?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
};

export function DeleteButton({
  api,
  objectKey,
  fileName,
  fileSize,
  bucket,
  label,
  className,
  disabled,
  tooltipText = "Delete file",
  toast: enableToast = true,
  showStatus = true,
  confirmTitle = "Delete file?",
  confirmDescription,
  beforeDelete,
  onDeleteStart,
  onSuccess,
  onError,
}: DeleteButtonProps) {
  const displayName = fileName ?? objectKey.split("/").pop() ?? objectKey;

  const del = useDelete({
    api,
    bucket,
    beforeDelete,
    onDeleteStart,
    onSuccess: (key) => {
      if (enableToast) {
        toast.success("File deleted", { description: displayName });
      }
      onSuccess?.(key);
    },
    onError: (key, error, phase) => {
      if (enableToast) {
        toast.error("Delete failed", {
          description: truncateMsg(
            error instanceof Error ? error.message : "Unknown error",
          ),
        });
      }
      onError?.(key, error, phase);
    },
  });

  const isDeleting = del.phase === "deleting";
  const isDisabled = disabled || isDeleting;

  const description =
    confirmDescription ??
    `Are you sure you want to delete "${displayName}"${fileSize != null ? ` (${formatFileSize(fileSize)})` : ""}? This action cannot be undone.`;

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <div className="inline-flex items-center gap-2">
        <AlertDialog
          open={del.phase === "confirming"}
          onOpenChange={(open) => {
            if (!open) del.cancelDelete();
          }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <AlertDialogTrigger
                    disabled={isDisabled}
                    onClick={() => del.requestDelete(objectKey)}
                    render={
                      <Button
                        size="default"
                        variant="destructive"
                        disabled={isDisabled}
                      />
                    }
                  />
                }>
                {isDeleting ? (
                  <LoaderIcon
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : (
                  <Trash2Icon data-icon="inline-start" />
                )}
                {label ?? "Delete"}
              </TooltipTrigger>
              <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <Trash2Icon />
              </AlertDialogMedia>
              <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => del.confirmDelete()}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {showStatus && del.phase === "success" && (
        <div className="flex min-w-0 items-center gap-1.5 text-xs">
          <CheckCircle2Icon className="size-3.5 shrink-0 text-green-600" />
          <p className="min-w-0 [overflow-wrap:anywhere] text-green-600">
            &ldquo;
            <span className="inline-block max-w-[14ch] truncate align-bottom">
              {displayName}
            </span>
            &rdquo; deleted
          </p>
        </div>
      )}

      {showStatus && del.phase === "error" && (
        <div className="flex min-w-0 items-start gap-1.5 text-xs">
          <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <p className="min-w-0 [overflow-wrap:anywhere] text-destructive">
            {del.error ?? "Delete failed"}
          </p>
        </div>
      )}
    </div>
  );
}

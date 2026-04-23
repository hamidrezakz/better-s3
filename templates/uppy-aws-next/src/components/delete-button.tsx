"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { s3Api } from "@/lib/s3";
import { cn } from "@/lib/utils";

type Phase = "idle" | "confirming" | "deleting" | "success" | "error";

type Props = {
  /** S3 object key to delete */
  objectKey: string;
  /** Called after successful deletion */
  onSuccess?: (key: string) => void;
  /** Extra CSS classes */
  className?: string;
};

/**
 * Delete button with an inline confirmation step.
 *
 * Flow: idle → confirming → deleting → success | error
 * A second click on the red "Confirm delete" button commits the operation.
 */
export function DeleteButton({ objectKey, onSuccess, className }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  function requestDelete() {
    setPhase("confirming");
    setError(null);
  }

  function cancelDelete() {
    setPhase("idle");
  }

  async function confirmDelete() {
    setPhase("deleting");
    try {
      await s3Api.delete(objectKey);
      setPhase("success");
      onSuccess?.(objectKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setPhase("error");
    }
  }

  if (phase === "success") {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Deleted.
      </span>
    );
  }

  if (phase === "confirming") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <AlertTriangle className="size-4 text-destructive" />
        <span className="text-sm">Delete this file?</span>
        <button
          onClick={confirmDelete}
          className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors">
          Confirm delete
        </button>
        <button
          onClick={cancelDelete}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={requestDelete}
        disabled={phase === "deleting"}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive",
          "hover:bg-destructive/10 transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}>
        {phase === "deleting" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
        {phase === "deleting" ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

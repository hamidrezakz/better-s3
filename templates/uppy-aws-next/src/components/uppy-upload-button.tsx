"use client";

import { useCallback, useRef, useState } from "react";
import { XIcon, UploadIcon, AlertCircleIcon } from "lucide-react";
import { useUppyEvent, useUppyState } from "@uppy/react";
import type { Uppy } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { CircleProgress } from "@/components/ui/circle-progress";
import { cn } from "@/lib/utils";
import { createUppyS3, type UppyS3Options } from "@/lib/uppy-s3";

// ─── Types ────────────────────────────────────────────────────────

export type UppyUploadButtonProps = UppyS3Options & {
  /** Whether to allow selecting multiple files (default: true) */
  multiple?: boolean;
  /** Accepted file types passed to the file input, e.g. "image/*" */
  accept?: string;
  /** Label shown in idle state (default: "Upload file") */
  label?: string;
  className?: string;
};

type Phase = "idle" | "ready" | "uploading" | "error";

// ─── Component ────────────────────────────────────────────────────

export function UppyUploadButton({
  multiple = true,
  accept,
  label = "Upload file",
  className,
  ...uppyOpts
}: UppyUploadButtonProps) {
  // Each button instance owns its Uppy instance.
  // Caller can pass onUploadSuccess / generateKey via props.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uppy] = useState<Uppy>(() => createUppyS3(uppyOpts) as any);

  return (
    <UppyUploadButtonInner
      uppy={uppy}
      multiple={multiple}
      accept={accept}
      label={label}
      className={className}
    />
  );
}

// ─── Inner (accepts an external Uppy instance) ────────────────────

export function UppyUploadButtonInner({
  uppy,
  multiple = true,
  accept,
  label = "Upload file",
  className,
}: {
  uppy: Uppy;
  multiple?: boolean;
  accept?: string;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reactive Uppy state
  const totalProgress = useUppyState(uppy, (s) => s.totalProgress);
  const files = useUppyState(uppy, (s) => s.files);

  // Build a lightweight list of {name, size} for display
  const fileList = Object.values(files).map((f) => ({
    id: f.id,
    name: f.name ?? "file",
    size: f.size ?? 0,
  }));
  const fileCount = fileList.length;

  // ── Uppy event handlers ──────────────────────────────────────────

  const onUpload = useCallback(() => setPhase("uploading"), []);

  const onComplete = useCallback(
    (result: { failed?: Array<{ error?: string }> }) => {
      const failed = result.failed ?? [];
      if (failed.length > 0) {
        setErrorMsg(failed[0]?.error ?? "Upload failed");
        setPhase("error");
      } else {
        // Success: reset silently — no confirmation state, just go back to idle
        uppy.cancelAll();
        setPhase("idle");
      }
    },
    [uppy],
  );

  const onFileRemoved = useCallback(() => {
    if (uppy.getFiles().length === 0) setPhase("idle");
  }, [uppy]);

  useUppyEvent(uppy, "upload", onUpload);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useUppyEvent(uppy, "complete", onComplete as any);
  useUppyEvent(uppy, "file-removed", onFileRemoved);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((f) => {
      try {
        uppy.addFile({
          source: "file input",
          name: f.name,
          type: f.type,
          data: f,
        });
      } catch {
        // duplicate / restriction violation — Uppy already warns in console
      }
    });
    e.target.value = "";
    if (uppy.getFiles().length > 0) setPhase("ready");
  };

  const handleButtonClick = () => {
    if (phase === "idle" || phase === "error") {
      setErrorMsg(null);
      uppy.cancelAll();
      setPhase("idle");
      inputRef.current?.click();
    } else if (phase === "ready") {
      void uppy.upload();
    }
  };

  const handleCancel = () => {
    uppy.cancelAll();
    setPhase("idle");
    setErrorMsg(null);
  };

  // ── Button label & variant ────────────────────────────────────────

  const buttonLabel =
    phase === "idle"
      ? label
      : phase === "ready"
        ? `Upload ${fileCount} file${fileCount !== 1 ? "s" : ""}`
        : phase === "uploading"
          ? `Uploading… ${totalProgress}%`
          : "Failed — try again";

  const buttonVariant =
    phase === "error" ? "destructive" : ("default" as const);

  const isDisabled = phase === "uploading";

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col items-start gap-1.5", className)}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
      />

      <div className="inline-flex items-center gap-2">
        {/* Main action button */}
        <Button
          variant={buttonVariant}
          onClick={handleButtonClick}
          disabled={isDisabled}>
          {phase === "uploading" ? (
            <CircleProgress percent={totalProgress} size={14} strokeWidth={2} />
          ) : (
            <UploadIcon />
          )}
          {buttonLabel}
        </Button>

        {/* Cancel — only visible while uploading */}
        {phase === "uploading" && (
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <XIcon />
          </Button>
        )}

        {/* Add more — only visible while in ready state */}
        {phase === "ready" && (
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            add more
          </button>
        )}
      </div>

      {/* Per-file status rows — visible while uploading */}
      {phase === "uploading" && fileList.length > 1 && (
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {fileList.map((f) => (
            <span key={f.id} className="max-w-64 truncate">
              {f.name}
            </span>
          ))}
        </div>
      )}

      {/* Error detail */}
      {phase === "error" && errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircleIcon className="size-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}

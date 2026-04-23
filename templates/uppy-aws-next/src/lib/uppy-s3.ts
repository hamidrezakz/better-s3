/* eslint-disable @typescript-eslint/no-explicit-any */
import Uppy from "@uppy/core";
import type { UppyFile, Meta, Body } from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { s3Api } from "@/lib/s3";

/** Files over this threshold use multipart upload. Must match server expectations. */
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50 MB

export type UppyS3Options = {
  /**
   * Called when a file finishes uploading successfully.
   * Receives the S3 key and the original file name.
   */
  onUploadSuccess?: (key: string, file: UppyFile<Meta, Body>) => void;
  /**
   * Override how the S3 key is generated from a file.
   * Default: `uploads/<timestamp>-<filename>`
   */
  generateKey?: (file: UppyFile<Meta, Body>) => string;
};

function defaultKey(file: UppyFile<Meta, Body>) {
  return `uploads/${Date.now()}-${file.name ?? "file"}`;
}

/**
 * Factory that creates a configured Uppy instance backed by @better-s3/server.
 *
 * Handles:
 *  - Simple uploads  (< MULTIPART_THRESHOLD) via presigned PUT
 *  - Multipart uploads (>= MULTIPART_THRESHOLD) via init/signPart/complete
 *  - Upload confirmation so the server `onComplete` hook fires
 *
 * Usage:
 *   const uppy = useMemo(() => createUppyS3({ onUploadSuccess }), []);
 *   useEffect(() => () => uppy.destroy(), [uppy]);
 */
export function createUppyS3(options: UppyS3Options = {}): Uppy {
  const { onUploadSuccess, generateKey = defaultKey } = options;

  // Track simple-upload keys by fileId
  const simpleKeyMap = new Map<string, string>();

  const uppy = new Uppy({
    autoProceed: false,
    restrictions: {
      maxNumberOfFiles: 20,
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5 GB
    },
  });

  uppy.use(AwsS3, {
    shouldUseMultipart: (file: UppyFile<Meta, Body>) =>
      (file.size ?? 0) >= MULTIPART_THRESHOLD,

    // ── Simple upload ─────────────────────────────────────────────
    async getUploadParameters(file: UppyFile<Meta, Body>) {
      const key = generateKey(file);
      simpleKeyMap.set(file.id, key);

      const { url } = await s3Api.upload({
        key,
        contentType: file.type || "application/octet-stream",
      });

      return {
        method: "PUT" as const,
        url,
        fields: {} as Record<string, never>,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      };
    },

    // ── Multipart: init ───────────────────────────────────────────
    async createMultipartUpload(file: UppyFile<Meta, Body>) {
      const key = generateKey(file);
      const { uploadId } = await s3Api.multipart.init({
        key,
        contentType: file.type || "application/octet-stream",
      });
      return { uploadId, key };
    },

    // ── Multipart: list parts (for resume support) ────────────────
    // Returning empty array means no resume; full resume requires a
    // server endpoint to list uploaded parts from S3.
    async listParts() {
      return [];
    },

    // ── Multipart: sign part ──────────────────────────────────────
    async signPart(
      _file: UppyFile<Meta, Body>,
      {
        uploadId,
        key,
        partNumber,
      }: { uploadId: string; key: string; partNumber: number },
    ) {
      const { presignedUrl } = await s3Api.multipart.signPart({
        key,
        uploadId,
        partNumber,
      });
      return { url: presignedUrl };
    },

    // ── Multipart: complete ───────────────────────────────────────
    async completeMultipartUpload(
      _file: UppyFile<Meta, Body>,
      {
        uploadId,
        key,
        parts,
      }: {
        uploadId: string;
        key: string;
        parts: Array<{ PartNumber?: number; ETag?: string }>;
      },
    ) {
      await s3Api.multipart.complete({
        key,
        uploadId,
        parts: parts
          .filter((p) => p.PartNumber !== undefined && p.ETag !== undefined)
          .map((p) => ({
            partNumber: p.PartNumber!,
            eTag: p.ETag!,
          })),
      });
      return {};
    },

    // ── Multipart: abort ──────────────────────────────────────────
    async abortMultipartUpload(
      _file: UppyFile<Meta, Body>,
      { uploadId, key }: { uploadId: string; key: string },
    ) {
      if (uploadId && key) {
        await s3Api.multipart.abort({ key, uploadId });
      }
    },
  } as any); // Uppy v5 plugin options — cast to bypass strict union discrimination

  // ── Post-upload hooks ─────────────────────────────────────────────
  uppy.on("upload-success", async (file, _response) => {
    if (!file) return;

    const key = simpleKeyMap.get(file.id);
    if (key) {
      // Confirm simple upload so @better-s3/server fires the onComplete hook
      try {
        await s3Api.confirm({ key });
      } catch (e) {
        console.warn("[uppy-s3] confirm failed", e);
      }
      simpleKeyMap.delete(file.id);
      onUploadSuccess?.(key, file as UppyFile<Meta, Body>);
    } else {
      // Multipart: key came from createMultipartUpload
      const mpKey = (file as any).s3Multipart?.key as string | undefined;
      if (mpKey) onUploadSuccess?.(mpKey, file as UppyFile<Meta, Body>);
    }
  });

  return uppy;
}

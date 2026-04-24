---
"@better-s3/server": minor
---

Introduce per-endpoint feature flags (S3Features + features in config) and gate router endpoints so presign/upload, presign/download, delete and multipart routes are disabled by default unless explicitly enabled. Rename and clarify lifecycle hooks across the codebase (onSuccess/onComplete → onPresigned/onUploaded, delete.onSuccess → delete.onDeleted, download.onSuccess → download.onPresigned, multipart docs/hooks clarified). Update handlers to call the new hook names and adjust upload/multipart init logic (remove the strict "fileSize required" init check and compute rangeMax from config.maxFileSize when needed). Update README and Next.js/Uppy templates to document the features flags and new hook names. Remove the headless page template. Overall this tightens defaults (endpoints opt-in), clarifies hook semantics, and updates documentation and examples accordingly.

export function validateFile(
  file: File,
  options: { accept?: string[]; maxFileSize?: number },
): string | null {
  if (options.accept?.length) {
    const allowed = options.accept.some((type) => {
      // Extension check: ".pdf", ".jpg", etc.
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      // Wildcard MIME: "image/*"
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.replace("/*", "/"));
      }
      // Exact MIME: "application/pdf"
      return file.type === type;
    });
    if (!allowed) {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : null;
      return `File type "${ext ? `.${ext}` : file.type || "unknown"}" is not allowed`;
    }
  }

  if (file.size === 0) {
    return "File is empty";
  }

  if (options.maxFileSize && file.size > options.maxFileSize) {
    const maxMB = (options.maxFileSize / (1024 * 1024)).toFixed(1);
    return `File size exceeds ${maxMB} MB limit`;
  }

  return null;
}

// Download types are co-located with their respective hooks:
// - useDownload     → ./use-download.ts
// - useFetchDownload → ./use-fetch-download.ts
//
// Re-export for convenience.
export type {
  DownloadPhase,
  DownloadHooks,
  UseDownloadState,
  UseDownloadReturn,
} from "../use-download";

export type {
  FetchDownloadPhase,
  FetchDownloadProgress,
  FetchDownloadHooks,
} from "../use-fetch-download";

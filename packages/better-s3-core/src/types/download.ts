export type DownloadPhase =
  | "idle"
  | "presigning"
  | "downloading"
  | "success"
  | "error";

export type DownloadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type DownloadHooks = {
  beforeDownload?: (key: string) => Promise<boolean> | boolean;
  onDownloadStart?: (key: string) => void;
  onProgress?: (key: string, progress: DownloadProgress) => void;
  onSuccess?: (key: string) => Promise<void> | void;
  onError?: (key: string, error: unknown, phase: DownloadPhase) => void;
  onCancel?: (key: string) => void;
};

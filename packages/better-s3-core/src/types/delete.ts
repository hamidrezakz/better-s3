export type DeletePhase =
  | "idle"
  | "confirming"
  | "deleting"
  | "success"
  | "error";

export type DeleteHooks = {
  beforeDelete?: (key: string) => Promise<boolean> | boolean;
  onDeleteStart?: (key: string) => void;
  onSuccess?: (key: string) => Promise<void> | void;
  onError?: (key: string, error: unknown, phase: DeletePhase) => void;
};

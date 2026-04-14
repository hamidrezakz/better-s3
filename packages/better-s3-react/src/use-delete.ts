"use client";

import { useCallback, useRef, useState } from "react";
import type { PresignApi, DeletePhase, DeleteHooks } from "@better-s3/core";

export type UseDeleteOptions = DeleteHooks & {
  presignApi: PresignApi;
};

export type UseDeleteState = {
  phase: DeletePhase;
  error: string | null;
};

export type UseDeleteReturn = UseDeleteState & {
  requestDelete: (key: string) => void;
  confirmDelete: () => Promise<void>;
  cancelDelete: () => void;
  reset: () => void;
  pendingKey: string | null;
};

const INITIAL_STATE: UseDeleteState = {
  phase: "idle",
  error: null,
};

export function useDelete(options: UseDeleteOptions): UseDeleteReturn {
  const [state, setState] = useState<UseDeleteState>(INITIAL_STATE);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const requestDelete = useCallback((key: string) => {
    setPendingKey(key);
    setState({ phase: "confirming", error: null });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingKey) return;
    const opts = optionsRef.current;

    if (opts.beforeDelete) {
      const allowed = await opts.beforeDelete(pendingKey);
      if (!allowed) {
        setState({
          phase: "error",
          error: "Delete blocked by beforeDelete hook",
        });
        opts.onError?.(pendingKey, new Error("blocked"), "confirming");
        setPendingKey(null);
        return;
      }
    }

    setState({ phase: "deleting", error: null });
    opts.onDeleteStart?.(pendingKey);

    try {
      await opts.presignApi.delete(pendingKey);

      setState({ phase: "success", error: null });
      await opts.onSuccess?.(pendingKey);
      setPendingKey(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      setState({ phase: "error", error: message });
      opts.onError?.(pendingKey, err, "deleting");
    }
  }, [pendingKey]);

  const cancelDelete = useCallback(() => {
    setPendingKey(null);
    setState(INITIAL_STATE);
  }, []);

  const reset = useCallback(() => {
    setPendingKey(null);
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    pendingKey,
    requestDelete,
    confirmDelete,
    cancelDelete,
    reset,
  };
}

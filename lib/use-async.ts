"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * One loading/error contract for every screen, so no screen invents its own —
 * and none can render a blank while it waits or a raw error when it fails.
 */
export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (live) setData(result);
      })
      .catch((err: unknown) => {
        if (!live) return;
        setError(
          err instanceof ApiError ? err.message : "Something went wrong."
        );
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload };
}

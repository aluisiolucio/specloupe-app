import { useCallback, useState } from "react";

import { loadPrivilegedInfo } from "../lib/api";
import type { PrivilegedInfo } from "../lib/types";

export interface PrivilegedState {
  data: PrivilegedInfo | null;
  loading: boolean;
  error: string | null;
  load: (refresh?: boolean) => Promise<void>;
}

export function usePrivileged(): PrivilegedState {
  const [data, setData] = useState<PrivilegedInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const info = await loadPrivilegedInfo(refresh);
        setData(info);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { data, loading, error, load };
}

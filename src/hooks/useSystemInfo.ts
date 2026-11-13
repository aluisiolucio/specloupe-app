import { useCallback, useEffect, useState } from "react";

import { collectSystemInfo, isTauri } from "../lib/api";
import type { SystemInfo } from "../lib/types";

interface SystemState {
  info: SystemInfo | null;
  loading: boolean;
  error: string | null;
  demo: boolean;
}

export function useSystemInfo() {
  const [state, setState] = useState<SystemState>({
    info: null,
    loading: true,
    error: null,
    demo: !isTauri(),
  });

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const result = await collectSystemInfo();
      setState({
        info: result.info,
        loading: false,
        error: null,
        demo: result.demo,
      });
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

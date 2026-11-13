import { useEffect, useRef, useState } from "react";

import { isTauri, setLivePaused } from "../lib/api";
import { demoLiveHistory, demoLiveTick } from "../lib/demo";
import type { LiveSnapshot } from "../lib/types";

const MAX_SAMPLES = 60;

export function useLive() {
  const demo = !isTauri();
  const [history, setHistory] = useState<LiveSnapshot[]>(() =>
    demo ? demoLiveHistory() : [],
  );
  const [paused, setPaused] = useState(false);
  const tickRef = useRef(demo ? 60 : 0);

  useEffect(() => {
    if (demo) {
      const timer = window.setInterval(() => {
        tickRef.current += 1;
        setHistory((previous) => [
          ...previous.slice(-(MAX_SAMPLES - 1)),
          demoLiveTick(Date.now(), tickRef.current),
        ]);
      }, 1000);
      return () => window.clearInterval(timer);
    }

    let disposed = false;
    let unlisten: (() => void) | undefined;

    void import("@tauri-apps/api/event").then(async ({ listen }) => {
      const stop = await listen<LiveSnapshot>("live:tick", (event) => {
        setHistory((previous) => [
          ...previous.slice(-(MAX_SAMPLES - 1)),
          event.payload,
        ]);
      });
      if (disposed) {
        stop();
      } else {
        unlisten = stop;
      }
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [demo]);

  useEffect(() => {
    if (demo) {
      return;
    }

    const sync = (focused: boolean) => {
      setPaused(!focused);
      void setLivePaused(!focused).catch(() => undefined);
    };

    sync(document.hasFocus());

    const onFocus = () => sync(true);
    const onBlur = () => sync(false);
    const onVisibility = () => sync(document.visibilityState === "visible");

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [demo]);

  return {
    demo,
    history,
    latest: history.length > 0 ? history[history.length - 1] : null,
    paused,
  };
}

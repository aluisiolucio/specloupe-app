import { useCallback, useEffect, useRef, useState } from "react";

import { ExportDialog } from "./components/ExportDialog";
import { Icon } from "./components/Icon";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { ErrorScreen, LoadingScreen } from "./components/States";
import { useLive } from "./hooks/useLive";
import { usePrivileged } from "./hooks/usePrivileged";
import { useSystemInfo } from "./hooks/useSystemInfo";
import { t } from "./i18n/en";
import { TABS } from "./lib/tabs";
import type { TabId } from "./lib/types";
import { BoardPage } from "./pages/BoardPage";
import { CpuPage } from "./pages/CpuPage";
import { GpuPage } from "./pages/GpuPage";
import { MemoryPage } from "./pages/MemoryPage";
import { NetworkPage } from "./pages/NetworkPage";
import { OverviewPage } from "./pages/OverviewPage";
import { SensorsPage } from "./pages/SensorsPage";
import { SoftwarePage } from "./pages/SoftwarePage";
import { StoragePage } from "./pages/StoragePage";

export default function App() {
  const [tab, setTab] = useState<TabId>("overview");
  const [exportOpen, setExportOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const privilegedRequested = useRef(false);

  const system = useSystemInfo();
  const live = useLive();
  const privileged = usePrivileged();

  // Request privileged DMI/SMART access once, as soon as the app identifies the machine.
  useEffect(() => {
    if (privilegedRequested.current) {
      return;
    }
    if (!system.info?.capabilities.privilegedAvailable) {
      return;
    }
    privilegedRequested.current = true;
    void privileged.load();
  }, [system.info, privileged.load]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [tab]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || exportOpen) {
        return;
      }
      const index = Number(event.key);
      if (Number.isInteger(index) && index >= 1 && index <= TABS.length) {
        setTab(TABS[index - 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exportOpen]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string) => {
    setToast(message);
  }, []);

  const info = system.info;

  return (
    <div className="app">
      <Sidebar
        active={tab}
        onSelect={setTab}
        capabilities={info?.capabilities ?? null}
      />

      <main className="main">
        {info ? (
          <TopBar
            active={tab}
            overview={info.overview}
            demo={system.demo}
            paused={live.paused}
            onExport={() => setExportOpen(true)}
          />
        ) : (
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-index">00</span>
              <span className="topbar-title">{t.app.name}</span>
              <span className="topbar-divider" />
              <span className="topbar-host">{t.app.tagline}</span>
            </div>
            <div className="topbar-right">
              <span className="live-pill is-paused">
                <span className="live-dot" />
                <span className="live-state">{t.common.loading}</span>
              </span>
            </div>
          </header>
        )}

        <div className="content" ref={contentRef}>
          {system.loading ? (
            <LoadingScreen />
          ) : system.error || !info ? (
            <ErrorScreen
              message={system.error ?? t.common.notAvailable}
              onRetry={() => void system.reload()}
            />
          ) : (
            <>
              {tab === "overview" && (
                <OverviewPage
                  info={info}
                  latest={live.latest}
                  history={live.history}
                  paused={live.paused}
                />
              )}
              {tab === "cpu" && <CpuPage info={info} latest={live.latest} />}
              {tab === "board" && <BoardPage info={info} privileged={privileged} />}
              {tab === "memory" && (
                <MemoryPage info={info} latest={live.latest} privileged={privileged} />
              )}
              {tab === "gpu" && <GpuPage info={info} latest={live.latest} />}
              {tab === "storage" && <StoragePage info={info} privileged={privileged} />}
              {tab === "network" && <NetworkPage info={info} />}
              {tab === "software" && <SoftwarePage info={info} />}
              {tab === "sensors" && (
                <SensorsPage
                  info={info}
                  latest={live.latest}
                  history={live.history}
                  paused={live.paused}
                />
              )}
            </>
          )}
        </div>
      </main>

      {info && exportOpen && (
        <ExportDialog
          info={info}
          privileged={privileged.data}
          live={live.latest}
          onClose={() => setExportOpen(false)}
          onSaved={notify}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={16} />
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} aria-label={t.common.close}>
            <Icon name="x" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

import { t } from "../i18n/en";
import { tabMeta } from "../lib/tabs";
import type { Overview, TabId } from "../lib/types";
import { Icon } from "./Icon";

interface TopBarProps {
  active: TabId;
  overview: Overview;
  demo: boolean;
  paused: boolean;
  onExport: () => void;
}

export function TopBar({
  active,
  overview,
  demo,
  paused,
  onExport,
}: TopBarProps) {
  const meta = tabMeta(active);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-index">{meta.index}</span>
        <span className="topbar-title">{t.nav[active]}</span>
        <span className="topbar-divider" />
        <span className="topbar-host">
          {overview.hostname ?? t.common.unknown}
        </span>
      </div>

      <div className="topbar-right">
        {demo && (
          <span className="tag tag-preview" title={t.topbar.demoHint}>
            {t.topbar.preview}
          </span>
        )}

        <span
          className={`live-pill${paused ? " is-paused" : ""}`}
          title={paused ? "Live sampling is paused while the window is unfocused" : "Live sampling at 1 Hz"}
        >
          <span className="live-dot" />
          <span className="live-state">{paused ? t.topbar.paused : t.topbar.live}</span>
          <span className="live-rate">{t.topbar.sampling}</span>
        </span>

        <button type="button" className="button button-accent" onClick={onExport}>
          <Icon name="download" size={15} />
          {t.topbar.export}
        </button>
      </div>
    </header>
  );
}

import { t } from "../i18n/en";
import { TABS, type TabMeta } from "../lib/tabs";
import type { Capabilities, TabId } from "../lib/types";
import { Brand } from "./Brand";
import { Icon } from "./Icon";

interface SidebarProps {
  active: TabId;
  onSelect: (tab: TabId) => void;
  capabilities: Capabilities | null;
}

const GROUP_ORDER: TabMeta["group"][] = [
  "machine",
  "hardware",
  "environment",
  "telemetry",
];

export function Sidebar({ active, onSelect, capabilities }: SidebarProps) {
  return (
    <aside className="sidebar">
      <Brand />

      <nav className="nav" aria-label="Inspection sections">
        {GROUP_ORDER.map((group) => {
          const tabs = TABS.filter((tab) => tab.group === group);
          if (tabs.length === 0) {
            return null;
          }
          return (
            <div className="nav-group" key={group}>
              <div className="nav-group-label">{t.groups[group]}</div>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`nav-item${active === tab.id ? " is-active" : ""}`}
                  onClick={() => onSelect(tab.id)}
                  aria-current={active === tab.id ? "page" : undefined}
                >
                  <Icon name={tab.icon} size={17} />
                  <span className="nav-label">{t.nav[tab.id]}</span>
                  <span className="nav-index">{tab.index}</span>
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <div className="status-line">
          <span
            className={`status-dot ${capabilities?.privilegedAvailable ? "is-ok" : "is-warn"}`}
          />
          <span>
            {capabilities?.privilegedAvailable
              ? t.topbar.restrictedReady
              : t.topbar.standardUser}
          </span>
        </div>
        <div className="status-line">
          <Icon name="shield" size={13} />
          <span>{t.topbar.noNetwork}</span>
        </div>
        <div className="sidebar-version">
          {t.app.name} {t.app.version} · {t.app.license}
        </div>
      </div>
    </aside>
  );
}

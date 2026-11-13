import { t } from "../i18n/en";
import type { Capabilities, PrivilegedInfo } from "../lib/types";
import { Icon } from "./Icon";

interface PrivilegedPanelProps {
  capabilities: Capabilities;
  data: PrivilegedInfo | null;
  loading: boolean;
  error: string | null;
  onLoad: (refresh: boolean) => void;
}

export function PrivilegedPanel({
  capabilities,
  data,
  loading,
  error,
  onLoad,
}: PrivilegedPanelProps) {
  if (data) {
    return (
      <section className="privileged is-loaded">
        <div className="privileged-glyph">
          <Icon name="unlock" size={19} />
        </div>
        <div className="privileged-copy">
          <div className="eyebrow">{t.privileged.loaded}</div>
          <p className="privileged-message">
            DMI serials and SMART health are now part of this view. The helper exited after reading.
          </p>
          {error && <p className="inline-error">{error}</p>}
          {data.warnings.length > 0 && (
            <ul className="privileged-warnings">
              {data.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          className="button button-quiet"
          onClick={() => onLoad(true)}
          disabled={loading}
        >
          <Icon name="refresh" size={15} className={loading ? "spin" : undefined} />
          {loading ? t.privileged.loading : t.privileged.refresh}
        </button>
      </section>
    );
  }

  return (
    <section className="privileged">
      <div className="privileged-glyph">
        <Icon name="lock" size={19} />
      </div>
      <div className="privileged-copy">
        <div className="eyebrow">{t.privileged.eyebrow}</div>
        <h3>{t.privileged.title}</h3>
        <p>{t.privileged.description}</p>
        {!capabilities.privilegedAvailable && (
          <p className="inline-warning">{t.privileged.unavailable}</p>
        )}
        {!capabilities.smartAvailable && (
          <p className="inline-note">{t.privileged.smartUnavailable}</p>
        )}
        {error && (
          <p className="inline-error">
            {t.privileged.failed} {error}
          </p>
        )}
      </div>
      <button
        type="button"
        className="button button-accent"
        onClick={() => onLoad(false)}
        disabled={loading || !capabilities.privilegedAvailable}
      >
        <Icon
          name={loading ? "refresh" : "unlock"}
          size={15}
          className={loading ? "spin" : undefined}
        />
        {loading ? t.privileged.loading : t.privileged.unlock}
      </button>
    </section>
  );
}

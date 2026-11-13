import { t } from "../i18n/en";
import type { IconName } from "../lib/tabs";
import { LoupeMark } from "./Brand";
import { Icon } from "./Icon";

export function LoadingScreen() {
  return (
    <div className="state-screen">
      <div className="scanner">
        <LoupeMark size={62} />
        <span className="scanner-line" />
      </div>
      <div className="eyebrow">System dossier</div>
      <h2 className="state-title">
        {t.common.loading}
        <span className="ellipsis" />
      </h2>
      <p className="state-copy">{t.common.loadingHint}</p>
    </div>
  );
}

export function ErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="state-screen">
      <div className="state-glyph is-danger">
        <Icon name="alert" size={26} />
      </div>
      <div className="eyebrow">Read failure</div>
      <h2 className="state-title">{t.common.errorTitle}</h2>
      <p className="state-copy">{t.common.errorHint}</p>
      <pre className="state-error">{message}</pre>
      <button type="button" className="button button-accent" onClick={onRetry}>
        <Icon name="refresh" size={15} />
        {t.common.retry}
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  icon = "loupe",
}: {
  title: string;
  body: string;
  icon?: IconName;
}) {
  return (
    <div className="empty-state">
      <div className="state-glyph">
        <Icon name={icon} size={22} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

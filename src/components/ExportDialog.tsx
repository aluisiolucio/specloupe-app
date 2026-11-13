import { useEffect, useState } from "react";

import { t } from "../i18n/en";
import { isTauri, saveReport } from "../lib/api";
import { buildReport, reportSectionCount, type ReportFormat } from "../lib/report";
import type { LiveSnapshot, PrivilegedInfo, SystemInfo } from "../lib/types";
import { Icon } from "./Icon";

interface ExportDialogProps {
  info: SystemInfo;
  privileged: PrivilegedInfo | null;
  live: LiveSnapshot | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function ExportDialog({
  info,
  privileged,
  live,
  onClose,
  onSaved,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ReportFormat>("md");
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const exportReport = async () => {
    setBusy(true);
    setError(null);
    try {
      const content = buildReport({
        info,
        privileged,
        live,
        format,
        includeSensitive,
      });
      const path = await saveReport(content, format);
      if (!path) {
        setBusy(false);
        return;
      }
      const prefix = isTauri() ? t.export.saved : t.export.downloaded;
      onSaved(`${prefix}: ${path}`);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setBusy(false);
    }
  };

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <header className="dialog-head">
          <div className="eyebrow">{t.export.eyebrow}</div>
          <h2 id="export-title">{t.export.title}</h2>
          <p>{t.export.description}</p>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            disabled={busy}
            aria-label={t.common.close}
          >
            <Icon name="x" size={16} />
          </button>
        </header>

        <div className="dialog-body">
          <div className="field">
            <div className="field-label">{t.export.format}</div>
            <div className="segmented" role="group" aria-label={t.export.format}>
              <button
                type="button"
                className={format === "md" ? "is-active" : undefined}
                onClick={() => setFormat("md")}
              >
                {t.export.markdown}
                <span className="segmented-hint">.md</span>
              </button>
              <button
                type="button"
                className={format === "json" ? "is-active" : undefined}
                onClick={() => setFormat("json")}
              >
                {t.export.json}
                <span className="segmented-hint">.json</span>
              </button>
            </div>
          </div>

          <label className="switch-row">
            <span className="switch-copy">
              <span>{t.export.privacy}</span>
              <small>{t.export.privacyHint}</small>
            </span>
            <input
              type="checkbox"
              checked={includeSensitive}
              onChange={(event) => setIncludeSensitive(event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true">
              <span className="switch-thumb" />
            </span>
          </label>

          <div className="dialog-note">
            <Icon name="shield" size={15} />
            <span>{t.export.note}</span>
          </div>

          {error && (
            <p className="inline-error">
              {t.export.error} {error}
            </p>
          )}
        </div>

        <footer className="dialog-foot">
          <span className="dialog-meta">
            {reportSectionCount()} {t.export.sections} · {t.export.latestSample}
          </span>
          <div className="dialog-actions">
            <button
              type="button"
              className="button button-quiet"
              onClick={onClose}
              disabled={busy}
            >
              {t.export.cancel}
            </button>
            <button
              type="button"
              className="button button-accent"
              onClick={() => void exportReport()}
              disabled={busy}
            >
              <Icon
                name={busy ? "refresh" : "download"}
                size={15}
                className={busy ? "spin" : undefined}
              />
              {busy ? t.export.saving : t.export.save}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

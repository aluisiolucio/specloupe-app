import { Card } from "../components/Card";
import { PageIntro } from "../components/PageIntro";
import { PrivilegedPanel } from "../components/PrivilegedPanel";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";
import type { PrivilegedState } from "../hooks/usePrivileged";
import { t, L } from "../i18n/en";
import { bytes, pct, text } from "../lib/format";
import type { LiveSnapshot, SystemInfo } from "../lib/types";

interface MemoryPageProps {
  info: SystemInfo;
  latest: LiveSnapshot | null;
  privileged: PrivilegedState;
}

export function MemoryPage({ info, latest, privileged }: MemoryPageProps) {
  const total = latest?.memory.totalBytes ?? info.memory.totalBytes;
  const used = latest?.memory.usedBytes ?? info.memory.usedBytes;
  const available = latest?.memory.availableBytes ?? info.memory.availableBytes;
  const swapTotal = latest?.memory.swapTotalBytes ?? info.memory.swapTotalBytes;
  const swapUsed =
    latest?.memory.swapUsedBytes ??
    Math.max(0, info.memory.swapTotalBytes - info.memory.swapFreeBytes);

  const usedPct = total > 0 ? (used / total) * 100 : 0;
  const cachedPct = Math.min(100 - usedPct, total > 0 ? (info.memory.cachedBytes / total) * 100 : 0);
  const freePct = Math.max(0, 100 - usedPct - cachedPct);
  const modules = privileged.data?.dmi?.memoryDevices ?? [];
  const populated = modules.filter((module) => module.populated);

  return (
    <div className="page">
      <PageIntro
        eyebrow="04 — Memory subsystem"
        title="Memory"
        description={`${bytes(info.memory.totalBytes)} installed · ${bytes(used)} in use · ${bytes(swapTotal)} swap`}
        aside={
          <div className="tag-row">
            <Tag tone="accent">DDR</Tag>
            <Tag>{latest ? "Live · 1 Hz" : t.common.unknown}</Tag>
          </div>
        }
      />

      <Card
        index="01"
        title="Current allocation"
        aside={<span className="card-count">{pct(usedPct, 1)} used</span>}
      >
        <div className="memory-layout">
          <div className="memory-hero">
            <div className="eyebrow">Physical memory</div>
            <div className="memory-big">{bytes(used)}</div>
            <div className="memory-sub">
              of {bytes(total)} · {bytes(available)} available
            </div>
            <div className="segment-bar is-tall" aria-hidden="true">
              <span className="segment segment-used" style={{ width: `${usedPct}%` }} />
              <span className="segment segment-cached" style={{ width: `${cachedPct}%` }} />
              <span className="segment segment-free" style={{ width: `${freePct}%` }} />
            </div>
            <div className="usage-legend">
              <span><i className="dot-seg dot-used" />Used {bytes(used)}</span>
              <span><i className="dot-seg dot-cached" />Cached {bytes(info.memory.cachedBytes)}</span>
              <span><i className="dot-seg dot-free" />Free {bytes(info.memory.freeBytes)}</span>
            </div>
          </div>

          <SpecList>
            <SpecRow label={L.total} value={bytes(total)} />
            <SpecRow label={L.used} value={bytes(used)} tone="accent" />
            <SpecRow label={L.available} value={bytes(available)} />
            <SpecRow label={L.free} value={bytes(info.memory.freeBytes)} />
            <SpecRow label={L.cached} value={bytes(info.memory.cachedBytes)} />
            <SpecRow label={L.buffers} value={bytes(info.memory.buffersBytes)} />
            <SpecRow label={L.shared} value={bytes(info.memory.sharedBytes)} />
            <SpecRow label={L.swapTotal} value={bytes(swapTotal)} />
            <SpecRow label={L.swapUsed} value={bytes(swapUsed)} />
          </SpecList>
        </div>
      </Card>

      <PrivilegedPanel
        capabilities={info.capabilities}
        data={privileged.data}
        loading={privileged.loading}
        error={privileged.error}
        onLoad={(refresh) => void privileged.load(refresh)}
      />

      <Card
        index="02"
        title="Module inventory"
        aside={
          privileged.data
            ? <span className="card-count">{populated.length} installed · {modules.length} slots</span>
            : <Tag tone="warn">{L.locked}</Tag>
        }
      >
        {modules.length > 0 ? (
          <div className="module-grid">
            {modules.map((module, index) => (
              <article
                className={`module-card${module.populated ? "" : " is-empty"}`}
                key={`${module.locator}-${index}`}
              >
                <header className="module-head">
                  <span className="module-slot">{module.locator ?? `Slot ${index + 1}`}</span>
                  <Tag tone={module.populated ? "ok" : "muted"}>
                    {module.populated ? module.size ?? L.installed : L.emptySlot}
                  </Tag>
                </header>
                {module.populated ? (
                  <SpecList className="spec-list-compact">
                    <SpecRow label={L.memoryType} value={text(module.kind)} />
                    <SpecRow label={L.speed} value={text(module.speed)} />
                    <SpecRow label={L.configuredSpeed} value={text(module.configuredSpeed)} />
                    <SpecRow label={L.manufacturer} value={text(module.manufacturer)} mono={false} />
                    <SpecRow label={L.partNumber} value={text(module.partNumber)} />
                    <SpecRow label={L.rank} value={text(module.rank)} />
                    <SpecRow label={L.voltage} value={text(module.voltage)} />
                    <SpecRow label={L.formFactor} value={text(module.formFactor)} />
                    <SpecRow label={L.serial} value={text(module.serial)} />
                  </SpecList>
                ) : (
                  <p className="muted-copy">{t.labels.emptySlot}</p>
                )}
              </article>
            ))}
          </div>
        ) : privileged.data ? (
          <div className="hint-panel is-inline">
            <span className="eyebrow">No SMBIOS modules</span>
            <p>{t.empty.noModulesBody}</p>
          </div>
        ) : (
          <div className="hint-panel is-inline">
            <span className="eyebrow">{L.moduleCount}</span>
            <p>{t.privileged.moduleHint}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

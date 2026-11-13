import { useState } from "react";

import { Card } from "../components/Card";
import { Meter } from "../components/Meter";
import { PageIntro } from "../components/PageIntro";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";
import { t, L } from "../i18n/en";
import { average, bytes, ghz, pct, text } from "../lib/format";
import type { LiveSnapshot, SystemInfo } from "../lib/types";

interface CpuPageProps {
  info: SystemInfo;
  latest: LiveSnapshot | null;
}

const VERDICT_LABEL: Record<string, string> = {
  safe: L.safe,
  mitigated: L.mitigated,
  vulnerable: L.vulnerable,
  unknown: L.unknown,
};

function verdictTone(level: string): "ok" | "accent" | "danger" | "neutral" {
  switch (level) {
    case "safe":
      return "ok";
    case "mitigated":
      return "accent";
    case "vulnerable":
      return "danger";
    default:
      return "neutral";
  }
}

export function CpuPage({ info, latest }: CpuPageProps) {
  const [showAllFlags, setShowAllFlags] = useState(false);
  const cpu = info.cpu;
  const liveThreads = latest?.cpu.perCore ?? [];
  const visibleFlags = showAllFlags ? cpu.flags : cpu.flags.slice(0, 64);
  const l3 = cpu.caches.find((cache) => cache.level === 3);

  return (
    <div className="page">
      <PageIntro
        eyebrow="02 — Processor"
        title={cpu.model ?? "Processor"}
        description={`${cpu.cores} cores · ${cpu.threads} threads · ${cpu.sockets} socket${cpu.sockets === 1 ? "" : "s"} · ${text(cpu.architecture)}`}
        aside={
          <div className="tag-row">
            {cpu.virtualizations.map((feature) => (
              <Tag key={feature} tone="accent">{feature}</Tag>
            ))}
            <Tag>{text(cpu.governor)}</Tag>
            <Tag>{text(cpu.driver)}</Tag>
          </div>
        }
      />

      <div className="grid grid-2">
        <Card index="01" title="Identification">
          <SpecList>
            <SpecRow label={L.cpuVendor} value={text(cpu.vendor)} mono={false} />
            <SpecRow label={L.family} value={text(cpu.family)} />
            <SpecRow label={L.modelId} value={text(cpu.modelId)} />
            <SpecRow label={L.stepping} value={text(cpu.stepping)} />
            <SpecRow label={L.microcode} value={text(cpu.microcode)} />
            <SpecRow label={L.architecture} value={text(cpu.architecture)} />
            <SpecRow
              label={L.virtualization}
              value={cpu.virtualizations.join(", ") || "—"}
            />
            <SpecRow
              label={L.cache}
              value={l3 ? `L3 · ${bytes(l3.sizeBytes)}` : "—"}
            />
          </SpecList>
        </Card>

        <Card
          index="02"
          title="Clocks & power"
          aside={<span className="card-count">{cpu.topology.length} physical cores</span>}
        >
          <SpecList>
            <SpecRow label={L.baseClock} value={ghz(cpu.baseMhz)} />
            <SpecRow label={L.maxBoost} value={ghz(cpu.maxMhz)} />
            <SpecRow label={L.minClock} value={ghz(cpu.minMhz)} />
            <SpecRow
              label={L.currentClock}
              value={ghz(
                liveThreads.some((core) => core.freqMhz !== null)
                  ? average(
                      liveThreads
                        .map((core) => core.freqMhz)
                        .filter((value): value is number => value !== null),
                    )
                  : cpu.currentMhz,
              )}
              tone="accent"
            />
            <SpecRow label={L.governor} value={text(cpu.governor)} />
            <SpecRow label={L.driver} value={text(cpu.driver)} />
            <SpecRow label={L.energyPreference} value={text(cpu.energyPreference)} />
            <SpecRow
              label={L.packagePower}
              value={
                latest?.cpu.powerLocked
                  ? <Tag tone="warn">{L.locked}</Tag>
                  : latest?.cpu.packagePowerW != null
                    ? `${latest.cpu.packagePowerW.toFixed(1)} W`
                    : "—"
              }
            />
          </SpecList>
        </Card>
      </div>

      <Card index="03" title="Cache hierarchy" flush>
        <table className="data-table">
          <thead>
            <tr>
              <th>{L.cacheLevel}</th>
              <th>{L.cacheType}</th>
              <th>{L.cacheSize}</th>
              <th>{L.ways}</th>
              <th>{L.lineSize}</th>
              <th>{L.sharedBy}</th>
            </tr>
          </thead>
          <tbody>
            {cpu.caches.length === 0 ? (
              <tr>
                <td colSpan={6} className="cell-empty">{t.common.noData}</td>
              </tr>
            ) : (
              cpu.caches.map((cache) => (
                <tr key={`${cache.level}-${cache.kind}-${cache.sizeBytes}`}>
                  <td className="mono cell-accent">L{cache.level}</td>
                  <td>{cache.kind}</td>
                  <td className="mono">{bytes(cache.sizeBytes)}</td>
                  <td className="mono">{cache.ways ?? "—"}</td>
                  <td className="mono">{cache.lineSize ? `${cache.lineSize} B` : "—"}</td>
                  <td className="mono">{cache.sharedBy ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card index="04" title={L.coreTopology}>
        <div className="core-grid">
          {cpu.topology.map((core) => {
            const siblings = liveThreads.filter((entry) =>
              core.threads.includes(entry.id),
            );
            const usage =
              siblings.length > 0
                ? average(siblings.map((entry) => entry.usagePercent))
                : null;
            const frequencies = siblings
              .map((entry) => entry.freqMhz)
              .filter((entry): entry is number => entry !== null);
            const frequency =
              frequencies.length > 0
                ? average(frequencies)
                : core.currentMhz;

            return (
              <article className="core-tile" key={core.coreId}>
                <header>
                  <span className="core-id">
                    Core {core.coreId.toString().padStart(2, "0")}
                  </span>
                  <span className="core-threads">CPU {core.threads.join(", ")}</span>
                </header>
                <div className="core-clock">{ghz(frequency)}</div>
                <Meter value={usage ?? 0} label={`Core ${core.coreId} load`} />
                <footer>
                  <span>{pct(usage, 0)}</span>
                  <span>{ghz(core.maxMhz)} max</span>
                </footer>
              </article>
            );
          })}
        </div>
      </Card>

      <Card
        index="05"
        title={L.instructionSet}
        aside={<span className="card-count">{cpu.flags.length} flags</span>}
      >
        <div className="flag-cloud">
          {visibleFlags.map((flag) => (
            <span className="flag" key={flag}>{flag}</span>
          ))}
          {cpu.flags.length === 0 && <p className="muted-copy">{t.common.noData}</p>}
        </div>
        {cpu.flags.length > 64 && (
          <button
            type="button"
            className="link-button"
            onClick={() => setShowAllFlags((current) => !current)}
          >
            {showAllFlags ? t.common.showLess : `${t.common.showAll} (${cpu.flags.length})`}
          </button>
        )}
      </Card>

      <Card index="06" title={L.vulnerabilities}>
        <div className="vuln-list">
          {cpu.vulnerabilities.length === 0 ? (
            <p className="muted-copy">{t.common.noData}</p>
          ) : (
            cpu.vulnerabilities.map((vulnerability) => (
              <div className="vuln-row" key={vulnerability.name}>
                <span className="vuln-name">{vulnerability.name}</span>
                <Tag tone={verdictTone(vulnerability.level)}>
                  {VERDICT_LABEL[vulnerability.level] ?? vulnerability.level}
                </Tag>
                <span className="vuln-detail">{vulnerability.status}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

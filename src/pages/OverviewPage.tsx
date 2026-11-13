import { t, L } from "../i18n/en";
import { bytes, ghz, pct, rpm, temp, text, uptime } from "../lib/format";
import {
  cpuFrequency,
  cpuLoad,
  cpuLoadSeries,
  cpuTempSeries,
  fanSeries,
  gpuLive,
  memoryPercentSeries,
  primaryFan,
} from "../lib/live";
import { average as mean } from "../lib/format";
import type { LiveSnapshot, SystemInfo } from "../lib/types";
import { Card } from "../components/Card";
import { Gauge } from "../components/Gauge";
import { Icon } from "../components/Icon";
import { Meter } from "../components/Meter";
import { MetricCard } from "../components/MetricCard";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";

interface OverviewPageProps {
  info: SystemInfo;
  latest: LiveSnapshot | null;
  history: LiveSnapshot[];
  paused: boolean;
}

function memoryUsage(snapshot: LiveSnapshot | null) {
  if (!snapshot) {
    return null;
  }
  return {
    used: snapshot.memory.usedBytes,
    total: snapshot.memory.totalBytes,
    percent:
      snapshot.memory.totalBytes > 0
        ? (snapshot.memory.usedBytes / snapshot.memory.totalBytes) * 100
        : 0,
  };
}

export function OverviewPage({ info, latest, history, paused }: OverviewPageProps) {
  const load = cpuLoad(latest) ?? 0;
  const loadNow = cpuLoad(latest);
  const packageTemp = latest?.cpu.packageTempC ?? null;
  const frequency = cpuFrequency(latest) ?? info.cpu.currentMhz;
  const memory = memoryUsage(latest);
  const memoryPct = memory?.percent ?? (info.memory.totalBytes > 0
    ? (info.memory.usedBytes / info.memory.totalBytes) * 100
    : 0);
  const fan = primaryFan(latest);
  const gpu = info.gpus[0] ? gpuLive(latest, info.gpus[0].pciAddress) : null;
  const root =
    info.storage
      .flatMap((disk) => disk.partitions)
      .find((partition) => partition.mountpoint === "/") ??
    info.storage.flatMap((disk) => disk.partitions)[0];
  const physicalNetwork = info.network.filter((net) => !net.isVirtual);
  const cache = info.cpu.caches.find((entry) => entry.level === 3);
  const liveCores = latest?.cpu.perCore ?? [];
  const coreBars =
    info.cpu.topology.length > 0
      ? info.cpu.topology.map((core) => {
          const siblings = liveCores.filter((entry) => core.threads.includes(entry.id));
          return siblings.length > 0
            ? mean(siblings.map((entry) => entry.usagePercent))
            : 0;
        })
      : liveCores.map((core) => core.usagePercent);

  const subtitle = [
    info.cpu.model,
    bytes(info.memory.totalBytes),
    info.gpus[0]?.device,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-rule" />
            {t.page.overview.eyebrow} · {paused ? t.topbar.paused : t.topbar.localOnly}
          </div>
          <h1>{info.overview.product ?? info.overview.hostname ?? "This machine"}</h1>
          <p className="hero-subtitle">{subtitle || t.common.unknown}</p>

          <div className="hero-facts">
            <div>
              <span className="hero-fact-label">{L.os}</span>
              <strong title={text(info.overview.osName)}>{text(info.overview.osName)}</strong>
            </div>
            <div>
              <span className="hero-fact-label">{L.kernel}</span>
              <strong title={text(info.overview.kernel)}>{text(info.overview.kernel)}</strong>
            </div>
            <div>
              <span className="hero-fact-label">{L.uptime}</span>
              <strong>{uptime(info.overview.uptimeSeconds)}</strong>
            </div>
            <div>
              <span className="hero-fact-label">{L.chassis}</span>
              <strong>{text(info.overview.chassisType)}</strong>
            </div>
          </div>

          <div className="hero-live-line">
            <span className={`status-dot ${paused ? "is-warn" : "is-ok"}`} />
            <span>
              {paused
                ? `${t.topbar.paused} — sampling resumes when the window regains focus`
                : `${t.topbar.live} sampling · ${t.topbar.sampling}`}
            </span>
          </div>
        </div>

        <div className="hero-dial">
          <Gauge
            value={load}
            caption="CPU LOAD"
            detail={`${temp(packageTemp)} · ${ghz(frequency)}`}
          />
          <div className="hero-dial-foot">
            <div>
              <span>{L.packageTemp}</span>
              <strong>{temp(packageTemp)}</strong>
            </div>
            <div>
              <span>{L.threads}</span>
              <strong>{info.cpu.threads}</strong>
            </div>
            <div>
              <span>{L.fan}</span>
              <strong>{fan ? rpm(fan.rpm) : "—"}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="metric-grid">
        <MetricCard
          label={L.cpuLoad}
          value={loadNow === null ? "—" : loadNow.toFixed(0)}
          unit="%"
          values={cpuLoadSeries(history)}
          min={0}
          max={100}
          footRight={`${info.cpu.cores}C / ${info.cpu.threads}T`}
        />
        <MetricCard
          label={L.packageTemp}
          value={packageTemp === null ? "—" : packageTemp.toFixed(1)}
          unit="°C"
          values={cpuTempSeries(history)}
          min={20}
          max={100}
          tone={packageTemp !== null && packageTemp > 82 ? "danger" : "accent"}
          footRight={latest ? "package id 0" : t.common.noData}
        />
        <MetricCard
          label={L.memoryUsed}
          value={memoryPct.toFixed(0)}
          unit="%"
          values={memoryPercentSeries(history)}
          min={0}
          max={100}
          tone="mint"
          footRight={`${bytes(memory?.used ?? info.memory.usedBytes)} / ${bytes(info.memory.totalBytes)}`}
        />
        <MetricCard
          label={L.fanSpeed}
          value={fan ? Math.round(fan.rpm).toLocaleString("en-US") : "—"}
          unit="RPM"
          values={fanSeries(history)}
          tone="mint"
          footRight={fan ? `${fan.source} · ${fan.label}` : t.labels.noTachometer}
        />
      </div>

      <div className="grid grid-2">
        <Card index="01" title="Platform identity">
          <SpecList>
            <SpecRow label={L.systemVendor} value={text(info.overview.vendor)} mono={false} />
            <SpecRow label={L.product} value={text(info.overview.product)} mono={false} />
            <SpecRow label={L.productVersion} value={text(info.overview.productVersion)} />
            <SpecRow label={L.hostname} value={text(info.overview.hostname)} />
            <SpecRow label={L.os} value={text(info.overview.osName)} mono={false} />
            <SpecRow label={L.kernel} value={text(info.overview.kernel)} />
            <SpecRow label={L.uptime} value={uptime(info.overview.uptimeSeconds)} />
            <SpecRow
              label={L.booted}
              value={new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(info.overview.bootTimeUnix * 1000))}
            />
          </SpecList>
        </Card>

        <Card
          index="02"
          title="Processor complex"
          aside={<Tag tone="accent">{info.cpu.threads} threads</Tag>}
        >
          <SpecList>
            <SpecRow label={L.model} value={text(info.cpu.model)} mono={false} />
            <SpecRow
              label={L.cores}
              value={`${info.cpu.cores} cores · ${info.cpu.threads} threads · ${info.cpu.sockets} socket`}
            />
            <SpecRow label={L.baseClock} value={ghz(info.cpu.baseMhz)} />
            <SpecRow label={L.maxBoost} value={ghz(info.cpu.maxMhz)} />
            <SpecRow label={L.currentClock} value={ghz(frequency)} tone="accent" />
            <SpecRow label={L.governor} value={text(info.cpu.governor)} />
            <SpecRow
              label={L.cache}
              value={cache ? `L3 · ${bytes(cache.sizeBytes)}` : "—"}
            />
            <SpecRow
              label={L.virtualization}
              value={info.cpu.virtualizations.join(", ") || "—"}
            />
          </SpecList>
          <div className="mini-bars" aria-hidden="true">
            {coreBars.map((usage, index) => (
              <span
                key={index}
                className="mini-bar"
                style={{ height: `${Math.max(4, Math.min(100, usage))}%` }}
              />
            ))}
          </div>
          <div className="mini-bars-caption">
            <span>Per-core activity</span>
            <span>{pct(loadNow, 0)} avg</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-3">
        <Card index="03" title="Memory">
          <div className="usage-head">
            <span className="usage-value">{bytes(memory?.used ?? info.memory.usedBytes)}</span>
            <span className="usage-sub">of {bytes(info.memory.totalBytes)}</span>
          </div>
          <div className="segment-bar" aria-hidden="true">
            <span
              className="segment segment-used"
              style={{ width: `${Math.min(100, memoryPct)}%` }}
            />
          </div>
          <div className="usage-legend">
            <span><i className="dot-seg dot-used" />Used {pct(memoryPct, 0)}</span>
            <span><i className="dot-seg dot-free" />Available {bytes(latest?.memory.availableBytes ?? info.memory.availableBytes)}</span>
          </div>
          <SpecList className="spec-list-compact">
            <SpecRow label={L.cached} value={bytes(info.memory.cachedBytes)} />
            <SpecRow
              label={L.swapTotal}
              value={`${bytes(info.memory.swapTotalBytes)}`}
            />
          </SpecList>
        </Card>

        <Card index="04" title="Primary storage">
          <div className="usage-head">
            <span className="usage-value">{bytes(root?.fsUsedBytes)}</span>
            <span className="usage-sub">of {bytes(root?.fsTotalBytes ?? info.storage[0]?.sizeBytes)}</span>
          </div>
          <Meter
            value={root?.fsUsePercent ?? 0}
            tone={(root?.fsUsePercent ?? 0) > 85 ? "danger" : "accent"}
            label="Root filesystem usage"
          />
          <SpecList className="spec-list-compact">
            <SpecRow label={L.model} value={text(info.storage[0]?.model ?? info.storage[0]?.name)} mono={false} />
            <SpecRow label={L.filesystem} value={text(root?.fstype)} />
            <SpecRow label={L.mountpoint} value={text(root?.mountpoint)} />
            <SpecRow label={L.temperature} value={temp(info.storage[0]?.temperatureC)} />
          </SpecList>
        </Card>

        <Card index="05" title="Connectivity">
          {physicalNetwork.length > 0 ? (
            <div className="iface-list">
              {physicalNetwork.map((net) => (
                <div className="iface-row" key={net.name}>
                  <span className="iface-name">{net.name}</span>
                  <span className="iface-state">
                    <span
                      className={`status-dot ${net.state === "up" ? "is-ok" : "is-muted"}`}
                    />
                    {text(net.state)}
                  </span>
                  <span className="iface-addr">
                    {net.addresses[0]?.address ?? "no address"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">{t.empty.noNetworkBody}</p>
          )}
          <SpecList className="spec-list-compact">
            <SpecRow
              label={L.wireless}
              value={physicalNetwork.some((net) => net.isWireless)
                ? physicalNetwork.find((net) => net.isWireless)?.name ?? "—"
                : "—"}
            />
            <SpecRow
              label={L.gpuFrequency}
              value={gpu?.freqMhz ? `${Math.round(gpu.freqMhz)} MHz` : "—"}
            />
          </SpecList>
        </Card>
      </div>

      <div className="note-strip">
        <Icon name="shield" size={16} />
        <span>
          Read-only inspection. No telemetry, no network requests. The privileged helper
          reads serials and SMART, then exits immediately.
        </span>
        <span className="note-strip-code">SPEC/01</span>
      </div>
    </div>
  );
}

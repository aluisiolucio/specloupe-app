import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { Meter } from "../components/Meter";
import { MetricCard } from "../components/MetricCard";
import { PageIntro } from "../components/PageIntro";
import { EmptyState } from "../components/States";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";
import { t, L } from "../i18n/en";
import { ghz, integer, pct, temp, text, timeOnly } from "../lib/format";
import {
  batterySeries,
  cpuFrequency,
  cpuLoad,
  cpuLoadSeries,
  cpuPowerSeries,
  cpuTempSeries,
  fanSeries,
  gpuFreqSeries,
  gpuLive,
  memoryPercentSeries,
  primaryFan,
} from "../lib/live";
import type { LiveSnapshot, SystemInfo } from "../lib/types";

interface SensorsPageProps {
  info: SystemInfo;
  latest: LiveSnapshot | null;
  history: LiveSnapshot[];
  paused: boolean;
}

export function SensorsPage({ info, latest, history, paused }: SensorsPageProps) {
  const load = cpuLoad(latest);
  const packageTemp = latest?.cpu.packageTempC ?? null;
  const powerLocked = latest?.cpu.powerLocked ?? info.capabilities.raplLocked;
  const fan = primaryFan(latest);
  const gpuInfo = info.gpus[0];
  const gpu = gpuInfo ? gpuLive(latest, gpuInfo.pciAddress) : null;
  const battery = latest?.battery ?? null;
  const memoryPct =
    latest && latest.memory.totalBytes > 0
      ? (latest.memory.usedBytes / latest.memory.totalBytes) * 100
      : null;

  return (
    <div className="page">
      <PageIntro
        eyebrow="09 — Live telemetry"
        title="Sensors"
        description={t.page.sensors.description}
        aside={
          <div className="tag-row">
            <Tag tone={paused ? "warn" : "ok"}>
              {paused ? t.topbar.paused : "Sampling · 1 Hz"}
            </Tag>
            {latest && <Tag>{timeOnly(latest.timestampMs)}</Tag>}
          </div>
        }
      />

      {paused && (
        <div className="paused-note">
          <Icon name="pause" size={16} />
          <div>
            <strong>Sampling paused</strong>
            <p>
              Live counters stop while the window is unfocused. They resume immediately
              when you return.
            </p>
          </div>
        </div>
      )}

      {latest === null ? (
        <Card index="01" title="Live sample">
          <EmptyState
            title="Waiting for the first sample"
            body="The 1 Hz sampler is starting. Values appear as soon as the first interval completes."
            icon="sensors"
          />
        </Card>
      ) : (
        <>
          <div className="metric-grid">
            <MetricCard
              label={L.cpuLoad}
              value={load === null ? "—" : load.toFixed(1)}
              unit="%"
              values={cpuLoadSeries(history)}
              min={0}
              max={100}
              footRight={`${latest.cpu.perCore.length} threads`}
            />
            <MetricCard
              label={L.packageTemp}
              value={packageTemp === null ? "—" : packageTemp.toFixed(1)}
              unit="°C"
              values={cpuTempSeries(history)}
              min={20}
              max={100}
              tone={packageTemp !== null && packageTemp > 82 ? "danger" : "accent"}
              footRight="coretemp · package id 0"
            />
            <MetricCard
              label={L.packagePower}
              value={
                powerLocked
                  ? "—"
                  : latest.cpu.packagePowerW === null
                    ? "—"
                    : latest.cpu.packagePowerW.toFixed(1)
              }
              unit={powerLocked ? undefined : "W"}
              values={cpuPowerSeries(history)}
              tone="mint"
              locked={powerLocked}
              footRight={powerLocked ? "RAPL is root-only" : "Intel RAPL"}
            />
            <MetricCard
              label={L.memoryUsed}
              value={memoryPct === null ? "—" : memoryPct.toFixed(1)}
              unit="%"
              values={memoryPercentSeries(history)}
              min={0}
              max={100}
              tone="mint"
              footRight="MemAvailable delta"
            />
            {gpuInfo && (
              <MetricCard
                label={L.gpuFrequency}
                value={gpu?.freqMhz == null ? "—" : Math.round(gpu.freqMhz).toLocaleString("en-US")}
                unit="MHz"
                values={gpuFreqSeries(history, gpuInfo.pciAddress)}
                tone="accent"
                footRight={`${text(gpuInfo.driver)} · ${gpuInfo.drmCard ?? "DRM"}`}
              />
            )}
            <MetricCard
              label={L.fanSpeed}
              value={fan ? Math.round(fan.rpm).toLocaleString("en-US") : "—"}
              unit="RPM"
              values={fanSeries(history)}
              tone="mint"
              footRight={fan ? `${fan.source} · ${fan.label}` : t.labels.noTachometer}
            />
            {battery && (
              <MetricCard
                label={L.battery}
                value={battery.capacityPercent === null ? "—" : battery.capacityPercent.toFixed(0)}
                unit="%"
                values={batterySeries(history)}
                min={0}
                max={100}
                tone="mint"
                footRight={text(battery.status)}
              />
            )}
          </div>

          <div className="grid grid-2">
            <Card
              index="01"
              title={L.temperatures}
              aside={<span className="card-count">{latest.temperatures.length} sensors</span>}
            >
              {latest.temperatures.length === 0 ? (
                <p className="muted-copy">{t.common.noData}</p>
              ) : (
                <div className="sensor-list">
                  {latest.temperatures.map((reading) => (
                    <div
                      className="sensor-row"
                      key={`${reading.source}-${reading.label}`}
                    >
                      <div className="sensor-ident">
                        <span className="sensor-label">{reading.label}</span>
                        <span className="sensor-source">{reading.source}</span>
                      </div>
                      <Meter
                        value={reading.valueC}
                        tone={reading.valueC > 85 ? "danger" : "accent"}
                        label={`${reading.label} temperature`}
                      />
                      <span className="sensor-value">{temp(reading.valueC)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="stack">
              <Card index="02" title={L.fans}>
                {latest.fans.length === 0 ? (
                  <p className="muted-copy">{t.labels.noTachometer}</p>
                ) : (
                  <div className="fan-list">
                    {latest.fans.map((entry) => (
                      <div className="fan-row" key={`${entry.source}-${entry.label}`}>
                        <div>
                          <span className="eyebrow">{entry.source}</span>
                          <strong>{entry.label}</strong>
                        </div>
                        <div className="fan-readout">
                          <span>{integer(entry.rpm)}</span>
                          <small>RPM</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {battery && (
                <Card
                  index="03"
                  title={L.battery}
                  aside={<Tag>{text(battery.status)}</Tag>}
                >
                  <div className="battery-readout">
                    <span className="battery-big">{pct(battery.capacityPercent, 0)}</span>
                    <span className="battery-name">{battery.name}</span>
                  </div>
                  <Meter
                    value={battery.capacityPercent ?? 0}
                    tone="mint"
                    label="Battery charge"
                  />
                  <SpecList className="spec-list-compact">
                    <SpecRow label={L.voltage} value={battery.voltageV === null ? "—" : `${battery.voltageV.toFixed(2)} V`} />
                    <SpecRow
                      label={L.power}
                      value={battery.powerW === null ? "—" : `${battery.powerW.toFixed(1)} W`}
                    />
                    <SpecRow
                      label={L.energy}
                      value={
                        battery.energyNowWh === null
                          ? "—"
                          : `${battery.energyNowWh.toFixed(1)} Wh`
                      }
                    />
                  </SpecList>
                </Card>
              )}

              <Card index="04" title="Kernel context">
                <SpecList className="spec-list-compact">
                  <SpecRow
                    label={L.loadAverage}
                    value={latest.cpu.loadAverage.map((value) => value.toFixed(2)).join(" · ")}
                  />
                  <SpecRow label={L.processes} value={integer(latest.processCount)} />
                  <SpecRow label={L.currentClock} value={ghz(cpuFrequency(latest))} />
                  <SpecRow label={L.governor} value={text(latest.cpu.governor)} />
                  <SpecRow label={L.lastSample} value={timeOnly(latest.timestampMs)} />
                </SpecList>
              </Card>
            </div>
          </div>

          <Card
            index="05"
            title={L.perCore}
            aside={<span className="card-count">{latest.cpu.perCore.length} logical processors</span>}
          >
            <div className="thread-grid">
              {latest.cpu.perCore.map((core) => (
                <div className="thread-cell" key={core.id}>
                  <div className="thread-head">
                    <span>CPU {core.id}</span>
                    <span className="mono">
                      {core.freqMhz === null ? "—" : `${Math.round(core.freqMhz)} MHz`}
                    </span>
                  </div>
                  <Meter value={core.usagePercent} label={`CPU ${core.id} load`} />
                  <div className="thread-foot">
                    <span>{pct(core.usagePercent, 0)}</span>
                    <span>{temp(core.tempC)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

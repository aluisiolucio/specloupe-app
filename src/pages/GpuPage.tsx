import { useState } from "react";

import { Card } from "../components/Card";
import { EmptyState } from "../components/States";
import { PageIntro } from "../components/PageIntro";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";
import { t, L } from "../i18n/en";
import { bytes, pct, temp, text } from "../lib/format";
import { gpuLive } from "../lib/live";
import type { GraphicsApiInfo, GpuInfo, LiveSnapshot, SystemInfo } from "../lib/types";

interface GpuPageProps {
  info: SystemInfo;
  latest: LiveSnapshot | null;
}

function gpuName(gpu: GpuInfo): string {
  return [gpu.vendor, gpu.device].filter(Boolean).join(" ") || gpu.pciAddress;
}

function ApiCard({ api, index }: { api: GraphicsApiInfo | null; index: string }) {
  return (
    <Card index={index} title={api?.name ?? "Graphics API"}>
      {api ? (
        <SpecList>
          <SpecRow label={L.cpuVendor} value={text(api.vendor)} mono={false} />
          <SpecRow label={L.renderer} value={text(api.renderer)} mono={false} />
          <SpecRow label="Driver version" value={text(api.version)} />
          <SpecRow label={L.apiVersion} value={text(api.apiVersion)} />
          <SpecRow
            label={L.vram}
            value={api.memoryBytes ? bytes(api.memoryBytes) : "—"}
          />
          <SpecRow
            label={L.unifiedMemory}
            value={api.unifiedMemory === null ? "—" : api.unifiedMemory ? t.common.yes : t.common.no}
          />
        </SpecList>
      ) : (
        <p className="muted-copy">{t.common.noData}</p>
      )}
    </Card>
  );
}

export function GpuPage({ info, latest }: GpuPageProps) {
  const [showModes, setShowModes] = useState(false);
  const first = info.gpus[0];
  const totalDisplays = info.gpus.reduce((count, gpu) => count + gpu.displays.length, 0);

  return (
    <div className="page">
      <PageIntro
        eyebrow="05 — Graphics"
        title="Graphics processors"
        description={
          first
            ? `${info.gpus.length} render device${info.gpus.length === 1 ? "" : "s"} · ${totalDisplays} display connector${totalDisplays === 1 ? "" : "s"}`
            : t.empty.noGpuBody
        }
        aside={
          first ? (
            <div className="tag-row">
              <Tag tone="accent">{text(first.driver)}</Tag>
              {first.vramShared && <Tag>{L.sharedMemory}</Tag>}
            </div>
          ) : undefined
        }
      />

      {info.gpus.length === 0 && (
        <Card index="01" title="Graphics processors">
          <EmptyState title={t.empty.noGpuTitle} body={t.empty.noGpuBody} icon="gpu" />
        </Card>
      )}

      {info.gpus.map((gpu, index) => {
        const live = gpuLive(latest, gpu.pciAddress);
        const displayCount = gpu.displays.filter(
          (display) => display.status === "connected",
        ).length;
        const noSensors = live !== null && live.tempC === null && live.usagePercent === null;

        return (
          <div className="gpu-stack" key={gpu.pciAddress}>
            <section className="gpu-showcase">
              <div className="gpu-showcase-main">
                <div className="eyebrow">
                  Graphics processor {String(index + 1).padStart(2, "0")}
                </div>
                <h2>{gpuName(gpu)}</h2>
                <div className="gpu-sub">
                  {gpu.pciAddress} · {text(gpu.vendorId)}:{text(gpu.deviceId)} · {text(gpu.driver)}
                </div>
                <div className="tag-row">
                  <Tag tone="accent">{text(gpu.driver)}</Tag>
                  <Tag>{displayCount} active display{displayCount === 1 ? "" : "s"}</Tag>
                  {gpu.vramShared && <Tag tone="mint">{L.sharedMemory}</Tag>}
                </div>
              </div>

              <div className="gpu-readouts">
                <div className="gpu-readout">
                  <span>{L.gpuFrequency}</span>
                  <strong>{live?.freqMhz != null ? `${live.freqMhz.toFixed(0)} MHz` : "—"}</strong>
                </div>
                <div className="gpu-readout">
                  <span>{L.temperature}</span>
                  <strong>{temp(live?.tempC)}</strong>
                </div>
                <div className="gpu-readout">
                  <span>{L.load}</span>
                  <strong>{pct(live?.usagePercent, 0)}</strong>
                </div>
                <div className="gpu-readout">
                  <span>{L.vram}</span>
                  <strong>{bytes(gpu.vramBytes)}</strong>
                </div>
              </div>

              {noSensors && (
                <p className="gpu-note">
                  This kernel driver does not expose temperature or utilization counters
                  for this device. Frequency is read directly from the DRM sysfs node.
                </p>
              )}
            </section>

            <div className="grid grid-2">
              <Card index="01" title="Device & driver">
                <SpecList>
                  <SpecRow label={L.pciAddress} value={text(gpu.pciAddress)} />
                  <SpecRow label={L.cpuVendor} value={text(gpu.vendor)} mono={false} />
                  <SpecRow label={L.device} value={text(gpu.device)} mono={false} />
                  <SpecRow label={L.vendorId} value={text(gpu.vendorId)} />
                  <SpecRow label={L.deviceId} value={text(gpu.deviceId)} />
                  <SpecRow label={L.subsystem} value={text(gpu.subsystem)} mono={false} />
                  <SpecRow label={L.class} value={text(gpu.class)} mono={false} />
                  <SpecRow label={L.driver} value={text(gpu.driver)} />
                  <SpecRow label={L.modules} value={gpu.modules.join(", ") || "—"} />
                  <SpecRow label={L.drmCard} value={text(gpu.drmCard)} />
                </SpecList>
              </Card>

              <Card
                index="02"
                title={L.pcieLink}
                aside={
                  gpu.pcie?.currentSpeed
                    ? <Tag tone="accent">Gen active</Tag>
                    : <Tag tone="muted">Integrated / unknown</Tag>
                }
              >
                <SpecList>
                  <SpecRow label={L.linkSpeed} value={text(gpu.pcie?.currentSpeed)} />
                  <SpecRow label={L.linkWidth} value={text(gpu.pcie?.currentWidth)} />
                  <SpecRow label={L.maxLinkSpeed} value={text(gpu.pcie?.maxSpeed)} />
                  <SpecRow label={L.maxLinkWidth} value={text(gpu.pcie?.maxWidth)} />
                </SpecList>
                <div className="aside-note">
                  <span className="eyebrow">Video memory</span>
                  <p>
                    {gpu.vramBytes
                      ? `${bytes(gpu.vramBytes)} ${gpu.vramShared ? "of shared system memory" : "dedicated"}`
                      : t.common.notAvailable}
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-2">
              <ApiCard api={gpu.opengl} index="03" />
              <ApiCard api={gpu.vulkan} index="04" />
            </div>

            <Card
              index="05"
              title={L.displays}
              flush
              aside={
                <div className="tag-row">
                  <span className="card-count">{gpu.displays.length} connectors</span>
                  {gpu.displays.some((display) => display.modes.length > 0) && (
                    <button
                      type="button"
                      className={`filter-toggle${showModes ? " is-active" : ""}`}
                      aria-pressed={showModes}
                      onClick={() => setShowModes((current) => !current)}
                    >
                      {showModes ? t.common.hideModes : t.common.showModes}
                    </button>
                  )}
                </div>
              }
            >
              {gpu.displays.length === 0 ? (
                <p className="muted-copy pad">{t.common.noData}</p>
              ) : (
                <div className="display-list">
                  {gpu.displays.map((display) => (
                    <div
                      className={`display-row${showModes ? "" : " is-condensed"}`}
                      key={display.connector}
                    >
                      <div className="display-ident">
                        <span className="display-connector">{display.connector}</span>
                        <Tag tone={display.status === "connected" ? "ok" : "muted"}>
                          {display.status}
                        </Tag>
                      </div>
                      <div className="display-monitor">
                        <strong>{display.monitorName ?? "—"}</strong>
                        <span>{display.sizeCm ?? t.common.unknown}</span>
                      </div>
                      <div className="display-current">
                        <span>{L.currentMode}</span>
                        <strong>{display.currentMode ?? "—"}</strong>
                      </div>
                      {showModes && (
                        <div className="display-modes">
                          {display.modes.slice(0, 4).map((mode, index) => (
                            <span className="chip" key={`${mode}-${index}`}>{mode}</span>
                          ))}
                          {display.modes.length === 0 && (
                            <span className="muted-copy">—</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

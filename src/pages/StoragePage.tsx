import { Card } from "../components/Card";
import { Meter } from "../components/Meter";
import { PageIntro } from "../components/PageIntro";
import { PrivilegedPanel } from "../components/PrivilegedPanel";
import { EmptyState } from "../components/States";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";
import type { PrivilegedState } from "../hooks/usePrivileged";
import { t, L } from "../i18n/en";
import { bytes, integer, pct, temp, text } from "../lib/format";
import type { SmartInfo, SystemInfo } from "../lib/types";

interface StoragePageProps {
  info: SystemInfo;
  privileged: PrivilegedState;
}

function SmartStrip({ smart }: { smart: SmartInfo }) {
  const tone = smart.healthPassed === false ? "danger" : smart.healthPassed ? "ok" : "neutral";
  return (
    <div className="smart-strip">
      <div className="smart-badge">
        <Tag tone={tone}>{smart.healthText ?? t.common.unknown}</Tag>
        <span className="eyebrow">SMART health</span>
      </div>
      <div className="smart-stats">
        <div>
          <span>{L.temperature}</span>
          <strong>{temp(smart.temperatureC)}</strong>
        </div>
        <div>
          <span>{L.powerOnHours}</span>
          <strong>{smart.powerOnHours === null ? "—" : `${integer(smart.powerOnHours)} h`}</strong>
        </div>
        <div>
          <span>{L.powerCycles}</span>
          <strong>{integer(smart.powerCycles)}</strong>
        </div>
        <div>
          <span>{L.dataWritten}</span>
          <strong>{bytes(smart.dataWrittenBytes)}</strong>
        </div>
        <div>
          <span>{L.percentageUsed}</span>
          <strong>{pct(smart.percentageUsed, 1)}</strong>
        </div>
        <div>
          <span>{L.mediaErrors}</span>
          <strong>{integer(smart.mediaErrors)}</strong>
        </div>
      </div>
    </div>
  );
}

export function StoragePage({ info, privileged }: StoragePageProps) {
  const total = info.storage.reduce((sum, disk) => sum + disk.sizeBytes, 0);
  const disks = info.storage;

  return (
    <div className="page">
      <PageIntro
        eyebrow="06 — Storage"
        title="Storage"
        description={`${disks.length} drive${disks.length === 1 ? "" : "s"} · ${bytes(total)} attached · filesystem occupancy from statvfs`}
        aside={
          <div className="tag-row">
            {[...new Set(disks.map((disk) => disk.interface).filter(Boolean))].map(
              (kind) => <Tag key={kind} tone="accent">{kind}</Tag>,
            )}
          </div>
        }
      />

      {disks.length === 0 && (
        <Card index="01" title="Block devices">
          <EmptyState
            title={t.empty.noStorageTitle}
            body={t.empty.noStorageBody}
            icon="storage"
          />
        </Card>
      )}

      <PrivilegedPanel
        capabilities={info.capabilities}
        data={privileged.data}
        loading={privileged.loading}
        error={privileged.error}
        onLoad={(refresh) => void privileged.load(refresh)}
      />

      {disks.map((disk, index) => {
        const smart = privileged.data?.smart.find(
          (entry) => entry.device === disk.path,
        );
        return (
          <Card
            key={disk.name}
            index={String(index + 1).padStart(2, "0")}
            title={disk.model ?? disk.name}
            aside={
              <div className="tag-row">
                <Tag tone="accent">{text(disk.interface)}</Tag>
                <Tag>{disk.rotational ? L.mechanical : L.solidState}</Tag>
                <Tag tone={disk.temperatureC !== null && disk.temperatureC > 70 ? "danger" : "neutral"}>
                  {temp(disk.temperatureC)}
                </Tag>
              </div>
            }
          >
            <div className="disk-layout">
              <div className="disk-capacity">
                <div className="eyebrow">Drive capacity</div>
                <div className="disk-big">{bytes(disk.sizeBytes)}</div>
                <div className="tag-row">
                  <Tag tone="muted">{disk.path}</Tag>
                  {disk.removable && <Tag>{L.removable}</Tag>}
                  {disk.state && <Tag>{disk.state}</Tag>}
                </div>
              </div>
              <SpecList>
                <SpecRow label={L.model} value={text(disk.model)} mono={false} />
                <SpecRow label={L.serial} value={text(disk.serial ?? smart?.serial)} />
                <SpecRow label={L.firmware} value={text(disk.firmware)} />
                <SpecRow label={L.interface} value={text(disk.interface)} />
                <SpecRow label={L.state} value={text(disk.state)} />
                <SpecRow label={L.temperature} value={temp(disk.temperatureC)} />
              </SpecList>
            </div>

            <div className="section-label is-small">
              <span>{L.partitions}</span>
              <span className="section-label-line" />
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>{L.name}</th>
                  <th>{L.filesystem}</th>
                  <th>{L.label}</th>
                  <th>{L.mountpoint}</th>
                  <th>{L.size}</th>
                  <th>{L.usage}</th>
                </tr>
              </thead>
              <tbody>
                {disk.partitions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="cell-empty">
                      No partitions reported.
                    </td>
                  </tr>
                ) : (
                  disk.partitions.map((partition) => (
                    <tr key={partition.name}>
                      <td className="mono">{partition.name}</td>
                      <td>{text(partition.fstype)}</td>
                      <td>{text(partition.label)}</td>
                      <td className="mono">{text(partition.mountpoint)}</td>
                      <td className="mono">{bytes(partition.sizeBytes)}</td>
                      <td>
                        {partition.fsUsePercent === null ? (
                          <span className="mono muted-copy">{t.common.notAvailable}</span>
                        ) : (
                          <div className="table-usage">
                            <Meter
                              value={partition.fsUsePercent}
                              tone={partition.fsUsePercent > 88 ? "danger" : "accent"}
                              label={`${partition.name} usage`}
                            />
                            <span className="mono">
                              {pct(partition.fsUsePercent, 0)}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {smart ? (
              <SmartStrip smart={smart} />
            ) : privileged.data ? (
              <p className="muted-copy smart-missing">
                No SMART record was returned for {disk.path}.
              </p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

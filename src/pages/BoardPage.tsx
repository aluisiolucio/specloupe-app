import { useState } from "react";

import { Card } from "../components/Card";
import { PageIntro } from "../components/PageIntro";
import { PrivilegedPanel } from "../components/PrivilegedPanel";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";
import type { PrivilegedState } from "../hooks/usePrivileged";
import { t, L } from "../i18n/en";
import { text } from "../lib/format";
import type { DmiSection, SystemInfo } from "../lib/types";

interface BoardPageProps {
  info: SystemInfo;
  privileged: PrivilegedState;
}

function DmiSectionCard({
  section,
  index,
}: {
  section: DmiSection;
  index: string;
}) {
  if (section.fields.length === 0) {
    return null;
  }
  return (
    <Card index={index} title={section.title || "DMI table"}>
      <SpecList>
        {section.fields.map((field, position) => (
          <SpecRow
            key={`${field.key}-${position}`}
            label={field.key}
            value={field.value}
            mono={false}
          />
        ))}
      </SpecList>
    </Card>
  );
}

export function BoardPage({ info, privileged }: BoardPageProps) {
  const [showRaw, setShowRaw] = useState(false);
  const board = info.board;
  const dmi = privileged.data?.dmi ?? null;

  return (
    <div className="page">
      <PageIntro
        eyebrow="03 — Mainboard & firmware"
        title={board.productName ?? "Motherboard"}
        description={`${text(board.systemVendor)} · board ${text(board.boardName)} · BIOS ${text(board.biosVersion)}`}
        aside={
          <div className="tag-row">
            <Tag tone="accent">{text(board.chassisType)}</Tag>
            <Tag>{text(board.biosDate)}</Tag>
            {board.serialLocked && <Tag tone="warn">{L.locked}</Tag>}
          </div>
        }
      />

      <div className="grid grid-2">
        <Card index="01" title="System identity">
          <SpecList>
            <SpecRow label={L.systemVendor} value={text(board.systemVendor)} mono={false} />
            <SpecRow label={L.productName} value={text(board.productName)} mono={false} />
            <SpecRow label={L.productVersion} value={text(board.productVersion)} />
            <SpecRow label={L.productFamily} value={text(board.productFamily)} mono={false} />
            <SpecRow label={L.productSku} value={text(board.productSku)} />
            <SpecRow label={L.chassisVendor} value={text(board.chassisVendor)} mono={false} />
            <SpecRow label={L.chassisType} value={text(board.chassisType)} />
            <SpecRow label={L.chassisVersion} value={text(board.chassisVersion)} />
          </SpecList>
        </Card>

        <Card
          index="02"
          title="Board & firmware"
          aside={
            board.serialLocked
              ? <Tag tone="warn">Serials restricted</Tag>
              : undefined
          }
        >
          <SpecList>
            <SpecRow label={L.boardVendor} value={text(board.boardVendor)} mono={false} />
            <SpecRow label={L.boardName} value={text(board.boardName)} />
            <SpecRow label={L.boardVersion} value={text(board.boardVersion)} />
            <SpecRow
              label={L.boardSerial}
              value={board.boardSerial ?? <Tag tone="warn">{L.locked}</Tag>}
            />
            <SpecRow label={L.biosVendor} value={text(board.biosVendor)} mono={false} />
            <SpecRow label={L.biosVersion} value={text(board.biosVersion)} />
            <SpecRow label={L.biosDate} value={text(board.biosDate)} />
            <SpecRow label={L.architecture} value={text(info.overview.architecture)} />
          </SpecList>
        </Card>
      </div>

      <PrivilegedPanel
        capabilities={info.capabilities}
        data={privileged.data}
        loading={privileged.loading}
        error={privileged.error}
        onLoad={(refresh) => void privileged.load(refresh)}
      />

      {dmi ? (
        <>
          <div className="filter-row">
            <span className="filter-label">Raw SMBIOS</span>
            <button
              type="button"
              className={`filter-toggle${showRaw ? " is-active" : ""}`}
              aria-pressed={showRaw}
              onClick={() => setShowRaw((current) => !current)}
            >
              {showRaw ? t.common.hideRawSmbios : t.common.showRawSmbios}
            </button>
            <span className="filter-note">
              Four DMI tables plus the processor inventory
            </span>
          </div>

          {showRaw && (
            <>
              <div className="section-label">
                <span>SMBIOS tables</span>
                <span className="section-label-line" />
              </div>

              <div className="grid grid-2">
                <DmiSectionCard section={dmi.bios} index="03" />
                <DmiSectionCard section={dmi.system} index="04" />
                <DmiSectionCard section={dmi.board} index="05" />
                <DmiSectionCard section={dmi.chassis} index="06" />
              </div>

              {dmi.processors.length > 0 && (
                <Card
                  index="07"
                  title="SMBIOS processors"
                  aside={<span className="card-count">{dmi.processors.length} socket</span>}
                >
                  <div className="processor-list">
                    {dmi.processors.map((processor, index) => (
                      <div className="processor-row" key={`${processor.socket}-${index}`}>
                        <div className="processor-id">
                          <span className="eyebrow">Socket {index + 1}</span>
                          <strong>{text(processor.socket)}</strong>
                          <span>{text(processor.version)}</span>
                        </div>
                        <SpecList className="spec-list-inline">
                          <SpecRow label={L.maxBoost} value={text(processor.maxSpeed)} />
                          <SpecRow label={L.currentClock} value={text(processor.currentSpeed)} />
                          <SpecRow label={L.cores} value={text(processor.coreCount)} />
                          <SpecRow label={L.threads} value={text(processor.threadCount)} />
                          <SpecRow label="L2 cache" value={text(processor.l2Cache)} />
                          <SpecRow label="L3 cache" value={text(processor.l3Cache)} />
                        </SpecList>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

import { Card } from "../components/Card";
import { PageIntro } from "../components/PageIntro";
import { EmptyState } from "../components/States";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";
import { t, L } from "../i18n/en";
import { speed, text } from "../lib/format";
import type { NetInterface, SystemInfo } from "../lib/types";

interface NetworkPageProps {
  info: SystemInfo;
}

function InterfaceCard({ net, index }: { net: NetInterface; index: string }) {
  const stateTone =
    net.state === "up" ? "ok" : net.state === "down" ? "muted" : "neutral";
  return (
    <Card
      index={index}
      title={net.name}
      aside={
        <div className="tag-row">
          {net.isWireless && <Tag tone="accent">{L.wireless}</Tag>}
          {!net.isWireless && !net.isVirtual && <Tag>{L.wired}</Tag>}
          {net.isVirtual && <Tag tone="muted">{L.virtual}</Tag>}
          <Tag tone={stateTone}>{text(net.state)}</Tag>
        </div>
      }
    >
      <SpecList>
        <SpecRow label={L.mac} value={text(net.mac)} />
        <SpecRow label={L.driver} value={text(net.driver)} />
        <SpecRow label={L.device} value={text(net.device)} mono={false} />
        <SpecRow label={L.pciAddress} value={text(net.pciAddress)} />
        <SpecRow label={L.linkSpeed} value={speed(net.speedMbps)} />
        <SpecRow label={L.duplex} value={text(net.duplex)} />
        <SpecRow label={L.mtu} value={net.mtu === null ? "—" : String(net.mtu)} />
      </SpecList>

      <div className="address-block">
        <div className="eyebrow">{L.addresses}</div>
        {net.addresses.length === 0 ? (
          <p className="muted-copy">No addresses assigned.</p>
        ) : (
          <div className="address-list">
            {net.addresses.map((address) => (
              <span
                className="address-chip"
                key={`${address.family}-${address.address}`}
              >
                <span className="address-family">{address.family}</span>
                <span className="mono address-value">
                  {address.address}/{address.prefixLen}
                </span>
                {address.scope && (
                  <span className="address-scope">{address.scope}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export function NetworkPage({ info }: NetworkPageProps) {
  const physical = info.network.filter((net) => !net.isVirtual);
  const virtual = info.network.filter((net) => net.isVirtual);
  const ordered = [...physical, ...virtual];

  return (
    <div className="page">
      <PageIntro
        eyebrow="07 — Network"
        title="Network"
        description={`${physical.length} physical interface${physical.length === 1 ? "" : "s"} · ${virtual.length} virtual · addresses read from rtnetlink`}
        aside={
          <div className="tag-row">
            {info.network.some((net) => net.isWireless) && (
              <Tag tone="accent">{L.wireless}</Tag>
            )}
            {info.network.some((net) => !net.isVirtual && !net.isWireless) && (
              <Tag>{L.wired}</Tag>
            )}
          </div>
        }
      />

      {ordered.length === 0 ? (
        <Card index="01" title={L.addresses}>
          <EmptyState
            title={t.empty.noNetworkTitle}
            body={t.empty.noNetworkBody}
            icon="network"
          />
        </Card>
      ) : (
        <div className="grid grid-2">
          {ordered.map((net, index) => (
            <InterfaceCard
              key={net.name}
              net={net}
              index={String(index + 1).padStart(2, "0")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

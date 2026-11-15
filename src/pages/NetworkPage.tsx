import { useState } from "react";

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

function InterfaceCard({
  net,
  index,
  showLinkLocal,
}: {
  net: NetInterface;
  index: string;
  showLinkLocal: boolean;
}) {
  const addresses = showLinkLocal
    ? net.addresses
    : net.addresses.filter((address) => address.scope !== "link");
  const hiddenLinkLocal = addresses.length < net.addresses.length;
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
        {addresses.length === 0 ? (
          <p className="muted-copy">
            {hiddenLinkLocal ? L.linkLocalHidden : "No addresses assigned."}
          </p>
        ) : (
          <div className="address-list">
            {addresses.map((address) => (
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
        {hiddenLinkLocal && addresses.length > 0 && (
          <p className="address-note">{L.linkLocalHidden}</p>
        )}
      </div>
    </Card>
  );
}

export function NetworkPage({ info }: NetworkPageProps) {
  const [showVirtual, setShowVirtual] = useState(false);
  const [showLinkLocal, setShowLinkLocal] = useState(false);
  const physical = info.network.filter((net) => !net.isVirtual);
  const virtual = info.network.filter((net) => net.isVirtual);
  const visible = showVirtual ? info.network : physical;
  const linkLocalCount = info.network.reduce(
    (count, net) => count + net.addresses.filter((address) => address.scope === "link").length,
    0,
  );

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

      {info.network.length > 0 && (
        <div className="filter-row">
          <span className="filter-label">View</span>
          {virtual.length > 0 && (
            <button
              type="button"
              className={`filter-toggle${showVirtual ? " is-active" : ""}`}
              aria-pressed={showVirtual}
              onClick={() => setShowVirtual((current) => !current)}
            >
              {showVirtual
                ? t.common.hideVirtual
                : `${t.common.showVirtual} (${virtual.length})`}
            </button>
          )}
          {linkLocalCount > 0 && (
            <button
              type="button"
              className={`filter-toggle${showLinkLocal ? " is-active" : ""}`}
              aria-pressed={showLinkLocal}
              onClick={() => setShowLinkLocal((current) => !current)}
            >
              {showLinkLocal
                ? t.common.hideLinkLocal
                : `${t.common.showLinkLocal} (${linkLocalCount})`}
            </button>
          )}
        </div>
      )}

      {info.network.length === 0 ? (
        <Card index="01" title={L.addresses}>
          <EmptyState
            title={t.empty.noNetworkTitle}
            body={t.empty.noNetworkBody}
            icon="network"
          />
        </Card>
      ) : visible.length === 0 ? (
        <Card index="01" title="Physical interfaces">
          <p className="muted-copy">
            No physical interfaces found. Enable virtual interfaces to inspect them.
          </p>
        </Card>
      ) : (
        <div className="grid grid-2">
          {visible.map((net, index) => (
            <InterfaceCard
              key={net.name}
              net={net}
              showLinkLocal={showLinkLocal}
              index={String(index + 1).padStart(2, "0")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

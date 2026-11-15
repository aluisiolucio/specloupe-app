import { useState } from "react";

import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { PageIntro } from "../components/PageIntro";
import { SpecList, SpecRow } from "../components/SpecList";
import { Tag } from "../components/Tag";
import { t, L } from "../i18n/en";
import { integer, text, yesNo } from "../lib/format";
import type { SystemInfo } from "../lib/types";

interface SoftwarePageProps {
  info: SystemInfo;
}

export function SoftwarePage({ info }: SoftwarePageProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const software = info.software;
  const visibleExtra = software.extra.filter(
    (entry) => !/^(home|documentation)_url$/i.test(entry.key),
  );
  const secureTone =
    software.secureBoot === null ? "neutral" : software.secureBoot ? "ok" : "warn";

  return (
    <div className="page">
      <PageIntro
        eyebrow="08 — Software & environment"
        title={software.distroName ?? "Software"}
        description={`${text(software.kernel)} · ${text(software.desktop)} / ${text(software.sessionType)}`}
        aside={
          <div className="tag-row">
            <Tag tone={secureTone}>
              Secure boot {software.secureBoot === null ? t.common.unknown : yesNo(software.secureBoot)}
            </Tag>
            <Tag>{text(software.architecture)}</Tag>
          </div>
        }
      />

      {(software.kernelCmdline || visibleExtra.length > 0) && (
        <div className="filter-row">
          <span className="filter-label">Advanced</span>
          <button
            type="button"
            className={`filter-toggle${showAdvanced ? " is-active" : ""}`}
            aria-pressed={showAdvanced}
            onClick={() => setShowAdvanced((current) => !current)}
          >
            {showAdvanced ? t.common.hideAdvanced : t.common.showAdvanced}
          </button>
          <span className="filter-note">
            Kernel command line and OS-release extras
          </span>
        </div>
      )}

      <div className="grid grid-2">
        <Card index="01" title="Operating system">
          <SpecList>
            <SpecRow label={L.distro} value={text(software.distroName)} mono={false} />
            <SpecRow label={L.distroId} value={text(software.distroId)} />
            <SpecRow label={L.distroVersion} value={text(software.distroVersion)} />
            <SpecRow label={L.idLike} value={text(software.distroIdLike)} mono={false} />
            <SpecRow label={L.architecture} value={text(software.architecture)} />
            <SpecRow label={L.glibc} value={text(software.glibc)} />
            <SpecRow label={L.systemd} value={text(software.systemd)} mono={false} />
          </SpecList>
        </Card>

        <Card
          index="02"
          title="Kernel & boot"
          aside={<Tag tone={secureTone}>{text(software.bootMode)}</Tag>}
        >
          <SpecList>
            <SpecRow label={L.kernel} value={text(software.kernel)} />
            <SpecRow label={L.kernelBuild} value={text(software.kernelBuild)} mono={false} />
            <SpecRow label={L.bootMode} value={text(software.bootMode)} />
            <SpecRow
              label={L.secureBoot}
              value={<Tag tone={secureTone}>{yesNo(software.secureBoot)}</Tag>}
            />
            <SpecRow label={L.virtualization} value={text(software.virtualization)} />
            {showAdvanced && (
              <SpecRow wide label={L.kernelCmdline} value={text(software.kernelCmdline)} />
            )}
          </SpecList>
        </Card>

        <Card index="03" title="Session">
          <SpecList>
            <SpecRow label={L.desktop} value={text(software.desktop)} />
            <SpecRow label={L.sessionType} value={text(software.sessionType)} />
            <SpecRow label={L.shell} value={text(software.shell)} />
            <SpecRow label={L.locale} value={text(software.locale)} />
            <SpecRow label={L.timezone} value={text(software.timezone)} />
            <SpecRow label={L.hostname} value={text(info.overview.hostname)} />
          </SpecList>
        </Card>

        <Card index="04" title="Package inventory">
          <SpecList>
            <SpecRow label={L.packageManager} value={text(software.packageManager)} />
            <SpecRow
              label={L.installedPackages}
              value={integer(software.packageCount)}
              tone="accent"
            />
            <SpecRow
              label={L.flatpakApps}
              value={software.flatpakCount === null ? "—" : integer(software.flatpakCount)}
            />
          </SpecList>
          <p className="aside-note-copy">
            Package counts are read locally from the active package managers. No
            repository metadata is fetched.
          </p>
        </Card>
      </div>

      {showAdvanced && visibleExtra.length > 0 && (
        <Card index="05" title={L.osRelease}>
          <SpecList>
            {visibleExtra.map((entry) => (
              <SpecRow key={entry.key} label={entry.key} value={entry.value} mono={false} />
            ))}
          </SpecList>
        </Card>
      )}

      <Card
        index="06"
        title="Privacy by design"
        aside={<Tag tone="ok">No telemetry</Tag>}
      >
        <div className="privacy-layout">
          <div className="privacy-glyph">
            <Icon name="shield" size={28} />
          </div>
          <div className="privacy-copy">
            <h3>The report leaves only where you send it.</h3>
            <p>
              SpecLoupe performs no network requests and collects no telemetry. Protected
              DMI and SMART data is read through a fixed polkit helper that runs only when
              you ask and exits immediately afterward.
            </p>
          </div>
          <div className="privacy-facts">
            <div>
              <span>Telemetry</span>
              <strong>None</strong>
            </div>
            <div>
              <span>Network access</span>
              <strong>None</strong>
            </div>
            <div>
              <span>Exports</span>
              <strong>Local file</strong>
            </div>
            <div>
              <span>Default redaction</span>
              <strong>Serials · MAC · IP</strong>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

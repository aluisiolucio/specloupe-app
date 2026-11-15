use std::process::Command;

use serde_json::Value;

use crate::collectors::storage;
use crate::models::{
    DimmInfo, DmiInfo, DmiProcessor, DmiSection, KeyValue, PrivilegedInfo, SmartInfo,
};
use crate::util::{command_exists, is_root};

const HELPER_SCRIPT: &str = r#"set -u
DMIDECODE="$(command -v dmidecode || true)"
SMARTCTL="$(command -v smartctl || true)"
echo "===DMI==="
if [ -n "$DMIDECODE" ]; then
  "$DMIDECODE" -t 0,1,2,3,4,17 2>/dev/null || true
fi
for dev in "$@"; do
  case "$dev" in
    /dev/*) ;;
    *) continue ;;
  esac
  echo "===SMART:$dev==="
  if [ -n "$SMARTCTL" ]; then
    "$SMARTCTL" -j -a "$dev" 2>/dev/null || true
  fi
done
echo "===END==="
"#;

pub fn available() -> bool {
    is_root() || command_exists("pkexec")
}

pub fn load() -> Result<PrivilegedInfo, String> {
    if !available() {
        return Err("pkexec is not available on this system.".to_string());
    }

    let disks = storage::collect()
        .into_iter()
        .map(|disk| disk.path)
        .filter(|path| valid_device_path(path))
        .collect::<Vec<_>>();

    let mut command = if is_root() {
        let mut command = Command::new("/bin/bash");
        command.args(["-c", HELPER_SCRIPT, "specloupe-helper"]);
        command
    } else {
        let mut command = Command::new("pkexec");
        command.args(["/bin/bash", "-c", HELPER_SCRIPT, "specloupe-helper"]);
        command
    };
    command.args(&disks);

    let output = command
        .output()
        .map_err(|error| format!("Could not start the privileged helper: {error}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        if stderr.is_empty() {
            return Err("Administrator access was not granted.".to_string());
        }
        return Err(format!("Administrator access was not granted: {stderr}"));
    }

    let text = String::from_utf8_lossy(&output.stdout);
    Ok(parse_helper_output(&text))
}

fn valid_device_path(path: &str) -> bool {
    path.starts_with("/dev/")
        && !path.contains("..")
        && path
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '/' | '-' | '_' | '.'))
}

fn parse_helper_output(text: &str) -> PrivilegedInfo {
    let mut dmi_text = String::new();
    let mut smart_sections: Vec<(String, String)> = Vec::new();
    let mut current: Option<(String, String)> = None;

    for line in text.lines() {
        if line == "===DMI===" {
            if let Some((name, body)) = current.take() {
                smart_sections.push((name, body));
            }
            current = Some(("DMI".to_string(), String::new()));
        } else if let Some(value) = line.strip_prefix("===SMART:") {
            if let Some((name, body)) = current.take() {
                if name == "DMI" {
                    dmi_text = body;
                } else if let Some(device) = name.strip_prefix("SMART:") {
                    smart_sections.push((device.to_string(), body));
                }
            }
            let device = value.trim_end_matches('=').to_string();
            current = Some((format!("SMART:{device}"), String::new()));
        } else if line == "===END===" {
            break;
        } else if let Some((_, body)) = current.as_mut() {
            body.push_str(line);
            body.push('\n');
        }
    }
    if let Some((name, body)) = current {
        if name == "DMI" {
            dmi_text = body;
        } else if let Some(device) = name.strip_prefix("SMART:") {
            smart_sections.push((device.to_string(), body));
        }
    }

    let dmi = Some(parse_dmi(&dmi_text));
    let mut warnings = Vec::new();
    let mut smart = Vec::new();
    for (device, body) in smart_sections {
        if body.trim().is_empty() {
            continue;
        }
        match parse_smart(&device, &body) {
            Some(info) => {
                if info.health_passed == Some(false) {
                    warnings.push(format!("SMART health check failed for {device}."));
                }
                smart.push(info);
            }
            None => warnings.push(format!("SMART data could not be read for {device}.")),
        }
    }

    PrivilegedInfo {
        dmi,
        smart,
        warnings,
    }
}

#[derive(Debug, Default)]
struct DmiRecord {
    dmi_type: u32,
    title: String,
    fields: Vec<KeyValue>,
}

fn parse_dmi(text: &str) -> DmiInfo {
    let mut records: Vec<DmiRecord> = Vec::new();
    let mut current: Option<DmiRecord> = None;

    for line in text.lines() {
        if line.starts_with("Handle 0x") {
            if let Some(record) = current.take() {
                records.push(record);
            }
            let dmi_type = line
                .split("DMI type ")
                .nth(1)
                .and_then(|value| value.split(',').next())
                .and_then(|value| value.trim().parse::<u32>().ok())
                .unwrap_or(0);
            current = Some(DmiRecord {
                dmi_type,
                ..Default::default()
            });
            continue;
        }
        let Some(record) = current.as_mut() else {
            continue;
        };
        if line.trim().is_empty() {
            continue;
        }
        if !line.starts_with(char::is_whitespace) {
            record.title = line.trim().to_string();
            continue;
        }
        if let Some((key, value)) = line.trim().split_once(':') {
            let key = key.trim();
            let value = value.trim();
            if !key.is_empty() && !value.is_empty() {
                record.fields.push(KeyValue {
                    key: key.to_string(),
                    value: value.to_string(),
                });
            }
        }
    }
    if let Some(record) = current {
        records.push(record);
    }

    let mut info = DmiInfo::default();
    for record in &records {
        match record.dmi_type {
            0 => info.bios = section_from(record),
            1 => info.system = section_from(record),
            2 => info.board = section_from(record),
            3 => info.chassis = section_from(record),
            4 => {
                if let Some(processor) = processor_from(record) {
                    info.processors.push(processor);
                }
            }
            17 => info.memory_devices.push(dimm_from(record)),
            _ => {}
        }
    }
    info
}

fn section_from(record: &DmiRecord) -> DmiSection {
    DmiSection {
        title: if record.title.is_empty() {
            format!("DMI type {}", record.dmi_type)
        } else {
            record.title.clone()
        },
        fields: record
            .fields
            .iter()
            .filter(|field| !is_placeholder(&field.value))
            .cloned()
            .collect(),
    }
}

fn dimm_from(record: &DmiRecord) -> DimmInfo {
    let size = field_value(record, "Size");
    let populated = size
        .as_deref()
        .map(|value| {
            !value.contains("No Module")
                && !value.starts_with("0 ")
                && !value.eq_ignore_ascii_case("Unknown")
        })
        .unwrap_or(false);
    DimmInfo {
        locator: field_value(record, "Locator"),
        bank_locator: field_value(record, "Bank Locator"),
        size,
        kind: field_value(record, "Type"),
        speed: field_value(record, "Speed"),
        configured_speed: field_value(record, "Configured Memory Speed"),
        manufacturer: field_value(record, "Manufacturer"),
        serial: field_value(record, "Serial Number"),
        part_number: field_value(record, "Part Number"),
        rank: field_value(record, "Rank"),
        voltage: field_value(record, "Voltage"),
        form_factor: field_value(record, "Form Factor"),
        populated,
    }
}

fn processor_from(record: &DmiRecord) -> Option<DmiProcessor> {
    let socket = field_value(record, "Socket Designation");
    if socket.is_none() && record.fields.is_empty() {
        return None;
    }
    Some(DmiProcessor {
        socket,
        version: field_value(record, "Version"),
        max_speed: field_value(record, "Max Speed"),
        current_speed: field_value(record, "Current Speed"),
        core_count: field_value(record, "Core Count"),
        thread_count: field_value(record, "Thread Count"),
        l2_cache: field_value(record, "L2 Cache Handle"),
        l3_cache: field_value(record, "L3 Cache Handle"),
    })
}

fn field_value(record: &DmiRecord, key: &str) -> Option<String> {
    record
        .fields
        .iter()
        .find(|field| field.key.eq_ignore_ascii_case(key))
        .map(|field| field.value.trim().to_string())
        .filter(|value| !value.is_empty() && !is_placeholder(value))
}

fn is_placeholder(value: &str) -> bool {
    matches!(
        value.trim().to_ascii_lowercase().as_str(),
        ""
            | "unknown"
            | "not specified"
            | "not provided"
            | "not available"
            | "none"
            | "default string"
            | "00000000"
            | "to be filled by o.e.m."
    )
}

fn parse_smart(device: &str, body: &str) -> Option<SmartInfo> {
    let value: Value = serde_json::from_str(body).ok()?;
    let serial = string(&value, &["serial_number"]);
    let health_passed = value
        .pointer("/smart_status/passed")
        .and_then(Value::as_bool);
    let health_text = health_passed.map(|passed| {
        if passed {
            "PASSED".to_string()
        } else {
            "FAILED".to_string()
        }
    });
    let temperature = value
        .pointer("/temperature/current")
        .and_then(Value::as_f64);
    let power_on_hours = value
        .pointer("/power_on_time/hours")
        .and_then(Value::as_u64);
    let power_cycles = value
        .pointer("/power_cycle_count")
        .and_then(Value::as_u64);

    let nvme = value.get("nvme_smart_health_information_log");
    let percentage_used = nvme
        .and_then(|log| log.get("percentage_used"))
        .and_then(Value::as_f64);
    let data_units_written = nvme
        .and_then(|log| log.get("data_units_written"))
        .and_then(Value::as_u64)
        .map(|units| units.saturating_mul(512_000));
    let media_errors = nvme
        .and_then(|log| log.get("media_errors"))
        .and_then(Value::as_u64);

    let mut reallocated_sectors = None;
    let mut pending_sectors = None;
    let mut uncorrectable_sectors = None;
    let mut ata_written = None;
    if let Some(attributes) = value
        .pointer("/ata_smart_attributes/table")
        .and_then(Value::as_array)
    {
        for attribute in attributes {
            let id = attribute.get("id").and_then(Value::as_u64);
            let raw = attribute.pointer("/raw/value").and_then(Value::as_u64);
            match id {
                Some(5) => reallocated_sectors = raw,
                Some(197) => pending_sectors = raw,
                Some(198) => uncorrectable_sectors = raw,
                Some(241) => ata_written = raw.map(|value| value.saturating_mul(512)),
                _ => {}
            }
        }
    }

    Some(SmartInfo {
        device: device.to_string(),
        serial,
        health_passed,
        health_text,
        temperature_c: temperature,
        power_on_hours,
        power_cycles,
        percentage_used,
        data_written_bytes: data_units_written.or(ata_written),
        media_errors,
        reallocated_sectors,
        pending_sectors,
        uncorrectable_sectors,
    })
}

fn string(value: &Value, keys: &[&str]) -> Option<String> {
    keys.iter().find_map(|key| {
        value
            .get(*key)
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const HELPER_OUTPUT: &str = r#"===DMI===
# dmidecode 3.6
Getting SMBIOS data from sysfs.
SMBIOS 3.6.0 present.

Handle 0x0001, DMI type 1, 27 bytes
System Information
	Manufacturer: ASUSTeK COMPUTER INC.
	Product Name: ASUS TUF Gaming F15
	Version: 1.0
	Serial Number: TESTSERIAL
	UUID: 11111111-2222-3333-4444-555555555555

Handle 0x0011, DMI type 17, 40 bytes
Memory Device
	Total Width: 64 bits
	Size: 8 GB
	Form Factor: SODIMM
	Locator: SODIMM 0
	Type: DDR4
	Speed: 3200 MT/s
	Manufacturer: Samsung
	Serial Number: 00000000
	Part Number: M471A1K43EB1-CWE

Handle 0x0012, DMI type 17, 40 bytes
Memory Device
	Size: No Module Installed
	Locator: SODIMM 1

===SMART:/dev/nvme0n1===
{
  "model_name": "WD PC SN740 SDDPNQD-512G",
  "serial_number": "TESTSN",
  "firmware_version": "73113000",
  "smart_status": { "passed": true },
  "temperature": { "current": 38 },
  "power_on_time": { "hours": 1200 },
  "power_cycle_count": 312,
  "nvme_smart_health_information_log": {
    "percentage_used": 2,
    "data_units_written": 1000,
    "media_errors": 0
  }
}
===SMART:/dev/sda===
{
  "model_name": "Samsung SSD 870 EVO 1TB",
  "serial_number": "ATASN",
  "smart_status": { "passed": false },
  "ata_smart_attributes": {
    "table": [
      { "id": 5, "raw": { "value": 3 } },
      { "id": 197, "raw": { "value": 1 } },
      { "id": 198, "raw": { "value": 0 } },
      { "id": 241, "raw": { "value": 100 } }
    ]
  }
}
===END===
"#;

    #[test]
    fn parses_every_helper_section() {
        let info = parse_helper_output(HELPER_OUTPUT);
        let dmi = info.dmi.as_ref().expect("dmi section");

        assert_eq!(dmi.system.fields.len(), 5);
        assert!(
            dmi.system
                .fields
                .iter()
                .any(|field| field.key == "Product Name" && field.value == "ASUS TUF Gaming F15")
        );

        assert_eq!(dmi.memory_devices.len(), 2);
        assert!(dmi.memory_devices[0].populated);
        assert_eq!(dmi.memory_devices[0].size.as_deref(), Some("8 GB"));
        assert_eq!(dmi.memory_devices[0].serial, None);
        assert!(!dmi.memory_devices[1].populated);

        assert_eq!(info.smart.len(), 2);
        let nvme = &info.smart[0];
        assert_eq!(nvme.device, "/dev/nvme0n1");
        assert_eq!(nvme.health_passed, Some(true));
        assert_eq!(nvme.temperature_c, Some(38.0));
        assert_eq!(nvme.data_written_bytes, Some(512_000_000));
        assert_eq!(nvme.percentage_used, Some(2.0));

        let ata = &info.smart[1];
        assert_eq!(ata.device, "/dev/sda");
        assert_eq!(ata.health_passed, Some(false));
        assert_eq!(ata.reallocated_sectors, Some(3));
        assert_eq!(ata.pending_sectors, Some(1));
        assert_eq!(ata.data_written_bytes, Some(51_200));
        assert_eq!(info.warnings.len(), 1);
    }

    #[test]
    fn ignores_empty_and_invalid_sections() {
        let info = parse_helper_output("===DMI===\n===SMART:/dev/nvme0n1===\n===END===\n");
        assert!(info.smart.is_empty());
        assert!(info.warnings.is_empty());
        assert!(info.dmi.is_some());
    }
}

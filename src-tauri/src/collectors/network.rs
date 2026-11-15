use std::collections::HashMap;
use std::path::Path;

use serde_json::Value;

use crate::models::{NetAddress, NetInterface};
use crate::util::{read_clean, read_link_path, read_trim, run_command, sorted_dir_names};

pub fn collect() -> Vec<NetInterface> {
    let addresses = read_addresses();
    let pci_names = read_pci_names();
    let mut interfaces = Vec::new();

    for name in sorted_dir_names("/sys/class/net") {
        let base = format!("/sys/class/net/{name}");
        let device_path = format!("{base}/device");
        let device_link = read_link_path(&device_path);
        let pci_address = device_link.as_deref().and_then(|target| {
            target
                .split('/')
                .rev()
                .find(|part| part.len() >= 7 && part.matches(':').count() >= 2)
                .map(str::to_string)
        });
        let uevent = read_uevent(&format!("{base}/uevent"));
        let driver = read_link_path(format!("{base}/device/driver"))
            .and_then(|target| {
                Path::new(&target)
                    .file_name()
                    .map(|name| name.to_string_lossy().into_owned())
            })
            .or_else(|| uevent.get("DRIVER").cloned());
        let is_wireless = Path::new(&format!("{base}/wireless")).exists()
            || Path::new(&format!("{base}/phy80211")).exists();
        let is_virtual = device_link.is_none() || is_virtual_name(&name);
        let speed_mbps = read_trim(format!("{base}/speed"))
            .and_then(|value| value.parse::<i64>().ok())
            .filter(|value| *value > 0)
            .map(|value| value as u64);
        let pci_description = pci_address
            .as_ref()
            .and_then(|address| pci_names.get(address))
            .cloned();

        interfaces.push(NetInterface {
            name: name.clone(),
            mac: read_clean(format!("{base}/address")),
            state: read_clean(format!("{base}/operstate")),
            speed_mbps,
            duplex: read_clean(format!("{base}/duplex")),
            mtu: read_trim(format!("{base}/mtu")).and_then(|value| value.parse().ok()),
            driver,
            device: pci_description,
            pci_address,
            is_wireless,
            is_virtual,
            addresses: addresses.get(&name).cloned().unwrap_or_default(),
        });
    }
    interfaces
}

fn read_addresses() -> HashMap<String, Vec<NetAddress>> {
    let Some(output) = run_command("ip", &["-j", "addr", "show"]) else {
        return HashMap::new();
    };
    let Ok(value) = serde_json::from_str::<Value>(&output) else {
        return HashMap::new();
    };
    let mut result = HashMap::new();
    let Some(interfaces) = value.as_array() else {
        return result;
    };
    for interface in interfaces {
        let Some(name) = interface.get("ifname").and_then(Value::as_str) else {
            continue;
        };
        let mut addresses = Vec::new();
        if let Some(items) = interface.get("addr_info").and_then(Value::as_array) {
            for item in items {
                let Some(local) = item.get("local").and_then(Value::as_str) else {
                    continue;
                };
                addresses.push(NetAddress {
                    family: item
                        .get("family")
                        .and_then(Value::as_str)
                        .unwrap_or("unknown")
                        .to_string(),
                    address: local.to_string(),
                    prefix_len: item
                        .get("prefixlen")
                        .and_then(Value::as_u64)
                        .unwrap_or(0) as u8,
                    scope: item.get("scope").and_then(Value::as_str).map(str::to_string),
                });
            }
        }
        result.insert(name.to_string(), addresses);
    }
    result
}

fn read_pci_names() -> HashMap<String, String> {
    let Some(output) = run_command("lspci", &["-Dnn"]) else {
        return HashMap::new();
    };
    let mut result = HashMap::new();
    for line in output.lines() {
        let Some((address, rest)) = line.split_once(' ') else {
            continue;
        };
        let Some((_, description)) = rest.split_once(": ") else {
            continue;
        };
        result.insert(address.to_string(), clean_pci_description(description));
    }
    result
}

fn clean_pci_description(description: &str) -> String {
    let trimmed = description.trim();
    if let Some(start) = trimmed.rfind(" [") {
        if trimmed[start..].ends_with(']') {
            return trimmed[..start].trim().to_string();
        }
    }
    trimmed.to_string()
}

fn read_uevent(path: &str) -> HashMap<String, String> {
    let Some(text) = read_trim(path) else {
        return HashMap::new();
    };
    text.lines()
        .filter_map(|line| {
            let (key, value) = line.split_once('=')?;
            Some((key.to_string(), value.to_string()))
        })
        .collect()
}

fn is_virtual_name(name: &str) -> bool {
    const PREFIXES: &[&str] = &[
        "lo", "docker", "veth", "br-", "virbr", "tun", "tap", "wg", "tailscale", "zt", "podman",
        "cni", "flannel", "cali", "kube", "dummy",
    ];
    PREFIXES.iter().any(|prefix| name.starts_with(prefix))
}

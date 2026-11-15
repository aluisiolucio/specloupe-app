use serde_json::Value;

use crate::models::{PartitionInfo, StorageDisk};
use crate::util::{filesystem_usage, read_trim, run_command, sorted_dir_names};

pub fn collect() -> Vec<StorageDisk> {
    let Some(output) = run_command("lsblk", &["-J", "-b", "-O"]) else {
        return Vec::new();
    };
    let Ok(root) = serde_json::from_str::<Value>(&output) else {
        return Vec::new();
    };
    let Some(devices) = root.get("blockdevices").and_then(Value::as_array) else {
        return Vec::new();
    };

    let mut disks = Vec::new();
    for device in devices {
        if json_str(device, "type").as_deref() != Some("disk") {
            continue;
        }
        let Some(name) = json_str(device, "name") else {
            continue;
        };
        if name.starts_with("zram") || name.starts_with("loop") || name.starts_with("ram") {
            continue;
        }
        let size_bytes = json_u64(device, "size").unwrap_or(0);
        if size_bytes == 0 {
            continue;
        }
        let path = json_str(device, "path").unwrap_or_else(|| format!("/dev/{name}"));
        let mut partitions = Vec::new();
        collect_children(device, &mut partitions);

        disks.push(StorageDisk {
            name: name.clone(),
            path,
            model: json_str(device, "model"),
            serial: json_str(device, "serial"),
            firmware: json_str(device, "rev"),
            size_bytes,
            interface: json_str(device, "tran").map(interface_name),
            rotational: json_bool(device, "rota").unwrap_or(false),
            removable: json_bool(device, "rm").unwrap_or(false),
            state: json_str(device, "state"),
            temperature_c: disk_temperature(&name),
            partitions,
        });
    }
    disks
}

fn collect_children(device: &Value, partitions: &mut Vec<PartitionInfo>) {
    let Some(children) = device.get("children").and_then(Value::as_array) else {
        return;
    };
    for child in children {
        if let Some(partition) = partition_from(child) {
            partitions.push(partition);
        }
        collect_children(child, partitions);
    }
}

fn partition_from(device: &Value) -> Option<PartitionInfo> {
    let name = json_str(device, "name")?;
    let mountpoint = json_str(device, "mountpoint").or_else(|| {
        device
            .get("mountpoints")
            .and_then(Value::as_array)
            .and_then(|values| values.iter().find_map(|value| value.as_str().map(str::to_string)))
    });
    let usage = mountpoint
        .as_deref()
        .filter(|value| value.starts_with('/'))
        .and_then(filesystem_usage);

    Some(PartitionInfo {
        name,
        size_bytes: json_u64(device, "size").unwrap_or(0),
        fstype: json_str(device, "fstype"),
        label: json_str(device, "label"),
        uuid: json_str(device, "uuid"),
        mountpoint,
        fs_total_bytes: usage.as_ref().map(|value| value.total_bytes),
        fs_used_bytes: usage.as_ref().map(|value| value.used_bytes),
        fs_available_bytes: usage.as_ref().map(|value| value.available_bytes),
        fs_use_percent: usage.as_ref().map(|value| value.use_percent),
    })
}

fn json_str(value: &Value, key: &str) -> Option<String> {
    value
        .get(key)
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn json_u64(value: &Value, key: &str) -> Option<u64> {
    value.get(key).and_then(|value| {
        value
            .as_u64()
            .or_else(|| value.as_str().and_then(|text| text.parse::<u64>().ok()))
    })
}

fn json_bool(value: &Value, key: &str) -> Option<bool> {
    value.get(key).and_then(Value::as_bool)
}

fn interface_name(tran: String) -> String {
    match tran.to_ascii_lowercase().as_str() {
        "nvme" => "NVMe".to_string(),
        "sata" => "SATA".to_string(),
        "ata" => "ATA".to_string(),
        "usb" => "USB".to_string(),
        "sas" => "SAS".to_string(),
        "mmc" => "MMC".to_string(),
        other => other.to_uppercase(),
    }
}

fn disk_temperature(block_name: &str) -> Option<f64> {
    if let Some(controller) = nvme_controller_for(block_name) {
        for hwmon in sorted_dir_names("/sys/class/hwmon") {
            let base = format!("/sys/class/hwmon/{hwmon}");
            if read_trim(format!("{base}/name")).as_deref() != Some("nvme") {
                continue;
            }
            let device = crate::util::read_link_path(format!("{base}/device")).unwrap_or_default();
            if !device.contains(&controller) {
                continue;
            }
            if let Some(value) = read_trim(format!("{base}/temp1_input"))
                .and_then(|value| value.parse::<f64>().ok())
            {
                return Some(value / 1000.0);
            }
        }
    }
    None
}

fn nvme_controller_for(block_name: &str) -> Option<String> {
    for controller in sorted_dir_names("/sys/class/nvme") {
        if block_name.starts_with(&format!("{controller}n")) {
            return Some(controller);
        }
    }
    None
}

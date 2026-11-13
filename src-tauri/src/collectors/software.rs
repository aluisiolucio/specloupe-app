use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use crate::models::{KeyValue, SoftwareInfo};
use crate::util::{
    command_exists, first_line, read_clean, read_link_path, read_trim, run_command,
};

pub fn collect() -> SoftwareInfo {
    let os_release = read_os_release();
    let distro_name = os_release
        .get("PRETTY_NAME")
        .or_else(|| os_release.get("NAME"))
        .cloned();
    let distro_id = os_release.get("ID").cloned();
    let distro_version = os_release.get("VERSION_ID").cloned();
    let distro_id_like = os_release.get("ID_LIKE").cloned();

    let (package_manager, package_count) = package_inventory();
    let flatpak_count = if command_exists("flatpak") {
        run_command(
            "flatpak",
            &["list", "--app", "--columns=application"],
        )
        .map(|output| output.lines().filter(|line| !line.trim().is_empty()).count() as u64)
    } else {
        None
    };

    let virtualization = run_command("systemd-detect-virt", &[])
        .filter(|value| value != "none");

    let boot_mode = if Path::new("/sys/firmware/efi").exists() {
        Some("UEFI".to_string())
    } else {
        Some("Legacy BIOS".to_string())
    };

    let extra = ["VARIANT", "VARIANT_ID", "BUILD_ID", "HOME_URL", "DOCUMENTATION_URL"]
        .iter()
        .filter_map(|key| {
            os_release.get(*key).map(|value| KeyValue {
                key: key.to_string(),
                value: value.clone(),
            })
        })
        .collect();

    SoftwareInfo {
        distro_name,
        distro_id,
        distro_version,
        distro_id_like,
        kernel: read_trim("/proc/sys/kernel/osrelease"),
        kernel_build: read_trim("/proc/sys/kernel/version"),
        architecture: Some(std::env::consts::ARCH.to_string()),
        glibc: run_command("getconf", &["GNU_LIBC_VERSION"]),
        systemd: run_command("systemctl", &["--version"]).and_then(|output| first_line(&output)),
        desktop: env_value(&[
            "XDG_CURRENT_DESKTOP",
            "XDG_SESSION_DESKTOP",
            "DESKTOP_SESSION",
        ]),
        session_type: env_value(&["XDG_SESSION_TYPE"]),
        shell: std::env::var("SHELL").ok().and_then(|value| {
            Path::new(&value)
                .file_name()
                .map(|name| name.to_string_lossy().into_owned())
        }),
        locale: env_value(&["LC_ALL", "LC_MESSAGES", "LANG"]),
        timezone: timezone(),
        package_manager,
        package_count,
        flatpak_count,
        virtualization,
        secure_boot: secure_boot(),
        boot_mode,
        kernel_cmdline: read_trim("/proc/cmdline"),
        extra,
    }
}

fn read_os_release() -> BTreeMap<String, String> {
    let Ok(text) = fs::read_to_string("/etc/os-release") else {
        return BTreeMap::new();
    };
    let mut values = BTreeMap::new();
    for line in text.lines() {
        let Some((key, value)) = line.split_once('=') else {
            continue;
        };
        let value = value
            .trim()
            .trim_matches('"')
            .replace("\\\"", "\"")
            .replace("\\n", "\n");
        values.insert(key.trim().to_string(), value);
    }
    values
}

fn env_value(keys: &[&str]) -> Option<String> {
    keys.iter()
        .filter_map(|key| std::env::var(key).ok())
        .find(|value| !value.trim().is_empty())
        .map(|value| value.trim().to_string())
}

fn timezone() -> Option<String> {
    read_link_path("/etc/localtime")
        .and_then(|target| {
            target
                .split("/zoneinfo/")
                .nth(1)
                .map(str::to_string)
        })
        .or_else(|| read_clean("/etc/timezone"))
        .or_else(|| env_value(&["TZ"]))
}

fn package_inventory() -> (Option<String>, Option<u64>) {
    if command_exists("rpm") {
        let count = run_command("rpm", &["-qa"])
            .map(|output| output.lines().filter(|line| !line.trim().is_empty()).count() as u64);
        return (Some("RPM / dnf".to_string()), count);
    }
    if command_exists("dpkg-query") {
        let count = run_command(
            "dpkg-query",
            &["-W", "-f=${binary:Package}\n"],
        )
        .map(|output| output.lines().filter(|line| !line.trim().is_empty()).count() as u64);
        return (Some("DEB / apt".to_string()), count);
    }
    if command_exists("pacman") {
        let count = run_command("pacman", &["-Qq"])
            .map(|output| output.lines().filter(|line| !line.trim().is_empty()).count() as u64);
        return (Some("Pacman".to_string()), count);
    }
    (None, None)
}

fn secure_boot() -> Option<bool> {
    if !Path::new("/sys/firmware/efi").exists() {
        return Some(false);
    }
    let entries = fs::read_dir("/sys/firmware/efi/efivars").ok()?;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with("SecureBoot-") {
            let bytes = fs::read(entry.path()).ok()?;
            return bytes.get(4).map(|value| *value == 1);
        }
    }
    None
}

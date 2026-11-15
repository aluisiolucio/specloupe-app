use std::path::Path;

use crate::models::BoardInfo;
use crate::util::read_clean;

const DMI: &str = "/sys/class/dmi/id";

pub fn collect() -> BoardInfo {
    let chassis_type_raw = read_clean(format!("{DMI}/chassis_type"));
    let chassis_type = chassis_type_raw.and_then(|value| {
        value
            .parse::<u32>()
            .ok()
            .map(|code| chassis_name(code).to_string())
    });

    let serial_locked = ["board_serial", "product_serial", "chassis_serial"]
        .iter()
        .any(|name| {
            let path = format!("{DMI}/{name}");
            Path::new(&path).exists() && read_clean(&path).is_none()
        });

    BoardInfo {
        system_vendor: read_clean(format!("{DMI}/sys_vendor")),
        product_name: read_clean(format!("{DMI}/product_name")),
        product_version: read_clean(format!("{DMI}/product_version")),
        product_family: read_clean(format!("{DMI}/product_family")),
        product_sku: read_clean(format!("{DMI}/product_sku")),
        board_vendor: read_clean(format!("{DMI}/board_vendor")),
        board_name: read_clean(format!("{DMI}/board_name")),
        board_version: read_clean(format!("{DMI}/board_version")),
        board_serial: read_clean(format!("{DMI}/board_serial")),
        bios_vendor: read_clean(format!("{DMI}/bios_vendor")),
        bios_version: read_clean(format!("{DMI}/bios_version")),
        bios_date: read_clean(format!("{DMI}/bios_date")),
        chassis_vendor: read_clean(format!("{DMI}/chassis_vendor")),
        chassis_type,
        chassis_version: read_clean(format!("{DMI}/chassis_version")),
        serial_locked,
    }
}

fn chassis_name(code: u32) -> &'static str {
    match code {
        1 => "Other",
        2 => "Unknown",
        3 => "Desktop",
        4 => "Low Profile Desktop",
        5 => "Pizza Box",
        6 => "Mini Tower",
        7 => "Tower",
        8 => "Portable",
        9 => "Laptop",
        10 => "Notebook",
        11 => "Hand Held",
        12 => "Docking Station",
        13 => "All in One",
        14 => "Sub Notebook",
        15 => "Space-saving",
        16 => "Lunch Box",
        17 => "Main Server Chassis",
        18 => "Expansion Chassis",
        19 => "SubChassis",
        20 => "Bus Expansion Chassis",
        21 => "Peripheral Chassis",
        22 => "RAID Chassis",
        23 => "Rack Mount Chassis",
        24 => "Sealed-case PC",
        25 => "Multi-system",
        30 => "Tablet",
        31 => "Convertible",
        32 => "Detachable",
        33 => "IoT Gateway",
        34 => "Embedded PC",
        35 => "Mini PC",
        36 => "Stick PC",
        _ => "Unknown",
    }
}

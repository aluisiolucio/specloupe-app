use std::sync::atomic::Ordering;
use std::thread;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};

use crate::collectors::sensors;
use crate::commands::AppState;

pub fn spawn(app: AppHandle) {
    thread::spawn(move || {
        let mut sampler = sensors::new_sampler();
        // Prime the delta-based readings so the first emitted tick has real values.
        let _ = sampler.sample();

        loop {
            thread::sleep(Duration::from_millis(1000));

            let paused = app
                .state::<AppState>()
                .paused
                .load(Ordering::Relaxed);
            if paused {
                continue;
            }

            let snapshot = sampler.sample();
            if let Err(error) = app.emit("live:tick", &snapshot) {
                eprintln!("failed to emit live snapshot: {error}");
            }
        }
    });
}

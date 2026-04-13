// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod data_type;
mod file_manager;
mod rar;
mod tar;
mod utils;
mod zip;

use std::fs;
use std::io::{BufReader, Read};
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
// use zip::ZipArchive;
use data_type::{AppTempDir, ExtractionConfig, FileInfo, SingleChecksum};
use file_manager::{open_file, read_directory};
use rar::get_image_preview_from_rar;
use rar::get_rar_details;
use rar::unarchive_rar_file;
use rar::view_file_in_rar;
use std::thread;
use tar::get_image_preview_from_tar;
use tar::view_file_in_tar;
use tauri::{AppHandle, Emitter, Listener, Manager, RunEvent, WebviewWindowBuilder};
use tempfile::TempDir;
use utils::{detect_archive_type, is_rar_based, is_tar_based, is_zip_based};
use zip::get_image_preview_from_zip;
use zip::view_file_in_zip;

#[tauri::command]
fn archive_file_details(
    source_path: String,
    file_path: Option<String>,
    state: tauri::State<'_, Arc<AppTempDir>>,
) -> Result<Vec<FileInfo>, String> {
    let source = PathBuf::from(source_path.clone());

    // Use the archive type detector to identify the archive format
    let archive_type =
        detect_archive_type(&source_path).ok_or_else(|| "Unsupported archive type".to_string())?;

    if is_zip_based(archive_type) {
        zip::get_zip_details(source, file_path, state).map_err(|e| e.to_string())
    } else if is_tar_based(archive_type) {
        tar::get_tar_details(source, file_path, state).map_err(|e| e.to_string())
    } else if is_rar_based(archive_type) {
        get_rar_details(source, file_path, state).map_err(|e| e.to_string())
    } else {
        Err("Unsupported archive type".to_string())
    }
}

#[tauri::command]
async fn extract_files(
    app_handle: AppHandle,
    archive_path: String,
    output_path: String,
    selected_files: Option<Vec<String>>,
) -> Result<(), String> {
    // Generate a unique label using the current timestamp
    let label = format!(
        "extract-{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );
    let webview_url = tauri::WebviewUrl::App(
        format!(
            "index.html?label=progress&name={}&fileName={}",
            label, archive_path
        )
        .into(),
    );

    // // Create the progress window dynamically
    let _progress_window = WebviewWindowBuilder::new(
        &app_handle,
        &label,
        webview_url.clone(), // The window label
    )
    .title("Extraction Progress")
    .resizable(false)
    .inner_size(420.0, 240.0)
    .build()
    .map_err(|e| e.to_string())?;

    // Prepare extraction configuration
    let config = ExtractionConfig {
        source: archive_path.clone(),
        destination: output_path,
        selected_files,
        cancel: Arc::new(AtomicBool::new(false)),
    };

    // Clone handles for thread communication
    let app_handle_clone = app_handle.clone();
    let config_clone = config.clone();
    let window_label = label.clone();
    thread::spawn(move || {
        app_handle_clone.listen(format!("{}://ready", label), {
            let app_handle_clone = app_handle_clone.clone();
            move |_| {
                println!("Window is ready: {}", window_label);
                let app_handle_clone = app_handle_clone.clone();
                let config_clone = config_clone.clone();

                // Use the archive type detector to identify the archive format
                let archive_type = match detect_archive_type(&config_clone.source) {
                    Some(archive_type) => archive_type,
                    None => {
                        let _ = app_handle
                            .emit("extract-error", "Unsupported archive type".to_string());
                        return;
                    }
                };

                if is_zip_based(archive_type) {
                    match zip::unarchive_zip_file(app_handle_clone, config_clone) {
                        Ok(_) => {
                            // Emit completion event
                            let _ = app_handle.emit("extract-complete", ());
                        }
                        Err(e) => {
                            // Emit error event
                            let _ = app_handle.emit("extract-error", e);
                        }
                    }
                } else if is_tar_based(archive_type) {
                    match tar::unarchive_tar_file(app_handle_clone, config_clone) {
                        Ok(_) => {
                            // Emit completion event
                            let _ = app_handle.emit("extract-complete", ());
                        }
                        Err(e) => {
                            // Emit error event
                            let _ = app_handle.emit("extract-error", e);
                        }
                    }
                } else if is_rar_based(archive_type) {
                    match unarchive_rar_file(app_handle_clone, config_clone) {
                        Ok(_) => {
                            // Emit completion event
                            let _ = app_handle.emit("extract-complete", ());
                        }
                        Err(e) => {
                            // Emit error event
                            let _ = app_handle.emit("extract-error", e);
                        }
                    }
                } else {
                    // Emit error event for unsupported archive type
                    let _ =
                        app_handle.emit("extract-error", "Unsupported archive type".to_string());
                }
            }
        });
    })
    .join()
    .unwrap();

    Ok(())
}

#[tauri::command]
fn view_file_in_archive(
    archive_path: String,
    file_name: String,
    state: tauri::State<'_, Arc<AppTempDir>>,
) -> Result<(), String> {
    // Use the archive type detector to identify the archive format
    let archive_type = match detect_archive_type(&archive_path) {
        Some(archive_type) => archive_type,
        None => return Err("Unsupported archive type".to_string()),
    };

    if is_zip_based(archive_type) {
        view_file_in_zip(archive_path, file_name, state)?;
    } else if is_tar_based(archive_type) {
        view_file_in_tar(archive_path, file_name, state)?;
    } else if is_rar_based(archive_type) {
        view_file_in_rar(archive_path, file_name, state)?;
    }
    Ok(())
}

#[tauri::command]
fn get_image_preview(archive_path: String, file_path: String) -> Result<String, String> {
    // Use the archive type detector to identify the archive format
    let archive_type = match detect_archive_type(&archive_path) {
        Some(archive_type) => archive_type,
        None => {
            return Err("Unsupported archive type. Supported formats: .zip, .jar, .apk, .xapk, .ipa, .tar, .tar.gz, .tgz, .tar.bz2, .tbz2".to_string())
        }
    };

    if is_zip_based(archive_type) {
        get_image_preview_from_zip(archive_path, file_path)
    } else if is_tar_based(archive_type) {
        get_image_preview_from_tar(archive_path, file_path)
    } else if is_rar_based(archive_type) {
        get_image_preview_from_rar(archive_path, file_path)
    } else {
        Err("Unsupported archive type. Supported formats: .zip, .jar, .apk, .xapk, .ipa, .tar, .tar.gz, .tgz, .tar.bz2, .tbz2, .rar".to_string())
    }
}

#[tauri::command]
async fn compute_checksum(
    app_handle: AppHandle,
    file_path: String,
    algorithm: String,
) -> Result<SingleChecksum, String> {
    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(format!("File not found: {}", file_path));
    }
    if !path.is_file() {
        return Err(format!("Path is not a file: {}", file_path));
    }

    let file_size = fs::metadata(&path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?
        .len();

    let algo = algorithm.to_lowercase();
    let event_name = format!("checksum-progress-{}", algo);

    tauri::async_runtime::spawn_blocking(move || {
        let file = fs::File::open(&path).map_err(|e| format!("Failed to open file: {}", e))?;
        let mut reader = BufReader::with_capacity(131072, file);
        let mut buffer = [0u8; 131072];

        let mut bytes_processed: u64 = 0;
        let mut last_reported_percent: u8 = 0;

        let hash = match algo.as_str() {
            "md5" => {
                let mut hasher = md5::Context::new();
                loop {
                    let n = reader
                        .read(&mut buffer)
                        .map_err(|e| format!("Failed to read file: {}", e))?;
                    if n == 0 {
                        break;
                    }
                    hasher.consume(&buffer[..n]);
                    bytes_processed += n as u64;
                    if file_size > 0 {
                        let pct = ((bytes_processed as f64 / file_size as f64) * 100.0) as u8;
                        if pct >= last_reported_percent + 5 {
                            last_reported_percent = pct;
                            let _ = app_handle.emit(&event_name, pct);
                        }
                    }
                }
                format!("{:x}", hasher.compute())
            }
            "sha1" => {
                use sha1::{Digest, Sha1};
                let mut hasher = Sha1::new();
                loop {
                    let n = reader
                        .read(&mut buffer)
                        .map_err(|e| format!("Failed to read file: {}", e))?;
                    if n == 0 {
                        break;
                    }
                    hasher.update(&buffer[..n]);
                    bytes_processed += n as u64;
                    if file_size > 0 {
                        let pct = ((bytes_processed as f64 / file_size as f64) * 100.0) as u8;
                        if pct >= last_reported_percent + 5 {
                            last_reported_percent = pct;
                            let _ = app_handle.emit(&event_name, pct);
                        }
                    }
                }
                format!("{:x}", hasher.finalize())
            }
            "sha256" => {
                use sha2::{Digest, Sha256};
                let mut hasher = Sha256::new();
                loop {
                    let n = reader
                        .read(&mut buffer)
                        .map_err(|e| format!("Failed to read file: {}", e))?;
                    if n == 0 {
                        break;
                    }
                    hasher.update(&buffer[..n]);
                    bytes_processed += n as u64;
                    if file_size > 0 {
                        let pct = ((bytes_processed as f64 / file_size as f64) * 100.0) as u8;
                        if pct >= last_reported_percent + 5 {
                            last_reported_percent = pct;
                            let _ = app_handle.emit(&event_name, pct);
                        }
                    }
                }
                format!("{:x}", hasher.finalize())
            }
            "sha512" => {
                use sha2::{Digest, Sha512};
                let mut hasher = Sha512::new();
                loop {
                    let n = reader
                        .read(&mut buffer)
                        .map_err(|e| format!("Failed to read file: {}", e))?;
                    if n == 0 {
                        break;
                    }
                    hasher.update(&buffer[..n]);
                    bytes_processed += n as u64;
                    if file_size > 0 {
                        let pct = ((bytes_processed as f64 / file_size as f64) * 100.0) as u8;
                        if pct >= last_reported_percent + 5 {
                            last_reported_percent = pct;
                            let _ = app_handle.emit(&event_name, pct);
                        }
                    }
                }
                format!("{:x}", hasher.finalize())
            }
            _ => {
                return Err(format!(
                    "Unsupported algorithm: {}. Use md5, sha1, sha256, or sha512",
                    algo
                ))
            }
        };

        let _ = app_handle.emit(&event_name, 100u8);

        Ok(SingleChecksum {
            algorithm: algo,
            hash,
        })
    })
    .await
    .map_err(|e| format!("Checksum task failed: {}", e))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            // Access command-line arguments
            // Create a temporary directory
            let temp_dir = TempDir::new().map_err(|e| {
                eprintln!("Failed to create temp dir: {}", e);
                e
            })?;

            // Log the temp directory path for debugging
            println!(
                "Temporary directory created at: {}",
                temp_dir.path().display()
            );

            // Store the TempDir in the app state
            app.manage(Arc::new(AppTempDir { temp_dir }));

            Ok(())
        })
        .on_window_event(|window, event| match event {
            // Cleanup when the last window is closed
            tauri::WindowEvent::CloseRequested { .. } => {
                let state = window.state::<Arc<AppTempDir>>();
                let app_handle = window.app_handle();
                let windows = app_handle.windows();
                if windows.len() == 1 {
                    println!(
                        "Cleaning up temporary directory: {}",
                        state.temp_dir.path().display()
                    );
                    let temp_dir = &state.temp_dir.path().to_path_buf();
                    // Delete the directory manually
                    if let Err(e) = fs::remove_dir_all(&temp_dir) {
                        eprintln!("Failed to delete temp directory: {}", e);
                    }
                }
            }
            _ => {}
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_single_instance::init(
            |app_handle, args, _cwd| {
                // When a second instance is launched (e.g. double-clicking an archive
                // in the OS file manager on Windows/Linux), forward each argument
                // beyond the executable name as a "file-open" event so the already-
                // running instance can navigate to it.
                for arg in args.iter().skip(1) {
                    let _ = app_handle.emit("file-open", arg.clone());
                }
            },
        ))
        .invoke_handler(tauri::generate_handler![
            read_directory,
            open_file,
            archive_file_details,
            extract_files,
            view_file_in_archive,
            get_image_preview,
            compute_checksum
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // macOS: when the app is already running and the user double-clicks
            // an associated file in Finder, the OS sends an Apple Event rather
            // than spawning a second process, so tauri-plugin-single-instance
            // never fires. Handle it via RunEvent::Opened instead.
            #[cfg(target_os = "macos")]
            if let RunEvent::Opened { urls } = event {
                for url in urls {
                    if let Ok(path) = url.to_file_path() {
                        let path_str = path.to_string_lossy().to_string();
                        let _ = app_handle.emit("file-open", path_str);
                    }
                }
            }
        });
}

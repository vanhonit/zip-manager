// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod data_type;
mod file_manager;
mod rar;
mod sevenz;
mod tar;
mod utils;
mod zip;
use std::sync::Mutex;

use std::fs;
use std::io::{BufReader, Read};
use std::path::PathBuf;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
// use zip::ZipArchive;
use data_type::{
    AppTempDir, ArchiveFormat, CompressionConfig, ExtractionConfig, FileInfo, SingleChecksum,
};
use file_manager::{open_file, read_directory};
use rar::get_image_preview_from_rar;
use rar::get_rar_details;
use rar::unarchive_rar_file;
use rar::view_file_in_rar;
use sevenz::create_sevenz_archive;
use std::thread;
use tar::create_tar_archive;
use tar::get_image_preview_from_tar;
use tar::view_file_in_tar;
use tauri::{AppHandle, Emitter, Listener, Manager, RunEvent, WebviewWindowBuilder};
use tauri_plugin_log::{RotationStrategy, Target, TargetKind};
use tempfile::TempDir;
use utils::{detect_archive_type, is_rar_based, is_tar_based, is_zip_based};
use zip::create_zip_archive;
use zip::get_image_preview_from_zip;
use zip::view_file_in_zip;

#[tauri::command]
fn path_exists(path: String) -> bool {
    PathBuf::from(path).exists()
}

#[tauri::command]
async fn create_archive(
    app_handle: AppHandle,
    files: Vec<String>,
    output_path: String,
    archive_format: String,
    compression_level: u8,
) -> Result<(), String> {
    // Convert string format to ArchiveFormat enum
    let format = match archive_format.as_str() {
        "zip" => ArchiveFormat::Zip,
        "tar" => ArchiveFormat::Tar,
        "7z" => ArchiveFormat::Sevenz,
        _ => return Err(format!("Unsupported archive format: {}", archive_format)),
    };

    // Create compression configuration
    let config = CompressionConfig {
        files,
        output_path,
        archive_format: format,
        compression_level,
        cancel: Arc::new(AtomicBool::new(false)),
    };

    // Route to appropriate archive creation function
    match format {
        ArchiveFormat::Zip => {
            tauri::async_runtime::spawn_blocking(move || create_zip_archive(app_handle, config))
                .await
                .map_err(|e| format!("Archive creation failed: {}", e))?
        }
        ArchiveFormat::Tar => {
            tauri::async_runtime::spawn_blocking(move || create_tar_archive(app_handle, config))
                .await
                .map_err(|e| format!("Archive creation failed: {}", e))?
        }
        ArchiveFormat::Sevenz => {
            tauri::async_runtime::spawn_blocking(move || create_sevenz_archive(app_handle, config))
                .await
                .map_err(|e| format!("Archive creation failed: {}", e))?
        }
    }
}

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
    password: Option<String>,
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
    .inner_size(420.0, 250.0)
    .build()
    .map_err(|e| e.to_string())?;

    // Prepare extraction configuration
    let config = ExtractionConfig {
        source: archive_path.clone(),
        destination: output_path,
        selected_files,
        cancel: Arc::new(AtomicBool::new(false)),
        password,
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

// =========================
// App State
// =========================
struct PendingFiles {
    files: Mutex<Vec<String>>,
    is_ready: Mutex<bool>,
}
// =========================
// Helper
// =========================
fn push_file(app: &tauri::AppHandle, path: String) {
    let state = app.state::<PendingFiles>();
    let is_ready = *state.is_ready.lock().unwrap();
    if is_ready {
        println!("⚡ Emit immediately: {}", path);
        let _ = app.emit("file-open", path);
    } else {
        println!("📦 Buffering: {}", path);
        state.files.lock().unwrap().push(path);
    }
}

// =========================
// Command: frontend pulls files
// =========================

#[tauri::command]
fn take_files(state: tauri::State<PendingFiles>) -> Vec<String> {
    let mut files = state.files.lock().unwrap();
    files.drain(..).collect()
}

pub fn run() {
    tauri::Builder::default()
        .manage(PendingFiles {
            files: Mutex::new(vec![]),
            is_ready: Mutex::new(false),
        })
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_single_instance::init(
            |app_handle, args, _cwd| {
                println!("🔄 Single instance triggered with {} arguments", args.len());
                log::info!("Single instance triggered with {} arguments", args.len());
                // When a second instance is launched (e.g. double-clicking an archive
                // in the OS file manager on Windows/Linux), forward each argument
                // beyond the executable name as a "file-open" event so the already-
                // running instance can navigate to it.
                for (index, arg) in args.iter().enumerate().skip(1) {
                    println!("📂 Processing argument {}: {}", index, arg);
                    for arg in args.iter().skip(1) {
                        push_file(&app_handle, arg.clone());
                    }
                    // match app_handle.emit("file-open", arg.clone()) {
                    //     Ok(_) => println!("✅ Successfully emitted file-open event for: {}", arg),
                    //     Err(e) => println!("❌ Failed to emit file-open event: {}", e),
                    // }
                }
            },
        ))
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout), // Console output for dev
                    Target::new(TargetKind::LogDir { file_name: None }), // Writes to app.log in the log directory
                ])
                .level(log::LevelFilter::Debug) // Capture Debug, Info, Warn, and Error
                .rotation_strategy(RotationStrategy::KeepAll) // Keeps old logs instead of overwriting
                .build(),
        )
        .setup(|app| {
            // Access command-line arguments
            // Create a temporary directory
            log::info!("Creating temporary directory");
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
            // // Register state
            // app.manage(PendingFiles {
            //     files: Mutex::new(vec![]),
            // });
            let handle = app.handle().clone();
            // =========================
            // Frontend ready handshake
            // =========================
            app.handle().listen("frontend-ready", move |_| {
                println!("🔥 Frontend ready");
                let state = handle.state::<PendingFiles>();
                *state.is_ready.lock().unwrap() = true;
                let mut files = state.files.lock().unwrap();
                // for file in files.drain(..) {
                //     println!("🚀 Sending to frontend: {}", file);
                //     log::info!("send: {}", file);
                //     handle.emit("file-open", file).unwrap();
                // }
            });
            // =========================
            // CLI arguments (first launch)
            // =========================
            let args: Vec<String> = std::env::args().collect();
            println!("📂 CLI args: {:?}", args);
            if args.len() > 1 {
                for arg in args.iter().skip(1) {
                    push_file(&app.handle(), arg.clone());
                }
            }
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
        .invoke_handler(tauri::generate_handler![
            read_directory,
            open_file,
            archive_file_details,
            extract_files,
            view_file_in_archive,
            get_image_preview,
            compute_checksum,
            path_exists,
            create_archive,
            take_files
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
                println!("📂 macOS Opened event received with {} URLs", urls.len());
                log::info!("macOS Opened event received with {} URLs", urls.len());
                for (index, url) in urls.iter().enumerate() {
                    println!("📂 Processing URL {}: {:?}", index, url);
                    if let Ok(path) = url.to_file_path() {
                        let path_str = path.to_string_lossy().to_string();
                        println!("📂 Emitting file-open event: {}", path_str);
                        push_file(&app_handle, path_str);
                        // let result = app_handle.emit("file-open", path_str);
                        // match result {
                        //     Ok(_) => println!("✅ Successfully emitted file-open event"),
                        //     Err(e) => println!("❌ Failed to emit file-open event: {}", e),
                        // }
                    } else {
                        println!("❌ Failed to convert URL to path: {:?}", url);
                    }
                }
            }
        });
}

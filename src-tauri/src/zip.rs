use open::that_detached;
use std::fs::File;
use std::io::{self, BufReader};
use std::path::{Path, PathBuf, MAIN_SEPARATOR};
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::Emitter;
use tauri::State;
use zip::{DateTime, ZipArchive};

use crate::data_type::{AppTempDir, ExtractionConfig, ExtractionProgress, FileInfo};
use crate::utils::{get_file_extension, remove_last_item_from_path_string};
use rand::Rng;

pub fn get_zip_details(
    source_path: PathBuf,
    file_path: Option<String>,
    state: State<'_, Arc<AppTempDir>>,
) -> Result<Vec<FileInfo>, String> {
    let file = File::open(source_path.clone()).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(BufReader::new(file)).map_err(|e| e.to_string())?;
    let mut file_details: Vec<FileInfo> = Vec::new();
    let file_path = file_path.unwrap();

    if !file_path.is_empty() && !file_path.ends_with(MAIN_SEPARATOR) {
        let res = view_file_in_zip(
            source_path.clone().to_string_lossy().to_string(),
            file_path.clone(),
            state.clone(),
        );
        println!("{:?}", res);
        file_details.push(FileInfo {
            name: file_path.clone(),
            is_dir: false,
            last_modified: "N/A".to_string(),
            size: 0,
            mimetype: "".to_string(),
            path: file_path.clone(),
        });
        return Ok(file_details);
    }

    for i in 0..archive.len() {
        let file = archive.by_index(i).map_err(|e| e.to_string())?;
        let file_name = file.name();
        if file_name.starts_with(&file_path) {
            let relative_path = file_name
                .strip_prefix(&file_path)
                .unwrap_or(file_name)
                .trim_end_matches(MAIN_SEPARATOR);
            let count_child = relative_path.split(MAIN_SEPARATOR).collect::<Vec<&str>>();
            if count_child.len() == 1 {
                let size = file.size();
                let is_dir = file.is_dir();
                let path = file.enclosed_name().unwrap().to_string_lossy().to_string();
                let last_modified = file
                    .last_modified()
                    .map(|dt: DateTime| {
                        let dt = chrono::NaiveDateTime::try_from(dt).unwrap();
                        dt.format("%Y-%m-%d %H:%M:%S").to_string()
                    })
                    .unwrap_or("N/A".to_string());
                if relative_path.is_empty() {
                    file_details.push(FileInfo {
                        name: "..".to_string(),
                        is_dir,
                        last_modified,
                        size,
                        mimetype: "".to_string(),
                        path: remove_last_item_from_path_string(file_path.as_str())
                            .unwrap_or_else(|_| "".to_string()),
                    });
                } else {
                    file_details.push(FileInfo {
                        name: relative_path.trim_end_matches('/').to_string(),
                        is_dir,
                        last_modified,
                        size,
                        mimetype: mime_guess::from_ext(
                            get_file_extension(relative_path).unwrap().as_str(),
                        )
                        .first_raw()
                        .unwrap_or("")
                        .to_string(),
                        path,
                    });
                }
            }
        }
    }

    Ok(file_details)
}

pub fn unarchive_zip_file(
    app_handle: tauri::AppHandle,
    config: ExtractionConfig,
) -> Result<(), String> {
    // Open the ZIP file
    let mut archive = ZipArchive::new(File::open(&config.source).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    let selected_files = config.selected_files.unwrap_or_default();
    // Total number of files in the archive
    let total_files = if !selected_files.is_empty() {
        selected_files.len()
    } else {
        archive.len()
    };

    // Create progress tracker
    let progress = ExtractionProgress::new(total_files);

    // Create extraction directory if it doesn't exist
    std::fs::create_dir_all(&config.destination)
        .map_err(|e| format!("Failed to create extraction directory: {}", e))?;

    // Extract files with progress tracking and cancellation support
    for i in 0..archive.len() {
        // Check for cancellation
        if config.cancel.load(Ordering::Relaxed) {
            return Err("Extraction cancelled".to_string());
        }

        let mut file = match archive.by_index(i) {
            Ok(file) => file,
            Err(e) => {
                // Log and continue with next file
                eprintln!("Failed to extract file {}: {}", i, e);
                continue;
            }
        };

        // Check if the file path is in the selected files
        if !selected_files.is_empty() {
            let file_path = file.enclosed_name().unwrap().to_string_lossy().to_string();
            if !selected_files
                .iter()
                .any(|selected| file_path.starts_with(selected))
            {
                println!("Skipping file: {}", file_path);
                continue;
            }
        }

        // Construct full file path
        let outpath = match file.enclosed_name() {
            Some(path) => Path::new(&config.destination).join(path),
            None => continue,
        };

        // Create parent directories if they don't exist
        if let Some(p) = outpath.parent() {
            std::fs::create_dir_all(p).map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        // Skip if it's a directory
        if file.is_dir() {
            std::fs::create_dir_all(&outpath)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
            continue;
        }

        // Write file
        let mut outfile = match File::create(&outpath) {
            Ok(file) => file,
            Err(e) => {
                eprintln!("Failed to create output file: {}", e);
                continue;
            }
        };

        // Copy file contents
        match io::copy(&mut file, &mut outfile) {
            Ok(_) => {
                // Update and emit progress
                progress.update(i + 1);
                eprint!("Extracted {}/{} files\n", i + 1, total_files);
                // Emit progress event
                let _ = app_handle.emit("extract-progress", progress.get());
            }
            Err(e) => {
                eprintln!("Failed to write file: {}", e);
            }
        }
    }

    Ok(())
}

pub fn view_file_in_zip(
    source: String,
    file_name: String,
    state: State<'_, Arc<AppTempDir>>,
) -> Result<String, String> {
    // Open the ZIP file
    let file = File::open(&source).map_err(|e| format!("Failed to open ZIP file: {}", e))?;
    let reader = BufReader::new(file);
    let mut archive =
        ZipArchive::new(reader).map_err(|e| format!("Failed to read ZIP archive: {}", e))?;

    // Locate the target file
    let mut file_in_zip = archive
        .by_name(&file_name)
        .map_err(|e| format!("File not found in ZIP archive: {}", e))?;

    // Create a temporary directory
    let temp_dir = &state.temp_dir;
    let mut rng = rand::thread_rng();
    let random_name: String = (0..10)
        .map(|_| (0x61u8 + (rng.gen::<f32>() * 26.0) as u8) as char)
        .collect();
    let extension = Path::new(&file_name)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");
    let random_file_name: String = if extension.is_empty() {
        random_name
    } else {
        format!("{}.{}", random_name, extension)
    };
    let temp_file_path = temp_dir.path().join(random_file_name);
    // Write the file to the temporary directory
    let mut temp_file = File::create(&temp_file_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))
        .unwrap();
    let _ = std::io::copy(&mut file_in_zip, &mut temp_file)
        .map_err(|e| format!("Failed to write temp file: {}", e));

    // Open the file with the default application
    that_detached(&temp_file_path).map_err(|e| format!("Failed to open file: {}", e))?;

    // Return the path of the temporary file (optional, for debugging or logs)
    Ok(temp_file_path.to_string_lossy().to_string())
}

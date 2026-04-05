use std::fs::File;
use std::io::{self, BufReader};
use std::path::{Path, PathBuf, MAIN_SEPARATOR};
use std::sync::atomic::Ordering;
use std::sync::Arc;
use rand::Rng;
use tauri::{AppHandle, Emitter, State};
use tar::Archive;
use open::that_detached;

use crate::data_type::{AppTempDir, ExtractionConfig, ExtractionProgress, FileInfo};
use crate::utils::{get_file_extension, remove_last_item_from_path_string};

pub fn get_tar_details(
    source_path: PathBuf,
    file_path: Option<String>,
    state: State<'_, Arc<AppTempDir>>
) -> Result<Vec<FileInfo>, String> {
    let file = File::open(source_path.clone()).map_err(|e| e.to_string())?;
    let mut archive = Archive::new(BufReader::new(file));
    let mut file_details: Vec<FileInfo> = Vec::new();
    let file_path = file_path.unwrap_or_default();

    if !file_path.is_empty() && !file_path.ends_with(MAIN_SEPARATOR) {
        let res = view_file_in_tar(source_path.clone().to_string_lossy().to_string(), file_path.clone(), state.clone());
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
    
    for entry in archive.entries().map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path().map_err(|e| e.to_string())?;
        let path_str = path.to_string_lossy().to_string();
        let file_name = path_str.clone();

        if !file_path.is_empty() && !path_str.starts_with(&file_path) {
            continue;
        }
        let relative_path = file_name
            .strip_prefix(&file_path)
            .unwrap_or(&file_name)
            .trim_end_matches(MAIN_SEPARATOR);
        let count_child = relative_path.split(MAIN_SEPARATOR).collect::<Vec<&str>>();
        if count_child.len() == 1 {

            let is_dir = entry.header().entry_type().is_dir();
            let size = entry.header().size().unwrap_or(0);
            let last_modified = match entry.header().mtime() {
                Ok(mtime) => {
                let datetime = chrono::DateTime::from_timestamp(mtime as i64, 0)
                    .unwrap_or_else(|| chrono::DateTime::from_timestamp(0, 0).unwrap());
                datetime.format("%Y-%m-%d %H:%M:%S").to_string()
                },
                Err(_) => "Unknown".to_string(),
            };

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
                    path: path_str,
                });
            }
        }
    }

    Ok(file_details)
}

pub fn unarchive_tar_file(app_handle: AppHandle, config: ExtractionConfig) -> Result<(), String> {
    // Open the TAR file
    let file = File::open(&config.source).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);
    let mut archive = Archive::new(reader);

    // Collect all entries
    let entries: Vec<_> = archive.entries().map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    let selected_files = config.selected_files.unwrap_or_default();

    let total_files= if !selected_files.is_empty() {
        selected_files.len()
    } else {
        entries.len()
    };
    let progress = ExtractionProgress::new(total_files);

    // Create extraction directory if it doesn't exist
    std::fs::create_dir_all(&config.destination)
        .map_err(|e| format!("Failed to create extraction directory: {}", e))?;

    // Extract files with progress tracking and cancellation support
    entries.into_iter().enumerate().for_each(|(i, mut entry)| {
        // Check for cancellation
        if config.cancel.load(Ordering::Relaxed) {
            return;
        }

        // Check if the file path is in the selected files
        if !selected_files.is_empty() {
            let file_path = entry.path().unwrap().to_string_lossy().to_string();
            if !selected_files.iter().any(|selected| file_path.starts_with(selected)) {
                println!("Skipping file: {}", file_path);
                return;
            }
        }

        let path = match entry.path() {
            Ok(p) => p.to_path_buf(),
            Err(e) => {
                eprintln!("Failed to get entry path: {}", e);
                return;
            }
        };

        let outpath = Path::new(&config.destination).join(&path);

        // Create parent directories if necessary
        if let Some(p) = outpath.parent() {
            if let Err(e) = std::fs::create_dir_all(p) {
                eprintln!("Failed to create directory: {}", e);
                return;
            }
        }

        // Write file contents
        if let Err(e) = entry.unpack(&outpath) {
            eprintln!("Failed to unpack file: {}", e);
            return;
        }

        // Update and emit progress
        {
            progress.update(i + 1);
            eprintln!("Extracted {}/{} files", i + 1, total_files);
            // Emit progress event
            let _ = app_handle.emit("extract-progress", progress.get());
        }
    });

    Ok(())
}

pub fn view_file_in_tar(source: String, file_name: String, state: State<'_, Arc<AppTempDir>>) -> Result<String, String> {
    // Open the TAR file
    let file = File::open(&source).map_err(|e| format!("Failed to open TAR file: {}", e))?;
    let reader = BufReader::new(file);
    let mut archive = Archive::new(reader);

    // Locate the target file
    let mut file_in_tar = None;
    for entry in archive.entries().map_err(|e| format!("Failed to read TAR archive: {}", e))? {
        let mut entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        if entry.path().map_err(|e| format!("Failed to get entry path: {}", e))?.to_string_lossy() == file_name {
            file_in_tar = Some(entry);
            break;
        }
    }

    let mut file_in_tar = file_in_tar.ok_or_else(|| format!("File not found in TAR archive: {}", file_name))?;

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
    let mut temp_file = File::create(&temp_file_path).map_err(|e| format!("Failed to create temporary file: {}", e))?;

    // Write the file contents to the temporary file
    io::copy(&mut file_in_tar, &mut temp_file).map_err(|e| format!("Failed to write to temporary file: {}", e))?;

    that_detached(&temp_file_path).map_err(|e| format!("Failed to open file: {}", e))?;

    // Return the path to the temporary file
    Ok(temp_file_path.to_string_lossy().to_string())
}
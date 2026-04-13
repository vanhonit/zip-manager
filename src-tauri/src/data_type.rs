use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};
use tempfile::TempDir;

#[derive(serde::Serialize)]
pub struct SingleChecksum {
    pub algorithm: String,
    pub hash: String,
}
#[derive(serde::Serialize)]
pub struct FileInfo {
    pub name: String,
    pub is_dir: bool,
    pub last_modified: String,
    pub size: u64,
    pub mimetype: String,
    pub path: String,
}

// Extraction configuration struct
#[derive(Clone)]
pub struct ExtractionConfig {
    pub source: String,
    pub destination: String,
    pub selected_files: Option<Vec<String>>,
    pub cancel: Arc<AtomicBool>,
}

// Extraction progress state
#[derive(Clone)]
pub struct ExtractionProgress {
    current: Arc<Mutex<f64>>,
    total_files: usize,
}

impl ExtractionProgress {
    pub fn new(total_files: usize) -> Self {
        ExtractionProgress {
            current: Arc::new(Mutex::new(0.0)),
            total_files,
        }
    }

    pub fn update(&self, extracted_files: usize) {
        let mut current = self.current.lock().unwrap();
        *current = ((extracted_files as f64 / self.total_files as f64) * 100.0).min(100.0);
    }

    pub fn get(&self) -> f64 {
        *self.current.lock().unwrap()
    }
}

pub struct AppTempDir {
    pub temp_dir: TempDir,
}

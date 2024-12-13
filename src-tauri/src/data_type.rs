#[derive(serde::Serialize)]
pub struct FileInfo {
    pub name: String,
    pub is_dir: bool,
    pub last_modified: String,
    pub size: u64,
    pub mimetype: String,
    pub path: String,
}
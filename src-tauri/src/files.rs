use std::io;
use std::fs;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct FileDetail {
    file_name: String,
    is_folder: bool,
    // metadata: fs::Metadata,
    // file_type: fs::FileType
}

pub fn folder_details(path: &str) -> io::Result<Vec<FileDetail>> {
    let entries = fs::read_dir(path)?
        .map(|res| res.map(|e| FileDetail { 
            file_name: e.file_name().into_string().unwrap(), 
            is_folder: e.file_type().unwrap().is_dir() 
        }))
        .collect::<Result<Vec<_>, io::Error>>()?;
    println!("{:?}", serde_json::to_string(&entries)?);
    Ok(entries)
}

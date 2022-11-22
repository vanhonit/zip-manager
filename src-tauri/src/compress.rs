use compress_tools::*;
use std::io::{Result};
use std::fs::File;
use std::path::{Path, PathBuf};
use std::vec;

pub fn read_compress_file(path: &str) -> Result<Vec<String>> {
    let mut source = File::open(path)?;
    let all_files = list_archive_files(&mut source).unwrap();

    // let mut files: Vec<String> = vec![];
    // for file in  all_files{
    //     let mut tmp: Vec<&str> = file.trim().split('/').collect();
    //     if file.ends_with("/") {
    //         tmp.pop();
    //     }
    //     // println!("{:?}", file);
    //     // println!("{}", level);
    //     // println!("{}", sub_dir);
    //     // println!("{}", tmp.len());
    //     if (tmp.len() as i32) == level {
    //         if level == 1 || file.starts_with(sub_dir){
    //             files.push(file);   
    //         }
    //     }
    // }
    Ok(all_files)
}

pub fn process_file_list(sub_dir: &str, all_files: Vec<String>, level: i32) -> Result<Vec<String>> {
    let mut files: Vec<String> = vec![];
    for file in  all_files{
        let mut tmp: Vec<&str> = file.trim().split('/').collect();
        if file.ends_with("/") {
            tmp.pop();
        }
        // println!("{:?}", file);
        // println!("{}", level);
        // println!("{}", sub_dir);
        // println!("{}", tmp.len());
        if (tmp.len() as i32) == level {
            if level == 1 || file.starts_with(sub_dir){
                files.push(file.to_string());   
            }
        }
    }
    Ok(files)
}
pub fn extract_compress_file(path: &str, file: &String, filename: PathBuf) -> Result<()>{
    let mut source = File::open(path)?;
    // let mut target = Vec::default();
    println!("{:?}", filename);
    let mut target = File::create(filename).unwrap();
    uncompress_archive_file(&mut source, &mut target, file.as_str()).unwrap();   
    Ok(())
}

pub fn extract_compress_files(path: &str, target_path: &str, files: Vec<String>) -> Result<()>{
    // let mut source = File::open(path)?;
    for file in files {
        // let mut target = Vec::default();
        let mut tmp: Vec<&str> = file.split("/").collect();
        if file.ends_with("/") {
            tmp.pop();
        }
        let filename = Path::new(target_path).join(tmp[tmp.len() - 1]);
        
        extract_compress_file(path, &file, filename).unwrap();
        // let path = Path::new(target_path).join(tmp[tmp.len() - 1]);
        // let mut target = File::create(path).unwrap();
        // uncompress_archive_file(&mut source, &mut target, file.as_str());   
    }
    print!("extracted");
    Ok(())
}
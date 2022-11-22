#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs::remove_dir_all;
use std::ops::Sub;
use std::path::{PathBuf, Path};
use std::sync::{Mutex};
use std::collections::HashMap;
use tauri::api::dialog::FileDialogBuilder;
use tauri::{State, RunEvent, Menu, MenuItem, Submenu, CustomMenuItem, InvokePayload};
use tempfile::TempDir;
use rand::{distributions::Alphanumeric, Rng, thread_rng};// 0.8
use open;

mod files;
mod compress;
struct AppCached {
  store: Mutex<HashMap<String, Vec<String>>>,
  tmp_path: Mutex<String>
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
fn folder_details(path: &str) -> Result<Vec<files::FileDetail>, String> {
    let files = files::folder_details(path);
    Ok(files.unwrap())
}
#[tauri::command]
fn read_compress_file(path: &str, sub_path: &str, cached: State<AppCached>) -> Result<Vec<String>, String> {
    let mut level = 1;
    // println!("{:?}", sub_path);
    // println!("{:?}", path);
    if sub_path != "" {
       let tmp:Vec<&str> = sub_path.split("/").collect();
       level = tmp.len() as i32;
    }
    let mut store = cached.store.lock().unwrap();
    
    let all_files :Vec<String>;
    if  store.contains_key(path) {
      println!("Cached");
      all_files = store.get(path).unwrap().to_vec();
    } else {
      println!("Init data");
      all_files = compress::read_compress_file(path).unwrap();
      store.insert(path.to_string(), all_files.clone());
    }
    let files = compress::process_file_list(sub_path, all_files, level);
    Ok(files.unwrap())
}
#[tauri::command]
fn uncomporess_file(path: &str, files: Vec<String>) -> Result<(), String> {
    println!("uncompress");
    compress::extract_compress_files(path, ".", files).unwrap();
    Ok(())
}
#[tauri::command]
fn open_file(path: &str, file: &str, cached: State<AppCached>) -> Result<(), ()> {
  let tmp_path_string = &cached.tmp_path.lock().unwrap().to_string();
  let tmp_path = Path::new(tmp_path_string);
  let mut tmp: Vec<&str> = file.split("/").collect();
  tmp = tmp[tmp.len() - 1].split(".").collect();
  let mut filename: String = thread_rng().sample_iter(&Alphanumeric).take(10).map(char::from).collect();
  if tmp.len() > 1 {
    filename.push('.');
    filename.push_str(&tmp[tmp.len() - 1].to_owned());
  }
  let path_file = tmp_path.join(filename).to_path_buf();
  compress::extract_compress_file(path, &file.to_string(), path_file.to_path_buf()).unwrap();
  // compress::extract_compress_file(path, &file.to_string(), tmpfile.path().to_path_buf()).unwrap();
  open::that(path_file.to_path_buf()).unwrap();
  println!("{:?}", path_file.to_path_buf());
  Ok(())
}
fn main() {
    let dir = TempDir::new().unwrap();
    let tmp_path: PathBuf = dir.into_path();
    let tmp_path_str = Mutex::new(tmp_path.to_string_lossy().to_string());
    
    let open_menu = CustomMenuItem::new("open".to_string(), "Open");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let sub_menu = Submenu::new("File", Menu::new().add_item(open_menu).add_item(quit));
    let menu = Menu::new().add_native_item(MenuItem::Copy).add_submenu(sub_menu);
    let mut app = tauri::Builder::default()
      .menu(menu)
      .on_menu_event(|event| {
        match event.menu_item_id() {
          "quit" => {
            event.window().close().unwrap()
          },
          "open" => {
            // FileDialogBuilder::new().add_filter("Zip", &["zip", "tar", "rar"]).pick_file(|file_path| {
            // })
            event.window().emit("open_dialog", {}).unwrap();
          }
          _ => {}
        }
      })
      .manage(AppCached { store: Default::default(), tmp_path: Mutex::new(tmp_path.to_string_lossy().to_string()) })
      .invoke_handler(tauri::generate_handler![greet, folder_details, read_compress_file, uncomporess_file, open_file])
      .build(tauri::generate_context!())
      .expect("error while running tauri application");
    #[cfg(target_os = "macos")]
    app.set_activation_policy(tauri::ActivationPolicy::Regular);
    app.run(move |_app_handle, event | match event {
      RunEvent::ExitRequested { .. } => {
        let tmp_path_string = tmp_path_str.lock().unwrap().to_string();
        remove_dir_all(tmp_path_string).unwrap();
      }
      _ => {}
    });
}

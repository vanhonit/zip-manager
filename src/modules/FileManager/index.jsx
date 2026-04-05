import React, { useEffect, useState } from 'react';
import FileList from './FileList';
import Toolbar from './Toolbar';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
// import { homeDir } from '@tauri-apps/api/path';
import Breadcrumb from './Breadcumb';
import { homeDir } from '@tauri-apps/api/path';
import { getMatches } from '@tauri-apps/plugin-cli';

function isArchiveFile(fileName) {
  if (!fileName || typeof fileName !== "string") {
    return false; // Invalid input
  }

  // List of common archive file extensions
  const archiveExtensions = [
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".bz2",
    ".xz",
    ".tgz",
    ".tbz2",
    ".tar.gz",
    ".tar.bz2",
    ".tar.xz",
    ".z",
  ];

  // Convert file name to lowercase to handle case-insensitivity
  const lowerCaseFileName = fileName.toLowerCase();

  // Check if the file name ends with any of the archive extensions
  return archiveExtensions.some((ext) => lowerCaseFileName.endsWith(ext));
}


const FileManager = () => {
    const [currentPath, setCurrentPath] = useState('');
    const [currentArchive, setCurrentArchive] = useState('');
    const [files, setFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    // Load files in the selected directory
    const loadDirectory = async (path) => {
      const result = await invoke('read_directory', { path });
      setFiles(result);
      setCurrentPath(path);
      setCurrentArchive('');
      setSelectedFiles([]);
    };

    const onOpenFile = async (file) => {
      if (!file.is_dir || currentArchive) {
        const result = await invoke('open_file', { path: currentArchive ? currentArchive : file.path, filePath: currentArchive ? file.path  : '' });
        if (result) {
          if (result.length > 1 || result[0].path !== file.path) {
            setFiles(result);
          }
          if (isArchiveFile(file.name)) {
            setCurrentArchive(file.path);
            setCurrentPath('');
          }
        }
      } else {
        loadDirectory(file.path);
      }
    }

    useEffect(() => {
      getMatches().then((matches) => {
        console.log(matches);
        const args = matches.args;
        const source = args.source?.value;
        if (source) {
          if (isArchiveFile(source)) {
            onOpenFile({path: source, name: source});
          } else {
              loadDirectory(source);
          }
        } else {
          homeDir().then((dir) => {
            loadDirectory(dir);
          });
        }
      });
  
      return () => {
        // unlisten.then((unsub) => unsub());
      };
    }, []);


    const selectFile = (file) => {
      setSelectedFiles((prevSelectedFiles) => {
      const filePath = file.path;
      const isSelected = prevSelectedFiles.some((f) => f.path === filePath);
      if (isSelected) {
        return prevSelectedFiles.filter((f) => f.path !== filePath);
      } else {
        return [...prevSelectedFiles, file];
      }
      });
    };

    const extractSelectedFiles = async () => {
      if (!isArchiveFile(currentArchive)) {
        return;
      }
      const outputPath = await open({
        directory: true,
        multiple: false,
        title: 'Select Destination Folder',
      });

      if (!outputPath) {
        alert('No destination folder selected.');
        return;
      }

      await invoke('extract_files', { archivePath: currentArchive, selectedFiles: selectedFiles.map(file => file.path), outputPath });
    };

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <Toolbar onExtract={extractSelectedFiles}/>
            <Breadcrumb currentPath={currentPath.split('/')} onNavigate={loadDirectory} currentArchive={currentArchive.split('/')}  />
            <FileList files={files} onOpenFile={onOpenFile} selectedFiles={selectedFiles} onSelect={selectFile} />
        </div>
    );
};

export default FileManager;
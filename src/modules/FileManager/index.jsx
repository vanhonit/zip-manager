import React, { useEffect, useState } from 'react';
import FileList from './FileList';
import Toolbar from './Toolbar';
import { invoke } from '@tauri-apps/api/core';
import Breadcrumb from './Breadcumb';

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

    // Load files in the selected directory
    const loadDirectory = async (path) => {
      const result = await invoke('read_directory', { path });
      setFiles(result);
      setCurrentPath(path);
      setCurrentArchive('');
    };

    useEffect(() => {
      loadDirectory('/Users/honnguyen');
    }, []);

   const onSelectFile = async (file) => {
      if (!file.is_dir || currentArchive) {
        const result = await invoke('open_file', { path: currentArchive ? currentArchive : file.path, filePath: currentArchive ? file.path  : '' });
        if (result) {
          setFiles(result);
          if (isArchiveFile(file.name)) {
            setCurrentArchive(file.path);
          }
        }
      } else {
        loadDirectory(file.path);
      }
    }

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <Toolbar onExtract={() => {
              invoke('extract_files', { archivePath: '/Users/honnguyen/codup-wp-freshsales.zip', outputPath: '/Users/honnguyen/codup-wp-freshsales' });
            }}/>
            <Breadcrumb currentPath={currentPath.split('/')} onNavigate={loadDirectory} />
            <FileList files={files} onSelect={onSelectFile}/>
        </div>
    );
};

export default FileManager;
import React, { useEffect, useState } from "react";
import FileList from "./FileList";
import Toolbar from "./Toolbar";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import Breadcrumb from "./Breadcumb";
import { homeDir } from "@tauri-apps/api/path";
import { getMatches } from "@tauri-apps/plugin-cli";

function isArchiveFile(fileName) {
  if (!fileName || typeof fileName !== "string") return false;
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
  const lower = fileName.toLowerCase();
  return archiveExtensions.some((ext) => lower.endsWith(ext));
}

const FileManager = () => {
  // Path on the real filesystem (used when browsing directories)
  const [currentPath, setCurrentPath] = useState("");
  // Full path to the currently opened archive file on disk
  const [currentArchive, setCurrentArchive] = useState("");
  // Path *inside* the archive (e.g. "folder/" or "folder/sub/")
  const [archivePath, setArchivePath] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ── Filesystem navigation ──────────────────────────────────────────────────
  const loadDirectory = async (path) => {
    try {
      const result = await invoke("read_directory", { path });
      setFiles(result);
      setCurrentPath(path);
      setCurrentArchive("");
      setArchivePath("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("loadDirectory error:", err);
    }
  };

  // ── Archive navigation ─────────────────────────────────────────────────────
  /**
   * Open (or re-navigate to) an archive and show the contents at internalPath.
   * @param {string} archiveFile  – absolute path to the archive on disk
   * @param {string} internalPath – path inside the archive, e.g. "" | "folder/" | "a/b/"
   */
  const loadArchiveContents = async (archiveFile, internalPath = "") => {
    try {
      const result = await invoke("archive_file_details", {
        sourcePath: archiveFile,
        filePath: internalPath || null,
      });
      setFiles(result);
      setCurrentArchive(archiveFile);
      setArchivePath(internalPath || "");
      setCurrentPath("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("loadArchiveContents error:", err);
    }
  };

  /**
   * Navigate to a different level inside the *currently open* archive.
   * Called by the breadcrumb when the user clicks an archive-internal segment.
   */
  const navigateInArchive = (internalPath) => {
    loadArchiveContents(currentArchive, internalPath);
  };

  // ── Double-click handler ───────────────────────────────────────────────────
  const onOpenFile = async (file) => {
    if (currentArchive) {
      // We are already browsing inside an archive
      if (file.is_dir) {
        // Navigate deeper into the archive directory
        await loadArchiveContents(currentArchive, file.path);
      } else {
        // Open the file that lives inside the archive
        try {
          await invoke("view_file_in_archive", {
            archivePath: currentArchive,
            fileName: file.path.replace(/\/$/, ""), // strip any accidental trailing slash
          });
        } catch (err) {
          console.error("view_file_in_archive error:", err);
        }
      }
    } else if (file.is_dir) {
      // Plain filesystem directory
      await loadDirectory(file.path);
    } else if (isArchiveFile(file.name)) {
      // An archive file on the filesystem — open it and show root contents
      await loadArchiveContents(file.path, "");
    } else {
      // Regular file — open with the system's default application
      try {
        await invoke("open_file", { path: file.path, filePath: null });
      } catch (err) {
        console.error("open_file error:", err);
      }
    }
  };

  // ── File selection ─────────────────────────────────────────────────────────
  const selectFile = (file) => {
    setSelectedFiles((prev) => {
      const isSelected = prev.some((f) => f.path === file.path);
      return isSelected
        ? prev.filter((f) => f.path !== file.path)
        : [...prev, file];
    });
  };

  // ── Extract selected files ─────────────────────────────────────────────────
  const extractSelectedFiles = async () => {
    if (!isArchiveFile(currentArchive)) return;

    const outputPath = await open({
      directory: true,
      multiple: false,
      title: "Select Destination Folder",
    });

    if (!outputPath) {
      alert("No destination folder selected.");
      return;
    }

    await invoke("extract_files", {
      archivePath: currentArchive,
      selectedFiles: selectedFiles.map((f) => f.path),
      outputPath,
    });
  };

  // ── Initial load from CLI args or home dir ─────────────────────────────────
  useEffect(() => {
    getMatches().then((matches) => {
      const source = matches.args?.source?.value;
      if (source) {
        if (isArchiveFile(source)) {
          loadArchiveContents(source, "");
        } else {
          loadDirectory(source);
        }
      } else {
        homeDir().then((dir) => loadDirectory(dir));
      }
    });
  }, []);

  // ── Breadcrumb navigation helpers ──────────────────────────────────────────
  /**
   * Split the filesystem path into parts usable by the breadcrumb.
   * e.g.  "/Users/name/Downloads"  →  ["", "Users", "name", "Downloads"]
   */
  const fsBreadcrumbParts = currentPath ? currentPath.split("/") : [];

  /**
   * Split the archive-internal path into parts.
   * e.g.  "folder/subfolder/"  →  ["folder", "subfolder"]
   */
  const archiveBreadcrumbParts = archivePath
    ? archivePath.split("/").filter(Boolean)
    : [];

  /**
   * Called by breadcrumb when a filesystem segment is clicked.
   * Navigates to that path and exits archive mode.
   */
  const onNavigateFsSegment = (segmentIndex) => {
    const path = fsBreadcrumbParts.slice(0, segmentIndex + 1).join("/") || "/";
    loadDirectory(path);
  };

  /**
   * Called by breadcrumb when the archive root (the archive filename) is clicked.
   */
  const onNavigateArchiveRoot = () => {
    loadArchiveContents(currentArchive, "");
  };

  /**
   * Called by breadcrumb when an archive-internal segment is clicked.
   * Rebuilds the internal path up to (and including) that segment.
   */
  const onNavigateArchiveSegment = (segmentIndex) => {
    // e.g. parts = ["folder", "sub"], segmentIndex = 0  →  "folder/"
    const parts = archiveBreadcrumbParts.slice(0, segmentIndex + 1);
    const internalPath = parts.join("/") + "/";
    navigateInArchive(internalPath);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <Toolbar onExtract={extractSelectedFiles} />
      <Breadcrumb
        fsBreadcrumbParts={fsBreadcrumbParts}
        currentArchive={currentArchive}
        archiveBreadcrumbParts={archiveBreadcrumbParts}
        onNavigateFsSegment={onNavigateFsSegment}
        onNavigateArchiveRoot={onNavigateArchiveRoot}
        onNavigateArchiveSegment={onNavigateArchiveSegment}
      />
      <FileList
        files={files}
        onOpenFile={onOpenFile}
        selectedFiles={selectedFiles}
        onSelect={selectFile}
      />
    </div>
  );
};

export default FileManager;

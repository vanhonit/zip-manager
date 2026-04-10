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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Filesystem navigation ──────────────────────────────────────────────────
  const loadDirectory = async (path) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await invoke("read_directory", { path });
      setFiles(result);
      setCurrentPath(path);
      setCurrentArchive("");
      setArchivePath("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("loadDirectory error:", err);
      setError(`Failed to load directory: ${err.message || err}`);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Archive navigation ─────────────────────────────────────────────────────
  /**
   * Open (or re-navigate to) an archive and show the contents at internalPath.
   * @param {string} archiveFile  – absolute path to the archive on disk
   * @param {string} internalPath – path inside the archive, e.g. "" | "folder/" | "a/b/"
   */
  const loadArchiveContents = async (archiveFile, internalPath = "") => {
    setIsLoading(true);
    setError(null);
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
      setError(`Failed to load archive contents: ${err.message || err}`);
      setFiles([]);
    } finally {
      setIsLoading(false);
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
          setError(`Failed to view file: ${err.message || err}`);
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
        setError(`Failed to open file: ${err.message || err}`);
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

  // ── Select All ─────────────────────────────────────────────────────────────
  const selectAll = () => {
    setSelectedFiles([...files]);
  };

  // ── Deselect All ───────────────────────────────────────────────────────────
  const deselectAll = () => {
    setSelectedFiles([]);
  };

  // ── Extract selected files ─────────────────────────────────────────────────
  const extractSelectedFiles = async () => {
    if (!currentArchive || selectedFiles.length === 0) return;

    const outputPath = await open({
      directory: true,
      multiple: false,
      title: "Select Destination Folder",
    });

    if (!outputPath) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await invoke("extract_files", {
        archivePath: currentArchive,
        selectedFiles: selectedFiles.map((f) => f.path),
        outputPath,
      });
    } catch (err) {
      console.error("extract_files error:", err);
      setError(`Failed to extract files: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── View selected file in archive ──────────────────────────────────────────
  const viewSelectedFile = async () => {
    if (!currentArchive || selectedFiles.length !== 1) return;

    const file = selectedFiles[0];
    if (file.is_dir) return;

    try {
      await invoke("view_file_in_archive", {
        archivePath: currentArchive,
        fileName: file.path.replace(/\/$/, ""),
      });
    } catch (err) {
      console.error("view_file_in_archive error:", err);
      setError(`Failed to view file: ${err.message || err}`);
    }
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to deselect all
      if (e.key === "Escape") {
        deselectAll();
      }
      // Delete key to delete selected files (placeholder for future implementation)
      // if (e.key === "Delete" && selectedFiles.length > 0) {
      //   // TODO: Implement delete functionality
      //   console.log("Delete key pressed");
      // }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFiles]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-3 sm:p-2 lg:p-6">
        {/* Main Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-xl">
          {/* Toolbar */}
          <Toolbar
            onExtract={extractSelectedFiles}
            onView={viewSelectedFile}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            selectedCount={selectedFiles.length}
            totalCount={files.length}
            isInArchive={!!currentArchive}
            disabled={isLoading}
          />

          {/* Breadcrumb */}
          <Breadcrumb
            fsBreadcrumbParts={fsBreadcrumbParts}
            currentArchive={currentArchive}
            archiveBreadcrumbParts={archiveBreadcrumbParts}
            onNavigateFsSegment={onNavigateFsSegment}
            onNavigateArchiveRoot={onNavigateArchiveRoot}
            onNavigateArchiveSegment={onNavigateArchiveSegment}
          />

          {/* Error Display */}
          {error && (
            <div className="mx-4 my-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <i className="ri-alert-line text-2xl text-red-500 flex-shrink-0 mt-0.5"></i>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  Error
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Dismiss"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading...</p>
              </div>
            </div>
          )}

          {/* File List */}
          {!isLoading && (
            <FileList
              files={files}
              onOpenFile={onOpenFile}
              selectedFiles={selectedFiles}
              onSelect={selectFile}
              isLoading={isLoading}
              currentArchive={currentArchive}
            />
          )}
        </div>

        {/* Keyboard Shortcuts Help */}
        {/* <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-wrap gap-3 text-xs text-blue-800">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">
                Esc
              </kbd>
              <span>Deselect</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">
                Double Click
              </kbd>
              <span>Open</span>
            </div>
          </div>
        </div>*/}
      </div>
    </div>
  );
};

export default FileManager;

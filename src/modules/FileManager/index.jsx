import React, { useEffect, useState } from "react";
import FileList from "./FileList";
import Toolbar from "./Toolbar";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import Breadcrumb from "./Breadcumb";
import { homeDir } from "@tauri-apps/api/path";
import { listen } from "@tauri-apps/api/event";
import { getMatches } from "@tauri-apps/plugin-cli";
import ChecksumModal from "../Checksum/ChecksumModal";
import PropertiesModal from "./PropertiesModal";
import CreateArchiveModal from "../Archive/CreateArchiveModal";

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
  const [searchQuery, setSearchQuery] = useState("");
  // Path of the file to show checksum modal for (null = hidden)
  const [checksumFilePath, setChecksumFilePath] = useState(null);
  // File to show properties for (null = hidden)
  const [propertiesFile, setPropertiesFile] = useState(null);
  // Create archive modal visibility
  const [showCreateArchiveModal, setShowCreateArchiveModal] = useState(false);

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    if (!searchQuery || searchQuery.trim() === "") return true;
    const query = searchQuery.toLowerCase().trim();
    return file.name.toLowerCase().includes(query);
  });

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
      setSearchQuery("");
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
      setSearchQuery("");
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
    setSearchQuery("");
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

  // ── Open selected item ───────────────────────────────────────────────────────
  const openSelected = async () => {
    if (selectedFiles.length !== 1) return;
    await onOpenFile(selectedFiles[0]);
  };

  // ── Show properties for a file ──────────────────────────────────────────────
  const showProperties = (file) => {
    setPropertiesFile(file);
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

  // ── Show checksum modal for the current archive ────────────────────────────
  const showChecksum = () => {
    if (!currentArchive) return;
    setChecksumFilePath(currentArchive);
  };

  // ── Show create archive modal ──────────────────────────────────────────────
  const openCreateArchiveModal = () => {
    if (selectedFiles.length === 0) {
      setError("Please select files to create an archive");
      return;
    }
    setShowCreateArchiveModal(true);
  };

  // ── Handle successful archive creation ───────────────────────────────────
  const handleArchiveCreated = () => {
    // Refresh the current view
    if (currentPath) {
      loadDirectory(currentPath);
    } else if (currentArchive) {
      loadArchiveContents(currentArchive, archivePath);
    }
    // Clear selection
    setSelectedFiles([]);
    setShowCreateArchiveModal(false);
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Enter to open selected item
      if (e.key === "Enter" && selectedFiles.length === 1) {
        e.preventDefault();
        openSelected();
      }
      // Escape to deselect all
      else if (e.key === "Escape") {
        deselectAll();
      }
      // Backspace to go up in navigation
      else if (e.key === "Backspace" && !e.target.matches('input, textarea')) {
        e.preventDefault();
        if (currentArchive && archivePath) {
          // Go up in archive navigation
          const parts = archivePath.split("/").filter(Boolean);
          if (parts.length > 0) {
            parts.pop(); // Remove last segment
            const newPath = parts.length > 0 ? parts.join("/") + "/" : "";
            loadArchiveContents(currentArchive, newPath);
          }
        } else if (currentPath && currentPath !== "/") {
          // Go up in filesystem navigation
          const parts = currentPath.split("/").filter(Boolean);
          if (parts.length > 0) {
            parts.pop(); // Remove last segment
            const newPath = "/" + parts.join("/");
            loadDirectory(newPath || "/");
          }
        }
      }
      // Delete key to delete selected files (placeholder for future implementation)
      // if (e.key === "Delete" && selectedFiles.length > 0) {
      //   // TODO: Implement delete functionality
      //   console.log("Delete key pressed");
      // }
      // Ctrl/Cmd + N to create archive
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && selectedFiles.length > 0 && !currentArchive) {
        e.preventDefault();
        openCreateArchiveModal();
      }
      //   // TODO: Implement delete functionality
      //   console.log("Delete key pressed");
      // }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFiles, currentPath, currentArchive, archivePath]);

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

  // ── Handle file-open events (e.g. double-clicking an archive in Finder) ────
  useEffect(() => {
    const unlisten = listen("file-open", (event) => {
      const path = event.payload;
      if (typeof path === "string" && path.length > 0) {
        if (isArchiveFile(path)) {
          loadArchiveContents(path, "");
        } else {
          loadDirectory(path);
        }
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
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
    setSearchQuery("");
  };

  /**
   * Called by breadcrumb when the archive root (the archive filename) is clicked.
   */
  const onNavigateArchiveRoot = () => {
    loadArchiveContents(currentArchive, "");
    setSearchQuery("");
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100 overflow-hidden">
          <div className="px-4 py-2 sm:px-6 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <i className="ri-archive-2-line text-xl sm:text-2xl text-white"></i>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">Rusty Compress</h1>
                  <p className="text-xs sm:text-sm text-blue-100">Archive Manager</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-white/80 text-xs sm:text-sm">
                <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono backdrop-blur-sm">Esc</kbd>
                <span>Deselect</span>
                <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono backdrop-blur-sm">Enter</kbd>
                <span>Open</span>
                <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono backdrop-blur-sm">Click</kbd>
                <span>Select</span>
                <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono backdrop-blur-sm">⌘N</kbd>
                <span>Create Archive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Container */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Toolbar */}
          <div className="shrink-0">
            <Toolbar
              onExtract={extractSelectedFiles}
              onView={viewSelectedFile}
              onOpen={openSelected}
              onChecksum={showChecksum}
              onCreateArchive={openCreateArchiveModal}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              selectedCount={selectedFiles.length}
              totalCount={files.length}
              isInArchive={!!currentArchive}
              hasArchivePath={!!currentArchive}
              disabled={isLoading}
              onSearchChange={setSearchQuery}
              searchQuery={searchQuery}
            />
          </div>

          {/* Breadcrumb */}
          <div className="shrink-0">
            <Breadcrumb
              fsBreadcrumbParts={fsBreadcrumbParts}
              currentArchive={currentArchive}
              archiveBreadcrumbParts={archiveBreadcrumbParts}
              onNavigateFsSegment={onNavigateFsSegment}
              onNavigateArchiveRoot={onNavigateArchiveRoot}
              onNavigateArchiveSegment={onNavigateArchiveSegment}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-4 my-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl flex items-start gap-2 sm:gap-3 shadow-sm animate-pulse shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-alert-line text-base sm:text-lg text-red-600"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-red-800 mb-1">
                  Error
                </h3>
                <p className="text-xs sm:text-sm text-red-700 break-words">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-100 rounded flex-shrink-0"
                title="Dismiss"
              >
                <i className="ri-close-line text-base sm:text-xl"></i>
              </button>
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading && (
            <div className="flex items-center justify-center py-10 sm:py-20 bg-gradient-to-b from-gray-50 to-white flex-1">
              <div className="text-center">
                <div className="relative mb-4 sm:mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <i className="ri-refresh-line text-xl sm:text-2xl text-white animate-spin"></i>
                  </div>
                </div>
                <p className="text-gray-600 font-medium text-base sm:text-lg">Loading files...</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Please wait a moment</p>
              </div>
            </div>
          )}

          {/* File List */}
          {!isLoading && (
            <div className="flex-1 overflow-hidden">
              <FileList
                files={filteredFiles}
                onOpenFile={onOpenFile}
                selectedFiles={selectedFiles}
                onSelect={selectFile}
                isLoading={isLoading}
                currentArchive={currentArchive}
                onShowProperties={showProperties}
                onCreateArchive={openCreateArchiveModal}
              />
            </div>
          )}

          {/* Status Bar */}
          {files.length > 0 && (
            <div className="shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-blue-200 px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <i className="ri-file-list-3-line text-gray-500 text-sm sm:text-base"></i>
                  <span className="text-gray-700 font-medium text-xs sm:text-sm">
                    {searchQuery ? `${filteredFiles.length} of ${files.length}` : `${files.length}`} items
                  </span>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <i className="ri-checkbox-circle-line text-blue-500 text-sm sm:text-base"></i>
                      <span className="text-blue-700 font-medium text-xs sm:text-sm">{selectedFiles.length} selected</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-3 sm:gap-4 text-gray-500 text-xs sm:text-sm">
                <div className="flex items-center gap-1">
                  <i className="ri-mouse-line"></i>
                  <span>Click to select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Enter</kbd>
                  <span>to open</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">Esc</kbd>
                  <span>deselect</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">⌘N</kbd>
                  <span>create archive</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checksum Modal */}
      {checksumFilePath && (
        <ChecksumModal
          filePath={checksumFilePath}
          onClose={() => setChecksumFilePath(null)}
        />
      )}

      {/* Properties Modal */}
      {propertiesFile && (
        <PropertiesModal
          file={propertiesFile}
          currentArchive={currentArchive}
          onClose={() => setPropertiesFile(null)}
        />
      )}

      {/* Create Archive Modal */}
      {showCreateArchiveModal && (
        <CreateArchiveModal
          selectedFiles={selectedFiles.map(f => f.path)}
          currentPath={currentPath}
          onClose={() => setShowCreateArchiveModal(false)}
          onSuccess={handleArchiveCreated}
        />
      )}
    </div>
  );
};

export default FileManager;

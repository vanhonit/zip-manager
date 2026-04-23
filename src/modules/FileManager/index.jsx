import React, { useEffect, useState, useCallback } from "react";
import FileList from "./FileList";
import Toolbar from "./Toolbar";
import TabBar from "../../components/TabBar";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import Breadcrumb from "./Breadcumb";
import { homeDir } from "@tauri-apps/api/path";
import { listen, emit } from "@tauri-apps/api/event";

import ChecksumModal from "../Checksum/ChecksumModal";
import PropertiesModal from "./PropertiesModal";
import CreateArchiveModal from "../Archive/CreateArchiveModal";
import PasswordModal from "../Extract/PasswordModal";
import { useTabContext } from "../../contexts/TabContext";

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
  // Prevents React StrictMode from running the initial load effect twice
  const initDone = React.useRef(false);

  // Tab context for multi-tab support
  const { tabs, activeTab, addTab, closeTab, switchTab, updateTab } = useTabContext();

  // Create refs for functions to avoid closure issues in event listeners
  const addTabRef = React.useRef(addTab);
  const loadArchiveContentsRef = React.useRef(null);
  const loadDirectoryRef = React.useRef(null);

  // Update refs when functions change
  React.useEffect(() => {
    addTabRef.current = addTab;
  }, [addTab]);

  // Local state for modals (not tab-specific)
  const [checksumFilePath, setChecksumFilePath] = useState(null);
  const [propertiesFile, setPropertiesFile] = useState(null);
  const [showCreateArchiveModal, setShowCreateArchiveModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [currentExtraction, setCurrentExtraction] = useState(null);

  // Extract current tab data for easier access
  const currentTab = activeTab;

  // Filter files based on search query for current tab
  const filteredFiles = currentTab?.files?.filter((file) => {
    if (!currentTab?.searchQuery || currentTab.searchQuery.trim() === "") return true;
    const query = currentTab.searchQuery.toLowerCase().trim();
    return file.name.toLowerCase().includes(query);
  }) || [];

  // ── Filesystem navigation ──────────────────────────────────────────────────
  const loadDirectory = async (path, tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    if (!targetTabId) return;

    updateTab(targetTabId, {
      isLoading: true,
      error: null,
    });

    try {
      const result = await invoke("read_directory", { path });

      // Get the directory name for the tab title
      const pathParts = path.split("/").filter(Boolean);
      const dirName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "Home";

      updateTab(targetTabId, {
        files: result,
        currentPath: path,
        currentArchive: "",
        archivePath: "",
        selectedFiles: [],
        searchQuery: "",
        title: dirName,
        type: 'filesystem',
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("loadDirectory error:", err);
      updateTab(targetTabId, {
        error: `Failed to load directory: ${err.message || err}`,
        files: [],
        isLoading: false,
      });
    }
  };

  // Update ref for loadDirectory
  React.useEffect(() => {
    loadDirectoryRef.current = loadDirectory;
  }, [loadDirectory]);

  // ── Archive navigation ─────────────────────────────────────────────────────
  /**
   * Open (or re-navigate to) an archive and show the contents at internalPath.
   * @param {string} archiveFile  – absolute path to the archive on disk
   * @param {string} internalPath – path inside the archive, e.g. "" | "folder/" | "a/b/"
   * @param {string} tabId – optional tab ID to load into
   */
  const loadArchiveContents = async (archiveFile, internalPath = "", tabId = null) => {
    console.log("loadArchiveContents called with:", archiveFile, internalPath, tabId);
    const targetTabId = tabId || currentTab?.id;
    if (!targetTabId) return;

    updateTab(targetTabId, {
      isLoading: true,
      error: null,
    });

    try {
      const result = await invoke("archive_file_details", {
        sourcePath: archiveFile,
        filePath: internalPath || null,
      });
      console.log("Archive contents loaded:", result);

      // Get the archive filename for the tab title
      const pathParts = archiveFile.split("/").filter(Boolean);
      const fileName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : archiveFile;

      updateTab(targetTabId, {
        files: result,
        currentArchive: archiveFile,
        archivePath: internalPath || "",
        currentPath: "",
        selectedFiles: [],
        searchQuery: "",
        title: fileName,
        type: 'archive',
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("loadArchiveContents error:", err);
      updateTab(targetTabId, {
        error: `Failed to load archive contents: ${err.message || err}`,
        files: [],
        isLoading: false,
      });
    }
  };

  // Update ref for loadArchiveContents
  React.useEffect(() => {
    loadArchiveContentsRef.current = loadArchiveContents;
  }, [loadArchiveContents]);

  /**
   * Navigate to a different level inside the *currently open* archive.
   * Called by the breadcrumb when the user clicks an archive-internal segment.
   */
  const navigateInArchive = (internalPath, tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    const archiveFile = currentTab?.currentArchive;
    if (!targetTabId || !archiveFile) return;

    loadArchiveContents(archiveFile, internalPath, targetTabId);
    updateTab(targetTabId, { searchQuery: "" });
  };

  // ── Double-click handler ───────────────────────────────────────────────────
  const onOpenFile = async (file, tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    if (!targetTabId) return;

    const tab = tabs.find(t => t.id === targetTabId);
    if (!tab) return;

    if (tab.currentArchive) {
      // We are already browsing inside an archive
      if (file.is_dir) {
        // Navigate deeper into the archive directory
        await loadArchiveContents(tab.currentArchive, file.path, targetTabId);
      } else {
        // Open the file that lives inside the archive
        try {
          await invoke("view_file_in_archive", {
            archivePath: tab.currentArchive,
            fileName: file.path.replace(/\/$/, ""), // strip any accidental trailing slash
          });
        } catch (err) {
          console.error("view_file_in_archive error:", err);
          updateTab(targetTabId, { error: `Failed to view file: ${err.message || err}` });
        }
      }
    } else if (file.is_dir) {
      // Plain filesystem directory
      await loadDirectory(file.path, targetTabId);
    } else if (isArchiveFile(file.name)) {
      // An archive file on the filesystem — open it and show root contents
      await loadArchiveContents(file.path, "", targetTabId);
    } else {
      // Regular file — open with the system's default application
      try {
        await invoke("open_file", { path: file.path, filePath: null });
      } catch (err) {
        console.error("open_file error:", err);
        updateTab(targetTabId, { error: `Failed to open file: ${err.message || err}` });
      }
    }
  };

  // ── File selection ─────────────────────────────────────────────────────────
  const selectFile = (file, tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    if (!targetTabId) return;

    const tab = tabs.find(t => t.id === targetTabId);
    if (!tab) return;

    const isSelected = tab.selectedFiles.some((f) => f.path === file.path);
    const newSelectedFiles = isSelected
      ? tab.selectedFiles.filter((f) => f.path !== file.path)
      : [...tab.selectedFiles, file];

    updateTab(targetTabId, { selectedFiles: newSelectedFiles });
  };

  // ── Select All ─────────────────────────────────────────────────────────────
  const selectAll = (tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    if (!targetTabId) return;

    const tab = tabs.find(t => t.id === targetTabId);
    if (!tab) return;

    updateTab(targetTabId, { selectedFiles: [...tab.files] });
  };

  // ── Open selected item ───────────────────────────────────────────────────────
  const openSelected = async (tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    const tab = tabs.find(t => t.id === targetTabId);
    if (!tab || tab.selectedFiles.length !== 1) return;

    await onOpenFile(tab.selectedFiles[0], targetTabId);
  };

  // ── Show properties for a file ──────────────────────────────────────────────
  const showProperties = (file) => {
    setPropertiesFile(file);
  };

  // ── Deselect All ───────────────────────────────────────────────────────────
  const deselectAll = (tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    if (!targetTabId) return;

    updateTab(targetTabId, { selectedFiles: [] });
  };

  // ── Extract selected files ─────────────────────────────────────────────────
  const extractSelectedFiles = async (tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    const tab = tabs.find(t => t.id === targetTabId);
    if (!tab || !tab.currentArchive) return;

    const outputPath = await open({
      directory: true,
      multiple: false,
      title: "Select Destination Folder",
    });

    if (!outputPath) {
      return;
    }

    const filePaths =
      tab.selectedFiles.length > 0 ? tab.selectedFiles.map((f) => f.path) : null;

    // Store extraction details for password handling
    const extraction = {
      archivePath: tab.currentArchive,
      selectedFiles: filePaths,
      outputPath,
      tabId: targetTabId,
    };
    setCurrentExtraction(extraction);

    // Try extraction without password first
    updateTab(targetTabId, { isLoading: true, error: null });
    setPasswordError(null);

    try {
      await invoke("extract_files", {
        archivePath: tab.currentArchive,
        selectedFiles: filePaths,
        outputPath,
        password: null, // Try without password first
      });
    } catch (err) {
      console.error("extract_files error:", err);
      const errorMsg = err.message || err;

      // Check if error is password-related
      if (
        errorMsg.toLowerCase().includes("password") ||
        errorMsg.toLowerCase().includes("encrypted") ||
        errorMsg.toLowerCase().includes("protected")
      ) {
        // Show password modal
        setShowPasswordModal(true);
        setPasswordError(
          "This archive is password protected. Please enter the correct password.",
        );
      } else {
        updateTab(targetTabId, { error: `Failed to extract files: ${errorMsg}`, isLoading: false });
      }
    } finally {
      updateTab(targetTabId, { isLoading: false });
    }
  };

  // ── Extract selected files to the archive's own folder ─────────────────────
  const extractHere = async (tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    const tab = tabs.find(t => t.id === targetTabId);
    if (!tab || !tab.currentArchive) return;

    // Derive the parent directory of the archive file
    const lastSlash = tab.currentArchive.lastIndexOf("/");
    const outputPath =
      lastSlash >= 0 ? tab.currentArchive.substring(0, lastSlash) : "/";

    const filePaths =
      tab.selectedFiles.length > 0 ? tab.selectedFiles.map((f) => f.path) : null;

    const extraction = {
      archivePath: tab.currentArchive,
      selectedFiles: filePaths,
      outputPath,
      tabId: targetTabId,
    };
    setCurrentExtraction(extraction);

    updateTab(targetTabId, { isLoading: true, error: null });
    setPasswordError(null);

    try {
      await invoke("extract_files", {
        archivePath: tab.currentArchive,
        selectedFiles: filePaths,
        outputPath,
        password: null,
      });
    } catch (err) {
      console.error("extractHere error:", err);
      const errorMsg = err.message || err;

      if (
        errorMsg.toLowerCase().includes("password") ||
        errorMsg.toLowerCase().includes("encrypted") ||
        errorMsg.toLowerCase().includes("protected")
      ) {
        setShowPasswordModal(true);
        setPasswordError(
          "This archive is password protected. Please enter the correct password.",
        );
      } else {
        updateTab(targetTabId, { error: `Failed to extract files: ${errorMsg}`, isLoading: false });
      }
    } finally {
      updateTab(targetTabId, { isLoading: false });
    }
  };

  // Handle password submission
  const handlePasswordSubmit = async (password) => {
    if (!currentExtraction) return;

    setShowPasswordModal(true); // Keep modal open
    setPasswordError(null);

    try {
      await invoke("extract_files", {
        archivePath: currentExtraction.archivePath,
        selectedFiles: currentExtraction.selectedFiles,
        outputPath: currentExtraction.outputPath,
        password: password, // Try with provided password
      });

      // If successful, close password modal
      setShowPasswordModal(false);
      setCurrentExtraction(null);
    } catch (err) {
      console.error("extract_files with password error:", err);
      const errorMsg = err.message || err;

      if (
        errorMsg.toLowerCase().includes("password") ||
        errorMsg.toLowerCase().includes("incorrect")
      ) {
        // Password was wrong, show error in modal
        setPasswordError("Incorrect password. Please try again.");
      } else {
        // Other error
        setShowPasswordModal(false);
        setError(`Failed to extract files: ${errorMsg}`);
        setCurrentExtraction(null);
      }
    }
  };

  // Handle password modal close
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPasswordError(null);
    setCurrentExtraction(null);
  };

  // ── Show checksum modal for the current archive ────────────────────────────
  const showChecksum = (tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    const tab = tabs.find(t => t.id === targetTabId);
    if (!tab || !tab.currentArchive) return;

    setChecksumFilePath(tab.currentArchive);
  };

  // ── Show create archive modal ──────────────────────────────────────────────
  const openCreateArchiveModal = (tabId = null) => {
    const targetTabId = tabId || currentTab?.id;
    const tab = tabs.find(t => t.id === targetTabId);
    if (!tab) return;

    if (tab.selectedFiles.length === 0) {
      updateTab(targetTabId, { error: "Please select files to create an archive" });
      return;
    }
    setShowCreateArchiveModal(true);
  };

  // ── Handle successful archive creation ───────────────────────────────────
  const handleArchiveCreated = () => {
    // Refresh the current view
    if (currentTab?.currentPath) {
      loadDirectory(currentTab.currentPath, currentTab.id);
    } else if (currentTab?.currentArchive) {
      loadArchiveContents(currentTab.currentArchive, currentTab.archivePath, currentTab.id);
    }
    // Clear selection
    if (currentTab) {
      updateTab(currentTab.id, { selectedFiles: [] });
    }
    setShowCreateArchiveModal(false);
  };

  // ── Handle creating a new tab ───────────────────────────────────────────────
  const handleNewTab = async () => {
    const newTabId = addTab({
      title: "Home",
      type: "filesystem",
      currentPath: "",
      currentArchive: "",
      archivePath: "",
      files: [],
      selectedFiles: [],
      searchQuery: "",
      isLoading: true,
      error: null,
    });

    // Load home directory for the new tab
    try {
      const homeDirPath = await homeDir();
      await loadDirectory(homeDirPath, newTabId);
    } catch (err) {
      console.error("Failed to load home directory for new tab:", err);
      updateTab(newTabId, {
        error: `Failed to load home directory: ${err.message || err}`,
        isLoading: false,
      });
    }
  };

  // Update ref for handleNewTab
  const handleNewTabRef = React.useRef(handleNewTab);
  React.useEffect(() => {
    handleNewTabRef.current = handleNewTab;
  }, [handleNewTab]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!currentTab) return;

      // Cmd+T: New tab
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "t") {
        e.preventDefault();
        e.stopPropagation();
        handleNewTab();
        return;
      }

      // Cmd+W: Close current tab
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w") {
        e.preventDefault();
        e.stopPropagation();
        if (tabs.length > 1) {
          closeTab(currentTab.id);
        } else {
          // Optional: Show a message that you can't close the last tab
          console.log("Cannot close the last tab");
        }
        return;
      }

      // Cmd+1-9: Switch to tab
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9") {
        const tabIndex = parseInt(e.key) - 1;
        if (tabIndex < tabs.length) {
          e.preventDefault();
          e.stopPropagation();
          switchTab(tabs[tabIndex].id);
        }
        return;
      }

      // Enter to open selected item
      if (e.key === "Enter" && currentTab.selectedFiles.length === 1) {
        e.preventDefault();
        openSelected(currentTab.id);
      }
      // Escape to deselect all
      else if (e.key === "Escape") {
        deselectAll(currentTab.id);
      }
      // Backspace to go up in navigation
      else if (e.key === "Backspace" && !e.target.matches("input, textarea")) {
        e.preventDefault();
        if (currentTab.currentArchive && currentTab.archivePath) {
          // Go up in archive navigation
          const parts = currentTab.archivePath.split("/").filter(Boolean);
          if (parts.length > 0) {
            parts.pop(); // Remove last segment
            const newPath = parts.length > 0 ? parts.join("/") + "/" : "";
            loadArchiveContents(currentTab.currentArchive, newPath, currentTab.id);
          }
        } else if (currentTab.currentPath && currentTab.currentPath !== "/") {
          // Go up in filesystem navigation
          const parts = currentTab.currentPath.split("/").filter(Boolean);
          if (parts.length > 0) {
            parts.pop(); // Remove last segment
            const newPath = "/" + parts.join("/");
            loadDirectory(newPath || "/", currentTab.id);
          }
        }
      }
      // Delete key to delete selected files (placeholder for future implementation)
      // if (e.key === "Delete" && currentTab.selectedFiles.length > 0) {
      //   // TODO: Implement delete functionality
      //   console.log("Delete key pressed");
      // }
      // Ctrl/Cmd + N to create archive
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "n" &&
        currentTab.selectedFiles.length > 0 &&
        !currentTab.currentArchive
      ) {
        e.preventDefault();
        openCreateArchiveModal(currentTab.id);
      }
    };

    // Use capture phase to intercept events before they reach the browser
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [currentTab, tabs, closeTab, switchTab]);

  // ── Initial load from CLI args or home dir ─────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    emit("frontend-ready");
    invoke("take_files")
      .then((files) => {
        console.log("take_files result", files);

        // Use refs to access latest functions
        const currentAddTab = addTabRef.current;
        const currentLoadArchiveContents = loadArchiveContentsRef.current;
        const currentLoadDirectory = loadDirectoryRef.current;
        const currentHandleNewTab = handleNewTabRef.current;

        if (!currentAddTab || !currentLoadArchiveContents || !currentLoadDirectory || !currentHandleNewTab) {
          console.error("Required functions not available for initial load");
          return;
        }

        if (files && files.length > 0) {
          // Create initial tab with the opened file
          const firstFile = files[0];
          if (isArchiveFile(firstFile)) {
            const newTabId = currentAddTab({
              title: "Loading...",
              type: "archive",
              currentArchive: firstFile,
              archivePath: "",
              currentPath: "",
              files: [],
              selectedFiles: [],
              searchQuery: "",
              isLoading: true,
              error: null,
            });
            currentLoadArchiveContents(firstFile, "", newTabId);
          } else {
            const newTabId = currentAddTab({
              title: "Loading...",
              type: "filesystem",
              currentPath: firstFile,
              currentArchive: "",
              archivePath: "",
              files: [],
              selectedFiles: [],
              searchQuery: "",
              isLoading: true,
              error: null,
            });
            currentLoadDirectory(firstFile, newTabId);
          }
        } else {
          // Create home directory tab if no files opened
          currentHandleNewTab();
        }
      })
      .catch(() => {
        const currentHandleNewTab = handleNewTabRef.current;
        if (currentHandleNewTab) {
          currentHandleNewTab();
        }
      });
  }, []);

  // ── Handle file-open events (e.g. double-clicking an archive in Finder) ────
  useEffect(() => {
    console.log("🎯 Setting up file-open event listener...");

    const unlisten = listen("file-open", (event) => {
      console.log("=== 📂 FILE-OPEN EVENT RECEIVED ===");
      console.log("Full event object:", event);
      console.log("Event type:", typeof event);
      console.log("Event payload:", event.payload);
      console.log("Payload type:", typeof event.payload);

      // Try to extract path from different possible formats
      let path = null;
      if (typeof event === "string") {
        path = event;
      } else if (event && event.payload) {
        path = event.payload;
      } else if (event && event.detail) {
        path = event.detail;
      } else if (typeof event === "object") {
        // Try to find path in event object
        path = event.path || event.detail || event.payload;
      }

      console.log("Extracted path:", path);
      console.log("Path type:", typeof path);
      console.log("Path length:", path?.length);

      if (typeof path === "string" && path.length > 0) {
        console.log("✅ Valid path received:", path);
        console.log("Is archive file:", isArchiveFile(path));

        // Use refs to access latest functions
        const currentAddTab = addTabRef.current;
        const currentLoadArchiveContents = loadArchiveContentsRef.current;
        const currentLoadDirectory = loadDirectoryRef.current;

        if (!currentAddTab || !currentLoadArchiveContents || !currentLoadDirectory) {
          console.error("Required functions not available");
          return;
        }

        // Create a new tab for the opened file
        if (isArchiveFile(path)) {
          console.log("📦 Creating new tab for archive:", path);

          // Get filename for tab title
          const pathParts = path.split("/").filter(Boolean);
          const fileName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : path;

          const newTabId = currentAddTab({
            title: fileName,
            type: "archive",
            currentArchive: path,
            archivePath: "",
            currentPath: "",
            files: [],
            selectedFiles: [],
            searchQuery: "",
            isLoading: true,
            error: null,
          });

          // Load archive contents for the new tab
          currentLoadArchiveContents(path, "", newTabId);
        } else {
          console.log("📁 Creating new tab for directory:", path);

          // Get directory name for tab title
          const pathParts = path.split("/").filter(Boolean);
          const dirName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : path;

          const newTabId = currentAddTab({
            title: dirName,
            type: "filesystem",
            currentPath: path,
            currentArchive: "",
            archivePath: "",
            files: [],
            selectedFiles: [],
            searchQuery: "",
            isLoading: true,
            error: null,
          });

          // Load directory for the new tab
          currentLoadDirectory(path, newTabId);
        }
      } else {
        console.log("❌ Invalid path received");
        console.log("Path:", path);
        console.log("Type:", typeof path);
        console.log("Length:", path?.length);
      }
    });

    console.log("✅ File-open listener set up successfully");

    return () => {
      console.log("Cleaning up file-open listener");
      unlisten.then((fn) => fn());
    };
  }, []); // Empty dependency array - listener only created once

  // ── Breadcrumb navigation helpers ──────────────────────────────────────────
  /**
   * Split the filesystem path into parts usable by the breadcrumb.
   * e.g.  "/Users/name/Downloads"  →  ["", "Users", "name", "Downloads"]
   */
  const fsBreadcrumbParts = currentTab?.currentPath ? currentTab.currentPath.split("/") : [];

  /**
   * Split the archive-internal path into parts.
   * e.g.  "folder/subfolder/"  →  ["folder", "subfolder"]
   */
  const archiveBreadcrumbParts = currentTab?.archivePath
    ? currentTab.archivePath.split("/").filter(Boolean)
    : [];

  /**
   * Called by breadcrumb when a filesystem segment is clicked.
   * Navigates to that path and exits archive mode.
   */
  const onNavigateFsSegment = (segmentIndex) => {
    if (!currentTab) return;
    const path = fsBreadcrumbParts.slice(0, segmentIndex + 1).join("/") || "/";
    loadDirectory(path, currentTab.id);
    updateTab(currentTab.id, { searchQuery: "" });
  };

  /**
   * Called by breadcrumb when the archive root (the archive filename) is clicked.
   */
  const onNavigateArchiveRoot = () => {
    if (!currentTab) return;
    loadArchiveContents(currentTab.currentArchive, "", currentTab.id);
    updateTab(currentTab.id, { searchQuery: "" });
  };

  /**
   * Called by breadcrumb when an archive-internal segment is clicked.
   * Rebuilds the internal path up to (and including) that segment.
   */
  const onNavigateArchiveSegment = (segmentIndex) => {
    if (!currentTab) return;
    // e.g. parts = ["folder", "sub"], segmentIndex = 0  →  "folder/"
    const parts = archiveBreadcrumbParts.slice(0, segmentIndex + 1);
    const internalPath = parts.join("/") + "/";
    navigateInArchive(internalPath, currentTab.id);
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
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    Rusty Compress
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-100">
                    Archive Manager
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 text-white/80 text-xs sm:text-sm">
                <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono backdrop-blur-sm">
                  ⌘T
                </kbd>
                <span>New Tab</span>
                <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono backdrop-blur-sm">
                  ⌘W
                </kbd>
                <span>Close Tab</span>
                <kbd className="px-2 py-1 bg-white/20 rounded text-xs font-mono backdrop-blur-sm">
                  ⌘1-9
                </kbd>
                <span>Switch Tabs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        {currentTab && (
          <div className="shrink-0">
            <TabBar />
          </div>
        )}

        {/* Main Container */}
        {currentTab && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="shrink-0">
              <Toolbar
                onExtract={() => extractSelectedFiles(currentTab.id)}
                onExtractHere={() => extractHere(currentTab.id)}
                onOpen={() => openSelected(currentTab.id)}
                onChecksum={() => showChecksum(currentTab.id)}
                onCreateArchive={() => openCreateArchiveModal(currentTab.id)}
                onSelectAll={() => selectAll(currentTab.id)}
                onDeselectAll={() => deselectAll(currentTab.id)}
                selectedCount={currentTab.selectedFiles.length}
                totalCount={currentTab.files.length}
                isInArchive={!!currentTab.currentArchive}
                hasArchivePath={!!currentTab.currentArchive}
                disabled={currentTab.isLoading}
                onSearchChange={(query) => updateTab(currentTab.id, { searchQuery: query })}
                searchQuery={currentTab.searchQuery}
              />
            </div>

            {/* Breadcrumb */}
            <div className="shrink-0">
              <Breadcrumb
                fsBreadcrumbParts={fsBreadcrumbParts}
                currentArchive={currentTab.currentArchive}
                archiveBreadcrumbParts={archiveBreadcrumbParts}
                onNavigateFsSegment={onNavigateFsSegment}
                onNavigateArchiveRoot={onNavigateArchiveRoot}
                onNavigateArchiveSegment={onNavigateArchiveSegment}
              />
            </div>

            {/* Error Display */}
            {currentTab.error && (
              <div className="mx-4 my-4 p-3 sm:p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl flex items-start gap-2 sm:gap-3 shadow-sm animate-pulse shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-alert-line text-base sm:text-lg text-red-600"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold text-red-800 mb-1">
                    Error
                  </h3>
                  <p className="text-xs sm:text-sm text-red-700 break-words">
                    {currentTab.error}
                  </p>
                </div>
                <button
                  onClick={() => updateTab(currentTab.id, { error: null })}
                  className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-100 rounded flex-shrink-0"
                  title="Dismiss"
                >
                  <i className="ri-close-line text-base sm:text-xl"></i>
                </button>
              </div>
            )}

            {/* Loading Spinner */}
            {currentTab.isLoading && (
              <div className="flex items-center justify-center py-10 sm:py-20 bg-gradient-to-b from-gray-50 to-white flex-1">
                <div className="text-center">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <i className="ri-refresh-line text-xl sm:text-2xl text-white animate-spin"></i>
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium text-base sm:text-lg">
                    Loading files...
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Please wait a moment
                  </p>
                </div>
              </div>
            )}

            {/* File List */}
            {!currentTab.isLoading && (
              <div key={currentTab.id} className="flex-1 overflow-hidden">
                <FileList
                  files={filteredFiles}
                  onOpenFile={(file) => onOpenFile(file, currentTab.id)}
                  selectedFiles={currentTab.selectedFiles}
                  onSelect={(file) => selectFile(file, currentTab.id)}
                  isLoading={currentTab.isLoading}
                  currentArchive={currentTab.currentArchive}
                  onShowProperties={showProperties}
                  onCreateArchive={() => openCreateArchiveModal(currentTab.id)}
                />
              </div>
            )}

            {/* Status Bar */}
            {currentTab.files.length > 0 && (
              <div className="shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-blue-200 px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <i className="ri-file-list-3-line text-gray-500 text-sm sm:text-base"></i>
                    <span className="text-gray-700 font-medium text-xs sm:text-sm">
                      {currentTab.searchQuery
                        ? `${filteredFiles.length} of ${currentTab.files.length}`
                        : `${currentTab.files.length}`}{" "}
                      items
                    </span>
                  </div>
                  {currentTab.selectedFiles.length > 0 && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <i className="ri-checkbox-circle-line text-blue-500 text-sm sm:text-base"></i>
                        <span className="text-blue-700 font-medium text-xs sm:text-sm">
                          {currentTab.selectedFiles.length} selected
                        </span>
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
                    <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">
                      Enter
                    </kbd>
                    <span>to open</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">
                      Esc
                    </kbd>
                    <span>deselect</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">
                      ⌘N
                    </kbd>
                    <span>create archive</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
          currentArchive={currentTab?.currentArchive || ""}
          onClose={() => setPropertiesFile(null)}
        />
      )}

      {/* Create Archive Modal */}
      {showCreateArchiveModal && currentTab && (
        <CreateArchiveModal
          selectedFiles={currentTab.selectedFiles.map((f) => f.path)}
          currentPath={currentTab.currentPath}
          onClose={() => setShowCreateArchiveModal(false)}
          onSuccess={handleArchiveCreated}
        />
      )}

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
        isLoading={false}
      />
    </div>
  );
};

export default FileManager;

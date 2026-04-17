import React, { useState } from "react";

function Toolbar({
  onExtract,
  onView,
  onOpen,
  onChecksum,
  onCreateArchive,
  onSelectAll,
  onDeselectAll,
  selectedCount = 0,
  totalCount = 0,
  isInArchive = false,
  hasArchivePath = false,
  disabled = false,
  onSearchChange,
  searchQuery = "",
}) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const hasSelection = selectedCount > 0;
  const hasSingleSelection = selectedCount === 1;
  const canExtract = isInArchive && hasSelection && !disabled;
  const canView = isInArchive && hasSingleSelection && !disabled;
  const canOpen = hasSingleSelection && !disabled;
  const canChecksum = hasArchivePath && !disabled;
  const canCreateArchive = hasSelection && !isInArchive && !disabled;
  const canSelectAll = totalCount > 0 && !allSelected && !disabled;
  const canDeselectAll = hasSelection && !disabled;
  const hasSearch = searchQuery && searchQuery.trim().length > 0;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-3 sm:px-4 py-2 sm:py-3 shadow-lg">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side - File Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Open Button */}
          <button
            onClick={onOpen}
            disabled={!canOpen}
            title={
              !hasSingleSelection
                ? "Select a single file or folder to open"
                : "Open selected item (Enter)"
            }
            className={`
              relative group flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
              transition-all duration-200
              ${canOpen
                ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                : "bg-white/10 text-white/50 cursor-not-allowed"
              }
            `}
          >
            <div className="flex flex-col items-center">
              <i className="ri-arrow-right-s-line text-lg sm:text-xl"></i>
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium">Open</span>
            </div>
            {hasSingleSelection && (
              <kbd className="absolute -top-1 -right-1 px-1 py-0.5 bg-white/30 text-white text-[9px] font-bold rounded shadow-sm">↵</kbd>
            )}
          </button>

          {/* Extract Button */}
          <button
            onClick={onExtract}
            disabled={!canExtract}
            title={
              !isInArchive
                ? "Available only when browsing archives"
                : !hasSelection
                  ? "Select files to extract"
                  : "Extract selected files"
            }
            className={`
              relative group flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
              transition-all duration-200
              ${canExtract
                ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                : "bg-white/10 text-white/50 cursor-not-allowed"
              }
            `}
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                <i className="ri-file-zip-fill text-lg sm:text-xl"></i>
                {hasSelection && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.5 bg-white text-blue-600 text-[9px] font-bold rounded-full shadow-sm min-w-[14px] text-center">
                    {selectedCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium">Extract</span>
            </div>
          </button>

          {/* View Button */}
          <button
            onClick={onView}
            disabled={!canView}
            title={
              !isInArchive
                ? "Available only when browsing archives"
                : selectedCount !== 1
                  ? "Select exactly one file to view"
                  : "View file in default application"
            }
            className={`
              relative group flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
              transition-all duration-200
              ${canView
                ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                : "bg-white/10 text-white/50 cursor-not-allowed"
              }
            `}
          >
            <div className="flex flex-col items-center">
              <i className="ri-eye-fill text-lg sm:text-xl"></i>
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium">View</span>
            </div>
          </button>

          {/* Checksum Button */}
          <button
            onClick={onChecksum}
            disabled={!canChecksum}
            title={
              !hasArchivePath
                ? "Open an archive file to compute checksum"
                : "Compute checksum for this archive"
            }
            className={`
              relative group flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
              transition-all duration-200
              ${canChecksum
                ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                : "bg-white/10 text-white/50 cursor-not-allowed"
              }
            `}
          >
            <div className="flex flex-col items-center">
              <i className="ri-shield-check-fill text-lg sm:text-xl"></i>
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium">Checksum</span>
            </div>
          </button>

          {/* Create Archive Button */}
          <button
            onClick={onCreateArchive}
            disabled={!canCreateArchive}
            title={
              !hasSelection
                ? "Select files to create archive"
                : isInArchive
                  ? "Cannot create archive from archive contents"
                  : "Create archive from selected files (⌘N)"
            }
            className={`
              relative group flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
              transition-all duration-200
              ${canCreateArchive
                ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                : "bg-white/10 text-white/50 cursor-not-allowed"
              }
            `}
          >
            <div className="flex flex-col items-center">
              <div className="relative">
                <i className="ri-archive-2-fill text-lg sm:text-xl"></i>
                {hasSelection && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.5 bg-white text-purple-600 text-[9px] font-bold rounded-full shadow-sm min-w-[14px] text-center">
                    {selectedCount}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium">Archive</span>
            </div>
          </button>

        </div>

        {/* Middle - Search Box */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <i className="ri-search-line text-white/60 text-sm sm:text-base group-hover:text-white transition-colors"></i>
            </div>
            <input
              type="text"
              placeholder="Search files..."
              value={localSearchQuery}
              onChange={(e) => {
                const newValue = e.target.value;
                setLocalSearchQuery(newValue);
                onSearchChange && onSearchChange(newValue);
              }}
              className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all backdrop-blur-sm"
            />
            {hasSearch && (
              <button
                onClick={() => {
                  setLocalSearchQuery("");
                  onSearchChange && onSearchChange("");
                }}
                className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-white/60 hover:text-white hover:bg-white/10 rounded-full px-1.5 py-1 m-1 transition-all"
                title="Clear search"
              >
                <i className="ri-close-line text-sm sm:text-base"></i>
              </button>
            )}
          </div>
        </div>

        {/* Right Side - Selection Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!hasSelection ? (
            <button
              onClick={onSelectAll}
              disabled={!canSelectAll}
              title={
                allSelected
                  ? "All files already selected"
                  : totalCount === 0
                    ? "No files to select"
                    : "Select all files"
              }
              className={`
                relative group flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
                transition-all duration-200
                ${canSelectAll
                  ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
                }
              `}
            >
              <div className="flex flex-col items-center">
                <i className={`ri-checkbox-multiple-line text-lg sm:text-xl ${canSelectAll ? 'group-hover:scale-110' : ''} transition-transform duration-200`}></i>
                <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium">Select All</span>
              </div>
            </button>
          ) : (
            <button
              onClick={onDeselectAll}
              disabled={!canDeselectAll}
              title="Clear selection"
              className={`
                relative group flex items-center justify-center px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg
                transition-all duration-200
                ${canDeselectAll
                  ? "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
                }
              `}
            >
              <div className="flex flex-col items-center">
                <i className="ri-close-circle-line text-lg sm:text-xl"></i>
                <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium">Clear</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;

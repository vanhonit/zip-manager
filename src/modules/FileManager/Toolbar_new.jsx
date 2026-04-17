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
    <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-200">
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
              relative group flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl font-medium text-xs sm:text-sm
              transition-all duration-300 ease-out
              \${canOpen
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              }
            `}
          >
            <div className="relative">
              <i className="ri-arrow-right-s-line text-lg sm:text-xl text-emerald-500"></i>
              {hasSingleSelection && (
                <kbd className="absolute -top-1 -right-2 px-1 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-sm">↵</kbd>
              )}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 font-medium leading-tight">Open</span>
            {canOpen && (
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
              relative group flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl font-medium text-xs sm:text-sm
              transition-all duration-300 ease-out
              \${canExtract
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              }
            `}
          >
            <div className="relative">
              <i className="ri-file-zip-fill text-lg sm:text-xl text-blue-500"></i>
              {hasSelection && (
                <span className="absolute -top-1 -right-2 px-1 py-0.5 bg-white text-blue-600 text-[10px] font-bold rounded-full shadow-sm min-w-[16px] text-center">
                  {selectedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 font-medium leading-tight">Extract</span>
            {canExtract && (
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
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
              relative group flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl font-medium text-xs sm:text-sm
              transition-all duration-300 ease-out
              \${canView
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              }
            `}
          >
            <div className="relative">
              <i className="ri-eye-fill text-lg sm:text-xl text-indigo-500"></i>
              </div>
            <span className="text-[10px] sm:text-xs mt-1 font-medium leading-tight">View</span>
            {canView && (
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
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
              relative group flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl font-medium text-xs sm:text-sm
              transition-all duration-300 ease-out
              \${canChecksum
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 hover:shadow-lg hover:shadow-amber-200 hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              }
            `}
          >
            <div className="relative">
              <i className="ri-shield-check-fill text-lg sm:text-xl text-amber-500"></i>
              </div>
            <span className="text-[10px] sm:text-xs mt-1 font-medium leading-tight">Checksum</span>
            {canChecksum && (
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
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
              relative group flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl font-medium text-xs sm:text-sm
              transition-all duration-300 ease-out
              \${canCreateArchive
                  ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              }
            `}
          >
            <div className="relative">
              <i className="ri-archive-2-fill text-2xl sm:text-2xl text-purple-500"></i>
              {hasSelection && (
                <span className="absolute -top-1 -right-2 px-1 py-0.5 bg-white text-purple-600 text-[10px] font-bold rounded-full shadow-sm min-w-[16px] text-center">
                  {selectedCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 font-medium leading-tight">Archive</span>
            {canCreateArchive && (
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>

        </div>

        {/* Right Side - Selection Controls */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
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
                relative group flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl font-medium text-xs sm:text-sm
                transition-all duration-300 ease-out
                ${canSelectAll
                  ? "border-blue-200 text-blue-700 bg-white hover:bg-blue-50 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                }
              }
            `}
          >
              <i className={`ri-checkbox-multiple-line text-lg sm:text-xl ${canSelectAll ? 'group-hover:scale-110' : ''} transition-transform duration-200`}></i>
              <span className="text-[10px] sm:text-xs mt-1 font-medium leading-tight">Select All</span>
            </button>
          ) : (
            <button
              onClick={onDeselectAll}
              disabled={!canDeselectAll}
              title="Clear selection"
              className={`
                relative group flex flex-col items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-xl font-medium text-xs sm:text-sm
                transition-all duration-300 ease-out
                ${canDeselectAll
                  ? "border-red-200 text-red-700 bg-white hover:bg-red-50 hover:border-red-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
                }
              }
            `}
          >
              <i className="ri-close-circle-line text-lg sm:text-xl"></i>
              <span className="text-[10px] sm:text-xs mt-1 font-medium leading-tight">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Row */}
      <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
            <i className="ri-search-line text-gray-400 text-sm sm:text-base"></i>
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
            className={`
              w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 rounded-xl border-2 text-xs sm:text-sm
              transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-offset-1
              ${
                  hasSearch
                    ? 'border-blue-300 bg-blue-50/50 focus:border-blue-500 focus:ring-blue-200'
                    : 'border-gray-200 bg-white focus:border-blue-400 focus:ring-blue-100'
                }
              `}
            />
            {hasSearch && (
              <button
                onClick={() => {
                  setLocalSearchQuery("");
                  onSearchChange && onSearchChange("");
                }}
                className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <i className="ri-close-line text-sm sm:text-base"></i>
              </button>
            )}
          </div>
        </div>
      </div>
  );
};

export default Toolbar;

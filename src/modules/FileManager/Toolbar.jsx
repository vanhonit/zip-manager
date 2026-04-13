import React from "react";

function Toolbar({
  onExtract,
  onView,
  onChecksum,
  onSelectAll,
  onDeselectAll,
  selectedCount = 0,
  totalCount = 0,
  isInArchive = false,
  hasArchivePath = false,
  disabled = false,
}) {
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const hasSelection = selectedCount > 0;
  const canExtract = isInArchive && hasSelection && !disabled;
  const canView = isInArchive && selectedCount === 1 && !disabled;
  const canChecksum = hasArchivePath && !disabled;
  const canSelectAll = totalCount > 0 && !allSelected && !disabled;
  const canDeselectAll = hasSelection && !disabled;

  return (
    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side - File Actions */}
        <div className="flex items-center gap-2">
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
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
              transition-all duration-200 shadow-sm
              ${
                canExtract
                  ? "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md active:scale-95 active:shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <i className="ri-upload-cloud-line"></i>
            <span>Extract</span>
            {hasSelection && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {selectedCount}
              </span>
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
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
              transition-all duration-200 shadow-sm
              ${
                canView
                  ? "bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-md active:scale-95 active:shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <i className="ri-eye-line"></i>
            <span>View</span>
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
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
              transition-all duration-200 shadow-sm
              ${
                canChecksum
                  ? "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md active:scale-95 active:shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <i className="ri-shield-check-line"></i>
            <span>Checksum</span>
          </button>
        </div>

        {/* Right Side - Selection Info + Toggle Action */}
        <div className="flex items-center gap-2">
          {/* Selection Info */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <i className="ri-file-line text-gray-500"></i>
              <span className="text-sm font-medium text-gray-700">
                {hasSelection ? (
                  <>
                    <span className="text-blue-600 font-semibold">
                      {selectedCount}
                    </span>{" "}
                    / {totalCount}
                  </>
                ) : (
                  <>{totalCount} items</>
                )}
              </span>
            </div>
          )}

          {/* Select All / Clear — mutually exclusive */}
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
                flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
                transition-all duration-200 border-2
                ${
                  canSelectAll
                    ? "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 active:scale-95"
                    : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                }
              `}
            >
              <i className="ri-checkbox-line"></i>
              <span>Select All</span>
            </button>
          ) : (
            <button
              onClick={onDeselectAll}
              disabled={!canDeselectAll}
              title="Clear selection"
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
                transition-all duration-200 border-2
                ${
                  canDeselectAll
                    ? "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 active:scale-95"
                    : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                }
              `}
            >
              <i className="ri-close-line"></i>
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;

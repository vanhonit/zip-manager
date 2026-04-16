import React from "react";

/**
 * Breadcrumb component that renders:
 *   [filesystem path segments]  /  [archive filename]  /  [archive-internal path segments]
 *
 * Props:
 *   fsBreadcrumbParts        string[]  – filesystem path split by "/"
 *   currentArchive           string    – absolute path to the open archive file (empty if none)
 *   archiveBreadcrumbParts   string[]  – archive-internal path split by "/" with empties removed
 *   onNavigateFsSegment      (index: number) => void
 *   onNavigateArchiveRoot    () => void
 *   onNavigateArchiveSegment (index: number) => void
 */
const Breadcrumb = ({
  fsBreadcrumbParts = [],
  currentArchive = "",
  archiveBreadcrumbParts = [],
  onNavigateFsSegment,
  onNavigateArchiveRoot,
  onNavigateArchiveSegment,
}) => {
  const archiveFileName = currentArchive
    ? (currentArchive.split("/").filter(Boolean).pop() ?? currentArchive)
    : "";

  const isInsideArchive = Boolean(currentArchive);

  return (
    <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-4 bg-gradient-to-r from-white to-blue-50 border-b border-blue-100">
      <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
        {/* ── Filesystem segments ─────────────────────────────────────────── */}
        {fsBreadcrumbParts.map((segment, index) => {
          const isLast =
            index === fsBreadcrumbParts.length - 1 && !isInsideArchive;
          const displayLabel = segment === "" && index === 0 ? "/" : segment;
          const isRoot = segment === "" && index === 0;

          return (
            <React.Fragment key={`fs-${index}`}>
              {index > 0 && <Separator />}
              {isLast ? (
                <span className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 font-bold text-gray-900 shadow-md">
                  {isRoot && <i className="ri-home-line text-blue-600 text-sm sm:text-base"></i>}
                  <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] text-xs sm:text-sm">{displayLabel}</span>
                </span>
              ) : (
                <button
                  onClick={() => onNavigateFsSegment?.(index)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md hover:-translate-y-px active:translate-y-0 font-semibold group"
                  title={displayLabel}
                >
                  {isRoot && (
                    <i className="ri-home-line group-hover:scale-110 transition-transform duration-200 text-sm sm:text-base"></i>
                  )}
                  <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] text-xs sm:text-sm group-hover:underline">
                    {displayLabel}
                  </span>
                </button>
              )}
            </React.Fragment>
          );
        })}

        {/* ── Archive file name ────────────────────────────────────────────── */}
        {isInsideArchive && (
          <React.Fragment>
            {fsBreadcrumbParts.length > 0 && <Separator />}
            {archiveBreadcrumbParts.length === 0 ? (
              /* We are at the archive root — not clickable (already here) */
              <span
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-200 via-purple-200 to-indigo-200 border-2 border-indigo-400 font-bold text-gray-900 shadow-lg"
                title={currentArchive}
              >
                <i className="ri-archive-2-line text-indigo-600 text-sm sm:text-base"></i>
                <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] text-xs sm:text-sm">
                  {archiveFileName}
                </span>
              </span>
            ) : (
              <button
                onClick={() => onNavigateArchiveRoot?.()}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 rounded-xl bg-indigo-100 border-2 border-indigo-300 text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-400 transition-all duration-300 hover:shadow-md hover:-translate-y-px active:translate-y-0 font-semibold group"
                title={currentArchive}
              >
                <i className="ri-archive-2-line text-indigo-600 group-hover:scale-110 transition-transform duration-200 text-sm sm:text-base"></i>
                <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] text-xs sm:text-sm group-hover:underline">
                  {archiveFileName}
                </span>
              </button>
            )}
          </React.Fragment>
        )}

        {/* ── Archive-internal path segments ──────────────────────────────── */}
        {isInsideArchive &&
          archiveBreadcrumbParts.map((segment, index) => {
            const isLast = index === archiveBreadcrumbParts.length - 1;

            return (
              <React.Fragment key={`arc-${index}`}>
                <Separator />
                {isLast ? (
                  <span
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 font-bold text-gray-900 shadow-md"
                    title={segment}
                  >
                    <i className="ri-folder-line text-blue-600 text-sm sm:text-base"></i>
                    <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] text-xs sm:text-sm">{segment}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigateArchiveSegment?.(index)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2.5 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md hover:-translate-y-px active:translate-y-0 font-semibold group"
                    title={segment}
                  >
                    <i className="ri-folder-line text-blue-500 group-hover:scale-110 transition-transform duration-200 text-sm sm:text-base"></i>
                    <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px] text-xs sm:text-sm group-hover:underline">
                      {segment}
                    </span>
                  </button>
                )}
              </React.Fragment>
            );
          })}
      </nav>
    </div>
  );
};

/* ── Small helpers ─────────────────────────────────────────────────────────── */

const Separator = () => (
  <i className="ri-arrow-right-s-line text-blue-300 flex-shrink-0 text-lg hover:text-blue-400 transition-colors"></i>
);

export default Breadcrumb;

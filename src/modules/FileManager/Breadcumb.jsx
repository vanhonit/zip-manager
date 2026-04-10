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
    <div className="px-6 py-4 bg-white border-b border-gray-200">
      <nav className="flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
                <span className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 font-semibold text-gray-900 shadow-sm">
                  {isRoot && <i className="ri-home-line text-blue-600"></i>}
                  <span className="truncate max-w-[200px]">{displayLabel}</span>
                </span>
              ) : (
                <button
                  onClick={() => onNavigateFsSegment?.(index)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:shadow-md active:scale-95 font-medium group"
                  title={displayLabel}
                >
                  {isRoot && (
                    <i className="ri-home-line group-hover:scale-110 transition-transform duration-200"></i>
                  )}
                  <span className="truncate max-w-[200px] group-hover:underline">
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 border-2 border-indigo-300 font-semibold text-gray-900 shadow-md"
                title={currentArchive}
              >
                <i className="ri-archive-2-line text-indigo-600"></i>
                <span className="truncate max-w-[200px]">
                  {archiveFileName}
                </span>
              </span>
            ) : (
              <button
                onClick={() => onNavigateArchiveRoot?.()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200 hover:shadow-md active:scale-95 font-medium group"
                title={currentArchive}
              >
                <i className="ri-archive-2-line text-indigo-600 group-hover:scale-110 transition-transform duration-200"></i>
                <span className="truncate max-w-[200px] group-hover:underline">
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 font-semibold text-gray-900 shadow-sm"
                    title={segment}
                  >
                    <i className="ri-folder-line text-blue-600"></i>
                    <span className="truncate max-w-[200px]">{segment}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigateArchiveSegment?.(index)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:shadow-md active:scale-95 font-medium group"
                    title={segment}
                  >
                    <i className="ri-folder-line text-blue-500 group-hover:scale-110 transition-transform duration-200"></i>
                    <span className="truncate max-w-[200px] group-hover:underline">
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
  <i className="ri-arrow-right-s-line text-gray-300 flex-shrink-0"></i>
);

export default Breadcrumb;

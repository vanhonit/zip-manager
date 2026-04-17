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
    <div className="px-4 py-3 bg-white border-b border-gray-200">
      <nav className="flex items-center gap-1.5 overflow-x-auto">
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
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-900 font-medium text-sm">
                  {isRoot && <i className="ri-home-line text-gray-500"></i>}
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{displayLabel}</span>
                </span>
              ) : (
                <button
                  onClick={() => onNavigateFsSegment?.(index)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors text-sm"
                  title={displayLabel}
                >
                  {isRoot && <i className="ri-home-line text-gray-500"></i>}
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-900 font-medium text-sm"
                title={currentArchive}
              >
                <i className="ri-archive-2-line text-indigo-600"></i>
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
                  {archiveFileName}
                </span>
              </span>
            ) : (
              <button
                onClick={() => onNavigateArchiveRoot?.()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 transition-colors text-sm"
                title={currentArchive}
              >
                <i className="ri-archive-2-line"></i>
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-900 font-medium text-sm"
                    title={segment}
                  >
                    <i className="ri-folder-line text-blue-600"></i>
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">{segment}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigateArchiveSegment?.(index)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-colors text-sm"
                    title={segment}
                  >
                    <i className="ri-folder-line"></i>
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">
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
  <i className="ri-arrow-right-s-line text-gray-400 flex-shrink-0"></i>
);

export default Breadcrumb;

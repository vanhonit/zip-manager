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
    <div className="py-2 px-4 bg-white border-b mt-2 rounded-lg overflow-x-auto">
      <nav className="text-sm text-gray-600 flex items-center flex-wrap gap-y-1 min-w-0">
        {/* ── Filesystem segments ─────────────────────────────────────────── */}
        {fsBreadcrumbParts.map((segment, index) => {
          const isLast =
            index === fsBreadcrumbParts.length - 1 && !isInsideArchive;
          const displayLabel = segment === "" && index === 0 ? "/" : segment;

          return (
            <React.Fragment key={`fs-${index}`}>
              {index > 0 && <Separator />}
              {isLast ? (
                <span className="font-semibold text-gray-800 truncate max-w-[160px]">
                  {displayLabel}
                </span>
              ) : (
                <button
                  onClick={() => onNavigateFsSegment?.(index)}
                  className="text-blue-500 hover:underline truncate max-w-[160px]"
                  title={displayLabel}
                >
                  {displayLabel}
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
                className="font-semibold text-gray-800 truncate max-w-[160px] flex items-center gap-1"
                title={currentArchive}
              >
                <ArchiveIcon />
                {archiveFileName}
              </span>
            ) : (
              <button
                onClick={() => onNavigateArchiveRoot?.()}
                className="text-blue-500 hover:underline truncate max-w-[160px] flex items-center gap-1"
                title={currentArchive}
              >
                <ArchiveIcon />
                {archiveFileName}
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
                    className="font-semibold text-gray-800 truncate max-w-[160px]"
                    title={segment}
                  >
                    {segment}
                  </span>
                ) : (
                  <button
                    onClick={() => onNavigateArchiveSegment?.(index)}
                    className="text-blue-500 hover:underline truncate max-w-[160px]"
                    title={segment}
                  >
                    {segment}
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
  <span className="text-gray-400 select-none mx-1">/</span>
);

const ArchiveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="inline-block w-4 h-4 shrink-0"
  >
    <path d="M8.25 9a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" />
    <path
      fillRule="evenodd"
      d="M3 4.5A1.5 1.5 0 0 1 4.5 3h15A1.5 1.5 0 0 1 21 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-15Zm1.5 0v15h15v-15h-15Z"
      clipRule="evenodd"
    />
  </svg>
);

export default Breadcrumb;

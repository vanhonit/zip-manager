import React from 'react';

/**
 * Individual Tab Component
 * Displays a single tab with title, icon, and close button
 */
const Tab = ({
  id,
  title,
  type,
  isActive,
  onClick,
  onClose,
  canClose = true,
}) => {
  /**
   * Determine the icon based on tab type
   */
  const getTabIcon = () => {
    if (type === 'archive') {
      return 'ri-file-zip-line';
    }
    return 'ri-folder-3-line';
  };

  /**
   * Handle close button click
   * Stop propagation to prevent tab switch
   */
  const handleClose = (e) => {
    e.stopPropagation();
    if (onClose && canClose) {
      onClose(id);
    }
  };

  /**
   * Handle tab click
   */
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <div
      className={`
        tab-item relative flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none min-w-[140px] max-w-[220px] group
        ${isActive
          ? 'tab-item-active bg-gradient-to-b from-white to-blue-50 text-blue-700 shadow-md z-10 border-b-2 border-blue-500'
          : 'tab-item-inactive bg-gradient-to-b from-slate-50 to-slate-100 text-slate-600 hover:bg-gradient-to-b hover:from-slate-100 hover:to-slate-200 hover:text-slate-800 border-b-2 border-transparent'
        }
      `}
      onClick={handleClick}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
    >
      {/* Tab Icon */}
      <i className={`${getTabIcon()} text-sm flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-700'}`}></i>

      {/* Tab Title */}
      <span className="flex-1 truncate text-sm font-medium">
        {title}
      </span>

      {/* Close Button */}
      {canClose && (
        <button
          className={`
            tab-close flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100
            ${isActive
              ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
              : 'text-slate-400 hover:text-red-500 hover:bg-red-100'
            }
          `}
          onClick={handleClose}
          aria-label="Close tab"
          title="Close tab (⌘W)"
        >
          <i className="ri-close-line text-sm"></i>
        </button>
      )}
    </div>
  );
};

export default Tab;
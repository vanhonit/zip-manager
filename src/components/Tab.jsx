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
        tab-item flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-all select-none min-w-[120px] max-w-[200px]
        ${isActive
          ? 'tab-item-active bg-white border-t-2 border-blue-500 text-blue-600'
          : 'tab-item-inactive text-gray-600 hover:bg-gray-100'
        }
      `}
      onClick={handleClick}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
    >
      {/* Tab Icon */}
      <i className={`${getTabIcon()} text-sm flex-shrink-0`}></i>

      {/* Tab Title */}
      <span className="flex-1 truncate text-sm font-medium">
        {title}
      </span>

      {/* Close Button */}
      {canClose && (
        <button
          className={`
            tab-close flex-shrink-0 p-1 rounded transition-all duration-200
            ${isActive
              ? 'text-gray-500 hover:text-red-600 hover:bg-red-100'
              : 'text-gray-500 hover:text-red-600 hover:bg-red-100'
            }
          `}
          onClick={handleClose}
          aria-label="Close tab"
          title="Close tab (⌘W)"
        >
          <i className="ri-close-line text-base"></i>
        </button>
      )}
    </div>
  );
};

export default Tab;
import React from 'react';

const Breadcrumb = ({ currentPath, currentArchive, onSelectFile, onNavigate }) => {
    return (
        <div className="py-2 px-4 bg-white border-b mt-2 rounded-lg">
            <nav className="text-sm text-gray-600 flex items-center space-x-2">
                {currentArchive && currentArchive.map((folder, index) => ((<>
                    <button
                        onClick={() => index < currentArchive.length - 1 ? onNavigate(currentArchive.slice(0, index + 1).join('/')) : null}
                        className="text-blue-500 hover:underline"
                    >
                        {folder}
                    </button>
                    {index < currentArchive.length - 1 && <span>/</span>}
                    </>
                )))}
                {currentPath.map((folder, index) => (
                    <React.Fragment key={index}>
                        <button
                            onClick={() => onNavigate(currentPath.slice(0, index + 1).join('/'))}
                            className="text-blue-500 hover:underline"
                        >
                            {folder}
                        </button>
                        {index < currentPath.length - 1 && <span>/</span>}
                    </React.Fragment>
                ))}
            </nav>
        </div>
    );
};

export default Breadcrumb;
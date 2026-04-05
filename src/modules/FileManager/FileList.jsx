import React from 'react';
import FileItem from './FileItem';

const FileList = ({ files, selectedFiles, onOpenFile, onSelect }) => {
    return (
        <div className="bg-white shadow rounded-lg mt-4">
            <div className='px-4 py-2 flex border-b'>
                <div className='text-sm text-left text-gray-400 grow'>Name</div>
                <div className='text-sm text-gray-400 w-32'>Date Modified</div>
                <div className='text-sm text-gray-400 w-28 px-2'>Type</div>
                <div className='text-sm text-center text-gray-400 w-28'>Size</div>
            </div>
            <div
                className="max-h-[400px] overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#a0aec0 #edf2f7' }}
            >
                {files.length ? (
                    files.map((file, index) => (
                        <FileItem
                            key={index}
                            file={file}
                            selected={selectedFiles.some(selectedFile => selectedFile.path === file.path)}
                            onOpenFile={onOpenFile}
                            onSelect={onSelect}
                        />
                    ))
                ) : (
                    <div className="p-4 text-gray-500 text-center">No files available</div>
                )}
            </div>
        </div>
    );
};

export default FileList;
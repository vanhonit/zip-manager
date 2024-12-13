import React from 'react';
import { resolveMime } from 'friendly-mimes'
import folder from '../../assets/icons/folder.png';
import './fileicon.css';

// A utility function to get the icon for a file type
const FileIcon = ({extension, isDir, ...rest}) => {
    if (isDir) {
        return <img src={folder} width="24"/>; // Replace with an actual icon or SVG
    }
    return <div className="file-icon" data-type={extension}></div>
};

// Extract the file extension
const getFileExtension = (fileName) => {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
};

// Utility to format file size
const formatFileSize = (bytes) => {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const FileItem = ({ file, onSelect }) => {
    const fileExtension = getFileExtension(file.name);
    let applicationName = '';
    try {
        applicationName= file.is_dir ? 'Folder' : resolveMime(file.mimetype).name;
    } catch (error) {
        applicationName = 'Unknown';
    }
    return (
        <div className="flex items-center justify-between px-4 py-2 border-b last:border-none hover:bg-gray-100" onDoubleClick={() => onSelect(file)}>
            {/* File Icon and Details */}
            <div className="flex grow items-center rounded">
                <span className="text-xs pr-1"><FileIcon extension={fileExtension} width={32} height={32} isDir={file.is_dir} /></span>
                <div className="relative group">
                    {/* Truncated File Name */}
                    <p
                        className="text-sm font-medium text-gray-800 truncate max-w-xs"
                        title={file.name}
                    >
                        {file.name}
                    </p>
                    {/* Full File Name Tooltip */}
                    <div className="absolute left-0 hidden mt-1 bg-black text-white text-xs py-1 px-2 rounded shadow-lg group-hover:block">
                        {file.name}
                    </div>
                </div>
            </div>
            <div className='w-32'>
                <p className="text-xs text-gray-500 px-2">{file.last_modified}</p>
            </div>
            <div className='w-28'>
                <p className="text-xs text-gray-500 px-2">{applicationName}</p>
            </div>
            {/* File Size and Actions */}
            <div className="flex justify-center items-center w-28">
                <span className="text-sm text-center text-gray-600">{file.is_dir ? '-' : formatFileSize(file.size)}</span>
            </div>
        </div>
    );
};

export default FileItem;
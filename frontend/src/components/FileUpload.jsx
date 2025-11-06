import { useState, useRef } from 'prop-types';
import PropTypes from 'prop-types';
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

const FileUpload = ({
  accept = '*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  maxFiles = 5,
  multiple = true,
  onFilesSelected,
  onUploadComplete,
  className = '',
}) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const errors = [];

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
    }

    // Check file type if accept is specified
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = `.${file.name.split('.').pop()}`;
      const fileType = file.type;

      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type;
        }
        return fileType.match(new RegExp(type.replace('*', '.*')));
      });

      if (!isAccepted) {
        errors.push('File type not allowed');
      }
    }

    return errors;
  };

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles = fileArray.map((file, index) => {
      const errors = validateFile(file);
      return {
        id: `${Date.now()}-${index}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: errors.length > 0 ? 'error' : 'pending',
        errors,
        preview: null,
      };
    });

    // Generate previews for images
    newFiles.forEach((fileObj) => {
      if (fileObj.type.startsWith('image/') && fileObj.status !== 'error') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id ? { ...f, preview: e.target.result } : f
            )
          );
        };
        reader.readAsDataURL(fileObj.file);
      }
    });

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    if (onFilesSelected) {
      onFilesSelected(updatedFiles.map(f => f.file));
    }

    // Simulate upload
    newFiles.forEach((fileObj) => {
      if (fileObj.status === 'pending') {
        simulateUpload(fileObj.id);
      }
    });
  };

  const simulateUpload = (fileId) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress, status: progress === 100 ? 'complete' : 'uploading' }
            : f
        )
      );

      if (progress >= 100) {
        clearInterval(interval);
        if (onUploadComplete) {
          const file = files.find(f => f.id === fileId);
          onUploadComplete(file);
        }
      }
    }, 200);
  };

  const removeFile = (fileId) => {
    const updatedFiles = files.filter((f) => f.id !== fileId);
    setFiles(updatedFiles);
    if (onFilesSelected) {
      onFilesSelected(updatedFiles.map(f => f.file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <FiCheck className="text-green-500" />;
      case 'error':
        return <FiAlertCircle className="text-red-500" />;
      default:
        return <FiFile className="text-gray-500" />;
    }
  };

  return (
    <div className={className}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        <p className="text-lg font-medium text-gray-700 mb-1">
          {isDragging ? 'Drop files here' : 'Drop files here or click to browse'}
        </p>
        
        <p className="text-sm text-gray-500">
          {accept === '*' ? 'Any file type' : accept} • Max {(maxSize / 1024 / 1024).toFixed(0)}MB per file
        </p>
        
        {multiple && (
          <p className="text-xs text-gray-400 mt-1">
            Up to {maxFiles} files
          </p>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileObj) => (
            <div
              key={fileObj.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              {/* Preview or Icon */}
              <div className="flex-shrink-0">
                {fileObj.preview ? (
                  <img
                    src={fileObj.preview}
                    alt={fileObj.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded">
                    {getStatusIcon(fileObj.status)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileObj.name}
                  </p>
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 ml-2"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-2">
                  {formatFileSize(fileObj.size)}
                </p>

                {/* Progress Bar */}
                {fileObj.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${fileObj.progress}%` }}
                    ></div>
                  </div>
                )}

                {/* Error Messages */}
                {fileObj.status === 'error' && fileObj.errors.length > 0 && (
                  <div className="text-xs text-red-600">
                    {fileObj.errors.join(', ')}
                  </div>
                )}

                {/* Success Message */}
                {fileObj.status === 'complete' && (
                  <div className="text-xs text-green-600 flex items-center gap-1">
                    <FiCheck className="w-3 h-3" />
                    Upload complete
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  accept: PropTypes.string,
  maxSize: PropTypes.number,
  maxFiles: PropTypes.number,
  multiple: PropTypes.bool,
  onFilesSelected: PropTypes.func,
  onUploadComplete: PropTypes.func,
  className: PropTypes.string,
};

export default FileUpload;
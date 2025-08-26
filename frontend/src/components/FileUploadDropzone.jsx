import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';

/**
 * 파일 드래그 앤 드롭 업로드 공통 컴포넌트
 * 다양한 파일 형식을 지원하며 드래그 앤 드롭 및 클릭 업로드 기능 제공
 */
const FileUploadDropzone = ({
  onFilesSelected,
  acceptedFormats = ['.pdf', '.xlsx', '.xls', '.txt'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  multiple = true,
  disabled = false,
  className = '',
  children
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // 지원 파일 형식 매핑
  const formatMapping = {
    '.pdf': 'application/pdf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };

  // 파일 유효성 검사
  const validateFile = (file) => {
    const errors = [];

    // 파일 크기 검사
    if (file.size > maxFileSize) {
      errors.push(`파일 크기는 ${(maxFileSize / 1024 / 1024).toFixed(0)}MB를 초과할 수 없습니다.`);
    }

    // 파일 형식 검사
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidFormat = acceptedFormats.some(format => {
      const mimeType = formatMapping[format];
      return fileExtension === format || (mimeType && file.type === mimeType);
    });

    if (!isValidFormat) {
      errors.push(`지원하지 않는 파일 형식입니다. (${acceptedFormats.join(', ')}만 가능)`);
    }

    return errors;
  };

  // 파일 처리
  const handleFiles = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = [];
    const fileErrors = [];

    fileArray.forEach(file => {
      const errors = validateFile(file);
      if (errors.length > 0) {
        fileErrors.push(`${file.name}: ${errors.join(', ')}`);
      } else {
        validFiles.push(file);
      }
    });

    // 콜백으로 결과 전달
    if (onFilesSelected) {
      onFilesSelected(validFiles, fileErrors);
    }
  };

  // 드래그 이벤트 핸들러
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // 파일 선택 클릭 핸들러
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      // 같은 파일을 다시 선택할 수 있도록 value 초기화
      e.target.value = '';
    }
  };

  // accept 속성 생성
  const acceptTypes = acceptedFormats.map(format => formatMapping[format] || format).join(',');

  return (
    <div className={className}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {children || (
          <>
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${
              dragActive
                ? 'bg-blue-100'
                : disabled 
                  ? 'bg-gray-100'
                  : 'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${
                dragActive 
                  ? 'text-blue-600'
                  : disabled 
                    ? 'text-gray-400' 
                    : 'text-gray-500'
              }`} />
            </div>
            
            <div className="mb-4">
              <p className={`text-lg font-medium mb-2 ${
                disabled 
                  ? 'text-gray-400' 
                  : 'text-gray-900'
              }`}>
                파일을 드래그하여 업로드하거나 클릭하세요
              </p>
              <p className={`text-sm ${
                disabled 
                  ? 'text-gray-400' 
                  : 'text-gray-600'
              }`}>
                지원 형식: {acceptedFormats.join(', ')} (최대 {(maxFileSize / 1024 / 1024).toFixed(0)}MB)
              </p>
            </div>
          </>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptTypes}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default FileUploadDropzone; 
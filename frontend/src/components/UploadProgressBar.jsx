import React from 'react';
import { FileText, File, Table, FileImage } from 'lucide-react';

/**
 * 파일 업로드 진행률 표시 공통 컴포넌트
 * 파일별 진행 상태, 메시지, 진행률을 통일된 UI로 표시
 */
const UploadProgressBar = ({ 
  file, 
  progress = 0, 
  message = '', 
  isCompleted = false, 
  isError = false,
  showPercentage = true,
  className = '' 
}) => {
  // 파일 타입별 아이콘 결정
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'xlsx':
      case 'xls':
        return <Table className="h-4 w-4" />;
      case 'txt':
        return <File className="h-4 w-4" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // 상태별 색상 결정
  const getStatusColors = () => {
    if (isError) {
      return {
        icon: 'text-red-600',
        bg: 'bg-red-50 border-red-200',
        progress: 'bg-red-600',
        text: 'text-red-700'
      };
    }
    
    if (isCompleted) {
      return {
        icon: 'text-green-600',
        bg: 'bg-green-50 border-green-200',
        progress: 'bg-green-600',
        text: 'text-green-700'
      };
    }
    
    return {
      icon: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
      progress: 'bg-blue-600',
      text: 'text-blue-700'
    };
  };

  const colors = getStatusColors();

  return (
    <div className={`p-3 rounded-lg border transition-all duration-300 ${colors.bg} ${className}`}>
      {/* 파일 정보 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <div className={colors.icon}>
          {getFileIcon(file.name)}
        </div>
        <span className="font-medium text-gray-900 truncate">{file.name}</span>
        {file.size && (
          <span className="text-xs text-gray-500 ml-auto">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </span>
        )}
      </div>
      
      {/* 진행 메시지 */}
      {message && (
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${colors.text}`}>
              {message}
            </span>
            {showPercentage && (
              <span className="text-sm text-gray-500">
                {Math.round(progress)}%
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* 진행률 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colors.progress}`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

export default UploadProgressBar; 
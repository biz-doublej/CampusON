import React from 'react';

/**
 * 일반적인 진행률 표시 공통 컴포넌트
 * 진단 테스트, 학습 진행률 등에서 사용
 */
const ProgressBar = ({
  current = 0,
  total = 100,
  percentage = null,
  label = '',
  showPercentage = true,
  showFraction = false,
  height = 'h-3',
  bgColor = 'bg-gray-200',
  progressColor = 'bg-gradient-to-r from-blue-500 to-green-500',
  className = ''
}) => {
  // 진행률 계산
  const calculatedPercentage = percentage !== null 
    ? percentage 
    : total > 0 
      ? Math.round((current / total) * 100) 
      : 0;

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage || showFraction) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          <div className="flex items-center gap-2">
            {showFraction && (
              <span className="text-sm text-gray-600">
                {current}/{total}
              </span>
            )}
            {showPercentage && (
              <span className="text-sm font-medium text-gray-700">
                {calculatedPercentage}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className={`w-full ${bgColor} rounded-full ${height}`}>
        <div 
          className={`${height} rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${Math.min(Math.max(calculatedPercentage, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar; 
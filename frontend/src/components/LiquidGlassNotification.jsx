/**
 * 🌟 Apple Liquid Glass UI 공법 기반 알림 컴포넌트
 * 3개 학과 전용: 물리치료학과, 간호학과, 작업치료학과
 */
import React, { useState, useEffect } from 'react';
import './LiquidGlassNotification.css';

const LiquidGlassNotification = ({ 
  notification, 
  onDismiss, 
  onAction,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // 입장 애니메이션
    setTimeout(() => setIsVisible(true), 100);
    
    // 자동 해제 타이머
    if (notification.timing?.auto_dismiss_seconds) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.timing.auto_dismiss_seconds * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(notification.id), 400);
  };

  const handleAction = (action) => {
    onAction?.(action, notification);
    if (action.action === 'dismiss_notification') {
      handleDismiss();
    }
  };

  const getGlassStyle = () => {
    const theme = notification.visual_style || notification.theme;
    const baseStyle = {
      backdropFilter: `blur(${(theme.blur || 0.5) * 20}px) saturate(1.8)`,
      background: `rgba(255, 255, 255, ${theme.transparency || 0.15})`,
      border: `1px solid rgba(255, 255, 255, ${theme.transparency * 0.5 || 0.3})`,
      borderRadius: '16px',
      boxShadow: [
        `0 8px 32px rgba(0, 0, 0, 0.1)`,
        `inset 0 1px 0 rgba(255, 255, 255, 0.25)`
      ].join(', ')
    };

    // 우선순위별 글로우 효과
    if (theme.glow && notification.priority !== '낮음') {
      const glowColor = theme.color || '#3b82f6';
      baseStyle.boxShadow += `, 0 0 24px ${glowColor}20`;
    }

    // 호버 효과
    if (isHovered) {
      baseStyle.transform = 'scale(1.02) translateY(-2px)';
      baseStyle.boxShadow += `, 0 16px 48px rgba(0, 0, 0, 0.15)`;
    }

    return baseStyle;
  };

  const getPriorityColor = () => {
    const colors = {
      '낮음': '#6366f1',
      '보통': '#3b82f6', 
      '높음': '#fb923c',
      '긴급': '#ef4444',
      '치명적': '#dc2687'
    };
    return colors[notification.priority] || '#3b82f6';
  };

  const getDepartmentConfig = () => {
    const configs = {
      '물리치료학과': { icon: '🏥', color: '#059669', bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' },
      '간호학과': { icon: '🩺', color: '#0284c7', bg: 'linear-gradient(135deg, #f0f9ff, #dbeafe)' },
      '작업치료학과': { icon: '🧠', color: '#7c3aed', bg: 'linear-gradient(135deg, #faf5ff, #e9d5ff)' }
    };
    
    const dept = notification.student?.department || notification.department_config?.department;
    return configs[dept] || { icon: '📊', color: '#6366f1', bg: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' };
  };

  const deptConfig = getDepartmentConfig();

  return (
    <div 
      className={`liquid-glass-notification ${className} ${isVisible ? 'visible' : ''} priority-${notification.priority}`}
      style={getGlassStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🌈 상단 우선순위 바 */}
      <div 
        className="priority-bar"
        style={{
          background: `linear-gradient(90deg, ${getPriorityColor()}, ${getPriorityColor()}80)`,
          height: '3px',
          borderRadius: '3px 3px 0 0'
        }}
      />

      <div className="notification-content">
        {/* 📱 헤더 */}
        <div className="notification-header">
          <div className="department-info">
            <div 
              className="department-icon"
              style={{ 
                background: deptConfig.bg,
                color: deptConfig.color,
                fontSize: '24px',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${deptConfig.color}20`
              }}
            >
              {deptConfig.icon}
            </div>
            <div className="notification-text">
              <h3 className="notification-title">{notification.title}</h3>
              {notification.subtitle && (
                <p className="notification-subtitle">{notification.subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="notification-meta">
            <span 
              className="priority-badge"
              style={{ 
                background: `${getPriorityColor()}20`,
                color: getPriorityColor(),
                border: `1px solid ${getPriorityColor()}40`
              }}
            >
              {notification.priority}
            </span>
            <button 
              className="close-button"
              onClick={handleDismiss}
              aria-label="알림 닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 💬 메시지 */}
        <div className="notification-message">
          <p>{notification.message}</p>
        </div>

        {/* 📊 추가 정보 (진단테스트 완료 시) */}
        {notification.type === '진단완료' && notification.diagnosis && (
          <div className="diagnosis-info">
            <div className="diagnosis-metrics">
              <div className="metric">
                <span className="metric-label">정확도</span>
                <span 
                  className="metric-value"
                  style={{ color: notification.score >= 80 ? '#059669' : notification.score >= 60 ? '#fb923c' : '#ef4444' }}
                >
                  {notification.score?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">수행 수준</span>
                <span className="metric-value">
                  {notification.diagnosis.performance_level || '분석중'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ⚠️ 혼란 감지 정보 */}
        {notification.type === '혼란감지' && notification.confusion_analysis && (
          <div className="confusion-info">
            <div className="confusion-indicators">
              {notification.confusion_analysis.indicators?.map((indicator, index) => (
                <span key={index} className="confusion-indicator">
                  {indicator}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ⚡ 액션 버튼들 */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="notification-actions">
            {notification.actions.map((action) => (
              <button
                key={action.id}
                className={`action-button ${action.style || 'secondary'} ${action.urgent ? 'urgent' : ''}`}
                onClick={() => handleAction(action)}
                style={{
                  background: action.style === 'primary' ? getPriorityColor() : 'transparent',
                  color: action.style === 'primary' ? 'white' : getPriorityColor(),
                  border: `1px solid ${getPriorityColor()}40`
                }}
              >
                {action.icon && <span className="action-icon">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* 🕐 타이밍 정보 */}
        <div className="notification-footer">
          <span className="timestamp">
            {new Date(notification.created_at || notification.timing?.created_at).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          
          {notification.timing?.requires_interaction && (
            <span className="requires-interaction">
              📌 확인 필요
            </span>
          )}
        </div>
      </div>

      {/* 🎆 펄스 애니메이션 (긴급/치명적) */}
      {['긴급', '치명적'].includes(notification.priority) && (
        <div 
          className="pulse-animation"
          style={{
            background: `radial-gradient(circle, ${getPriorityColor()}20, transparent)`,
          }}
        />
      )}
    </div>
  );
};

export default LiquidGlassNotification; 
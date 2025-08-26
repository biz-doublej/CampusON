/**
 * 👨‍🏫 교수용 Liquid Glass 알림 센터
 * 3개 학과 전용 실시간 알림 관리
 */
import React, { useState, useEffect } from 'react';
import LiquidGlassNotification from './LiquidGlassNotification';

const NotificationCenter = ({ professorId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket 연결
  useEffect(() => {
    if (!professorId) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/professor/${professorId}`);
    
    ws.onopen = () => {
      console.log('🔌 교수 알림 WebSocket 연결');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'liquid_glass_notification') {
        handleNewNotification(data.data);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => ws.close();
  }, [professorId]);

  const handleNewNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    if (['긴급', '치명적'].includes(notification.priority)) {
      setIsExpanded(true);
    }
  };

  const handleDismiss = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="notification-center">
      <div 
        className="notification-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="notification-icon">
          🔔
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </div>
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 연결됨' : '🔴 연결 끊김'}
        </span>
      </div>

      {isExpanded && (
        <div className="notification-list">
          {notifications.length === 0 ? (
            <p>새 알림이 없습니다</p>
          ) : (
            notifications.map(notification => (
              <LiquidGlassNotification
                key={notification.id}
                notification={notification}
                onDismiss={handleDismiss}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 
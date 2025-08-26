/**
 * 👨‍🏫 교수용 Liquid Glass 알림 센터
 * 3개 학과 전용 실시간 알림 관리
 */
import React, { useState, useEffect, useCallback } from 'react';
import LiquidGlassNotification from './LiquidGlassNotification';
import './ProfessorNotificationCenter.css';

const ProfessorNotificationCenter = ({ 
  professorId, 
  onNotificationAction,
  className = '' 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [websocket, setWebsocket] = useState(null);

  // 🔌 WebSocket 연결 설정
  useEffect(() => {
    if (!professorId) return;

    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8000/ws/professor/${professorId}`);
      
      ws.onopen = () => {
        console.log('🔌 교수 알림 WebSocket 연결 성공');
        setIsConnected(true);
        
        // 기존 알림 로드
        loadExistingNotifications();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'liquid_glass_notification') {
            handleNewNotification(data.data || data.notification);
          }
        } catch (error) {
          console.error('WebSocket 메시지 파싱 오류:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket 연결 해제');
        setIsConnected(false);
        
        // 재연결 시도
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        setIsConnected(false);
      };

      setWebsocket(ws);
    };

    connectWebSocket();

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [professorId]);

  // 📱 기존 알림 로드
  const loadExistingNotifications = async () => {
    try {
      const response = await fetch(`/api/professor/notifications?professor_id=${professorId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      }
    } catch (error) {
      console.error('기존 알림 로드 실패:', error);
    }
  };

  // 🆕 새 알림 처리
  const handleNewNotification = useCallback((notification) => {
    setNotifications(prev => {
      // 중복 확인
      const exists = prev.find(n => n.id === notification.id);
      if (exists) return prev;

      // 새 알림 추가 (상단에)
      const updated = [notification, ...prev];
      
      // 최대 50개까지만 유지
      return updated.slice(0, 50);
    });

    // 읽지 않은 개수 증가
    setUnreadCount(prev => prev + 1);

    // 중요한 알림은 자동으로 확장
    if (['긴급', '치명적'].includes(notification.priority)) {
      setIsExpanded(true);
      
      // 브라우저 알림 (권한이 있는 경우)
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      }
    }

    console.log('🔔 새 알림 수신:', notification.title);
  }, []);

  // 🎯 알림 액션 처리
  const handleNotificationAction = async (action, notification) => {
    try {
      // 상위 컴포넌트에 액션 전달
      if (onNotificationAction) {
        await onNotificationAction(action, notification);
      }

      // 내장 액션 처리
      switch (action.action) {
        case 'mark_as_reviewed':
          await markNotificationAsRead(notification.id);
          break;
          
        case 'dismiss_notification':
          await dismissNotification(notification.id);
          break;
          
        case 'view_detail':
          if (action.url) {
            if (action.opens_modal) {
              // 모달 열기 로직
              console.log('모달 열기:', action.url);
            } else {
              window.location.href = action.url;
            }
          }
          break;
          
        case 'send_realtime_hint':
          await sendRealtimeHint(notification);
          break;
      }
    } catch (error) {
      console.error('알림 액션 처리 실패:', error);
    }
  };

  // ✅ 알림 읽음 처리
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/professor/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          notification_id: notificationId,
          professor_id: professorId
        })
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setNotifications(prev => prev.map(n => 
          n.id === notificationId 
            ? { ...n, metadata: { ...n.metadata, status: '읽음' } }
            : n
        ));
        
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // ❌ 알림 해제
  const dismissNotification = async (notificationId) => {
    try {
      const response = await fetch('/api/professor/notifications/dismiss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          notification_id: notificationId,
          professor_id: professorId
        })
      });

      if (response.ok) {
        // 로컬에서 제거
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('알림 해제 실패:', error);
    }
  };

  // 💡 실시간 힌트 전송
  const sendRealtimeHint = async (notification) => {
    try {
      const response = await fetch('/api/professor/send-hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          student_id: notification.student?.id || notification.student_id,
          hint_message: "교수님이 힌트를 보내셨습니다. 차근차근 다시 생각해보세요!",
          notification_id: notification.id
        })
      });

      if (response.ok) {
        console.log('💡 힌트 전송 완료');
        // 알림에 전송 완료 표시
        setNotifications(prev => prev.map(n => 
          n.id === notification.id 
            ? { 
                ...n, 
                metadata: { 
                  ...n.metadata, 
                  hint_sent: true,
                  hint_sent_at: new Date().toISOString()
                }
              }
            : n
        ));
      }
    } catch (error) {
      console.error('힌트 전송 실패:', error);
    }
  };

  // 🔔 브라우저 알림 권한 요청
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 📊 통계 계산
  const getNotificationStats = () => {
    const stats = {
      total: notifications.length,
      unread: unreadCount,
      byPriority: {
        '치명적': 0,
        '긴급': 0,
        '높음': 0,
        '보통': 0,
        '낮음': 0
      },
      byType: {
        '진단완료': 0,
        '혼란감지': 0,
        '교수개입': 0,
        '시스템알림': 0
      }
    };

    notifications.forEach(n => {
      if (n.priority) stats.byPriority[n.priority]++;
      if (n.type) stats.byType[n.type]++;
    });

    return stats;
  };

  const stats = getNotificationStats();

  return (
    <div className={`professor-notification-center ${className}`}>
      {/* 🎛️ 알림 센터 헤더 */}
      <div 
        className="notification-center-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-info">
          <div className="notification-icon">
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          
          <div className="header-text">
            <h3>알림 센터</h3>
            <p>
              {isConnected ? (
                <span className="status-connected">🟢 실시간 연결</span>
              ) : (
                <span className="status-disconnected">🔴 연결 끊김</span>
              )}
            </p>
          </div>
        </div>

        <div className="header-controls">
          <div className="notification-stats">
            {stats.byPriority['치명적'] > 0 && (
              <span className="stat-badge critical">{stats.byPriority['치명적']}</span>
            )}
            {stats.byPriority['긴급'] > 0 && (
              <span className="stat-badge urgent">{stats.byPriority['긴급']}</span>
            )}
          </div>
          
          <button 
            className="expand-button"
            aria-label={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* 📱 알림 목록 */}
      {isExpanded && (
        <div className="notification-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <div className="no-notifications-icon">📭</div>
              <p>새로운 알림이 없습니다</p>
              <small>학생들의 진단테스트 진행 상황을 실시간으로 모니터링합니다</small>
            </div>
          ) : (
            <div className="notifications-container">
              {/* 📊 빠른 통계 */}
              <div className="quick-stats">
                <div className="stat-item">
                  <span className="stat-label">총 알림</span>
                  <span className="stat-value">{stats.total}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">미확인</span>
                  <span className="stat-value unread">{stats.unread}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">진단완료</span>
                  <span className="stat-value">{stats.byType['진단완료']}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">혼란감지</span>
                  <span className="stat-value confusion">{stats.byType['혼란감지']}</span>
                </div>
              </div>

              {/* 📜 알림 리스트 */}
              <div className="notifications-scroll">
                {notifications.map((notification) => (
                  <LiquidGlassNotification
                    key={notification.id}
                    notification={notification}
                    onDismiss={(id) => dismissNotification(id)}
                    onAction={handleNotificationAction}
                    className="in-center"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 🎛️ 하단 컨트롤 */}
          <div className="notification-center-footer">
            <button 
              className="footer-button"
              onClick={() => setNotifications([])}
              disabled={notifications.length === 0}
            >
              🗑️ 모두 지우기
            </button>
            
            <button 
              className="footer-button primary"
              onClick={() => {
                notifications.forEach(n => {
                  if (n.metadata?.status !== '읽음') {
                    markNotificationAsRead(n.id);
                  }
                });
              }}
              disabled={unreadCount === 0}
            >
              ✅ 모두 읽음
            </button>
            
            <button 
              className="footer-button"
              onClick={loadExistingNotifications}
            >
              🔄 새로고침
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorNotificationCenter; 
import React from 'react';
import { useAppStore } from '../stores/appStore';
import '../styles/App.css';

interface SessionListProps {
  connectionId: string;
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  connectionId,
  activeSessionId,
  onSelectSession,
}) => {
  const { sessions } = useAppStore();
  const connectionSessions = sessions.filter(
    (s) => s.connectionId === connectionId
  );

  if (connectionSessions.length === 0) {
    return (
      <div className="session-list">
        <div className="session-list-header">会话</div>
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">暂无会话</div>
          <div className="empty-state-hint">
            连接成功后会自动加载会话列表
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="session-list">
      <div className="session-list-header">会话</div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {connectionSessions.map((session) => (
          <div
            key={session.id}
            className={`session-item ${
              activeSessionId === session.id ? 'active' : ''
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="flex-between">
              <div className="session-name">{session.name}</div>
              {session.unreadCount > 0 && (
                <span className="unread-badge">{session.unreadCount}</span>
              )}
            </div>
            {session.lastMessage && (
              <div className="session-preview">
                {session.lastMessage.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionList;

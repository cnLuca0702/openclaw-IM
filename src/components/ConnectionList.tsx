import React from 'react';
import { useAppStore } from '../stores/appStore';
import '../styles/App.css';

interface ConnectionListProps {
  activeConnectionId: string | null;
  onSelectConnection: (id: string) => void;
}

const ConnectionList: React.FC<ConnectionListProps> = ({
  activeConnectionId,
  onSelectConnection,
}) => {
  const { connections, removeConnection } = useAppStore();

  const handleDeleteConnection = (
    e: React.MouseEvent,
    connectionId: string
  ) => {
    e.stopPropagation();
    if (confirm('确定要删除此连接吗？')) {
      removeConnection(connectionId);
    }
  };

  if (connections.length === 0) {
    return (
      <div className="connection-list">
        <div className="empty-state">
          <div className="empty-state-icon">🔌</div>
          <div className="empty-state-text">暂无连接</div>
          <div className="empty-state-hint">点击 + 添加新的 OpenClaw 连接</div>
        </div>
      </div>
    );
  }

  return (
    <div className="connection-list">
      <div className="connection-list-header">
        <span className="connection-list-title">连接</span>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {connections.map((connection) => (
          <div
            key={connection.id}
            className={`connection-item ${
              activeConnectionId === connection.id ? 'active' : ''
            }`}
            onClick={() => onSelectConnection(connection.id)}
          >
            <div
              className={`connection-status ${connection.status}`}
              title={connection.status}
            />
            <div className="flex-1">
              <div className="text-truncate">{connection.config.name}</div>
              <div className="text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>
                {connection.config.endpoint}
              </div>
            </div>
            <button
              className="sidebar-icon"
              style={{ width: '24px', height: '24px', fontSize: '0.875rem' }}
              onClick={(e) => handleDeleteConnection(e, connection.id)}
              title="删除连接"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionList;

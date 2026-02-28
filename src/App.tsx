import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { openClawService } from './services/openClawService';
import './styles/App.css';

// Components
import Sidebar from './components/Sidebar';
import MiddleSidebar from './components/MiddleSidebar';
import ChatWindow from './components/ChatWindow';
import ConnectionDialog from './components/ConnectionDialog';
import TemplateDialog from './components/TemplateDialog';

const App: React.FC = () => {
  const {
    theme,
    activeConnectionId,
    activeSessionId,
    addConnection,
    addSession,
    updateConnection,
    setActiveConnection,
    setActiveSession,
    setMessages,
  } = useAppStore();

  const [showConnectionDialog, setShowConnectionDialog] = React.useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = React.useState(false);
  const [pendingTemplateContent, setPendingTemplateContent] = React.useState('');
  const [gatewayInfo, setGatewayInfo] = React.useState<any>(null);
  const [autoConnectAttempted, setAutoConnectAttempted] = React.useState(false);

  const isDark = theme === 'dark';

  // Apply theme class to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, isDark]);

  // Auto-reconnect from saved connection config
  useEffect(() => {
    if (autoConnectAttempted) return;
    setAutoConnectAttempted(true);

    const saved = localStorage.getItem('openclaw-connection-config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        console.log('[App] Auto-reconnecting with saved config:', config.name);
        handleAddConnection(config).catch(err => {
          console.error('[App] Auto-reconnect failed:', err);
        });
      } catch (e) {
        console.error('[App] Failed to parse saved config:', e);
        localStorage.removeItem('openclaw-connection-config');
      }
    }
  }, [autoConnectAttempted]);

  // Listen for OpenClaw events
  useEffect(() => {
    const handleConnectionConnected = (connection: any) => {
      updateConnection(connection.id, {
        status: connection.status,
        connectedAt: connection.connectedAt,
      });
    };

    const handleConnectionError = (connection: any) => {
      updateConnection(connection.id, {
        status: connection.status,
        lastError: connection.lastError,
      });
    };

    const handleMessageReceived = (_message: any) => {
      // Add message to appropriate session
    };

    const handleStatusReceived = (statusData: any) => {
      console.log('[App] OpenClaw status:', statusData);

      // 从 connect.ready 事件中提取 gateway 信息
      if (statusData.event === 'connect.ready' && statusData.server) {
        const agents = statusData.snapshot?.health?.agents || [];
        const sessionCount = agents[0]?.sessions?.count || statusData.snapshot?.health?.sessions?.count || 0;
        setGatewayInfo({
          ok: true,
          version: statusData.server?.version || 'unknown',
          uptimeMs: statusData.snapshot?.uptimeMs || 0,
          sessionCount,
        });
      }
      // 从 health 事件中更新 gateway 信息
      if (statusData.event === 'health') {
        const agents = statusData.agents || [];
        const sessionCount = agents[0]?.sessions?.count || statusData.sessions?.count || 0;
        setGatewayInfo((prev: any) => ({
          ...prev,
          ok: statusData.ok ?? true,
          sessionCount: sessionCount || prev?.sessionCount || 0,
        }));
      }
    };

    openClawService.on('connection:connected', handleConnectionConnected);
    openClawService.on('connection:error', handleConnectionError);
    openClawService.on('message:received', handleMessageReceived);
    openClawService.on('status:received', handleStatusReceived);

    return () => {
      openClawService.off('connection:connected', handleConnectionConnected);
      openClawService.off('connection:error', handleConnectionError);
      openClawService.off('message:received', handleMessageReceived);
      openClawService.off('status:received', handleStatusReceived);
    };
  }, [updateConnection]);

  const handleAddConnection = async (config: any) => {
    try {
      // WebSocket 模式
      const connection = await openClawService.connect(config);
      addConnection(connection);
      setActiveConnection(connection.id);

      try {
        // 从服务器加载现有会话
        const serverSessions = await openClawService.getSessions(connection.id);
        if (serverSessions && serverSessions.length > 0) {
          for (const s of serverSessions as any[]) {
            const sId = s.sessionId || s.key || s.id;
            if (!sId) continue;
            addSession({
              id: sId,
              connectionId: connection.id,
              name: s.label || s.displayName || sId.substring(0, 8),
              sessionKey: s.key, // gateway key like "agent:main:main"
              type: s.chatType === 'direct' ? 'individual' : 'group',
              participants: [],
              unreadCount: 0,
              createdAt: new Date(s.updatedAt || Date.now()),
              updatedAt: new Date(s.updatedAt || Date.now()),
            });

            // 尝试加载历史消息 - chat.history 需要 sessionKey (如 agent:main:main)，不是 UUID
            const sessionKey = s.key || sId;
            try {
              const messages = await openClawService.getMessages(connection.id, sessionKey);
              console.log(`[App] Loaded history for session ${sId} (key=${sessionKey}), messages count:`, messages?.length);
              if (messages && messages.length > 0) {
                setMessages(sId, messages);
              }
            } catch (e) {
              console.log('Failed to load history for WS session', sId, e);
            }
          }
          // 激活最近的一个会话
          const firstSession = serverSessions[0] as any;
          const firstId = firstSession.sessionId || firstSession.key || firstSession.id;
          setActiveSession(firstId);
        } else {
          // 没有会话时，自动创建一个默认会话
          const sessionId = `session-${Date.now()}`;
          addSession({
            id: sessionId,
            connectionId: connection.id,
            name: '新对话 1',
            type: 'individual',
            participants: [],
            unreadCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setActiveSession(sessionId);
        }
      } catch (sessionErr) {
        console.error('Failed to load WS sessions:', sessionErr);
      }

      setShowConnectionDialog(false);

      // 保存连接配置到 localStorage
      localStorage.setItem('openclaw-connection-config', JSON.stringify(config));
    } catch (error) {
      const msg = error instanceof Error ? error.message : '未知错误';
      alert(`连接失败：${msg}`);
      console.error('Failed to add connection:', error);
    }
  };

  // Theme-aware classes
  const bgMain = isDark ? 'bg-gray-900' : 'bg-white';
  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';

  // Default active connection for mock data display
  const effectiveConnectionId = activeConnectionId || 'c1';
  const effectiveSessionId = activeSessionId || 's1';

  return (
    <div className={`flex h-screen w-full font-sans ${bgMain} ${textMain} overflow-hidden selection:bg-blue-500 selection:text-white`}>
      {/* Left sidebar - global actions */}
      <Sidebar
        onAddConnection={() => setShowConnectionDialog(true)}
        onManageTemplates={() => setShowTemplateDialog(true)}
        onOpenSettings={() => { }}
      />

      {/* Middle sidebar - connections & sessions */}
      <MiddleSidebar
        activeConnectionId={effectiveConnectionId}
        activeSessionId={effectiveSessionId}
        onSelectConnection={(id) => setActiveConnection(id)}
        onSelectSession={(id) => setActiveSession(id)}
        isDark={isDark}
      />

      {/* Right area - chat window */}
      <ChatWindow
        isDark={isDark}
        onShowTemplates={() => setShowTemplateDialog(true)}
        pendingTemplateContent={pendingTemplateContent}
        onClearPendingTemplate={() => setPendingTemplateContent('')}
        gatewayInfo={gatewayInfo}
      />

      {/* Modals */}
      {showConnectionDialog && (
        <ConnectionDialog
          onClose={() => setShowConnectionDialog(false)}
          onSave={handleAddConnection}
        />
      )}

      {showTemplateDialog && (
        <TemplateDialog
          onClose={() => setShowTemplateDialog(false)}
          onSelectTemplate={(content) => setPendingTemplateContent(content)}
        />
      )}


    </div>
  );
};

export default App;

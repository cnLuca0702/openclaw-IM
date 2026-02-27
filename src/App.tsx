import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { openClawService } from './services/openClawService';
import './styles/App.css';

// Components
import Sidebar from './components/Sidebar';
import ConnectionList from './components/ConnectionList';
import SessionList from './components/SessionList';
import ChatWindow from './components/ChatWindow';
import ConnectionDialog from './components/ConnectionDialog';
import TemplateDialog from './components/TemplateDialog';
import SettingsPanel from './components/SettingsPanel';

const App: React.FC = () => {
  const {
    theme,
    activeConnectionId,
    activeSessionId,
    addConnection,
    updateConnection,
  } = useAppStore();

  const [showConnectionDialog, setShowConnectionDialog] = React.useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Initialize with saved connections
  useEffect(() => {
    const loadSavedData = async () => {
      if ((window as any).electronAPI) {
        await (window as any).electronAPI.settings.getAll();
        // Load saved connections and templates
      }
    };
    loadSavedData();
  }, []);

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

    openClawService.on('connection:connected', handleConnectionConnected);
    openClawService.on('connection:error', handleConnectionError);
    openClawService.on('message:received', handleMessageReceived);

    return () => {
      openClawService.off('connection:connected', handleConnectionConnected);
      openClawService.off('connection:error', handleConnectionError);
      openClawService.off('message:received', handleMessageReceived);
    };
  }, [updateConnection]);

  const handleAddConnection = async (config: any) => {
    try {
      const connection = await openClawService.connect(config);
      addConnection(connection);
      setShowConnectionDialog(false);
    } catch (error) {
      console.error('Failed to add connection:', error);
    }
  };

  return (
    <div className={`app ${theme}`}>
      <Sidebar
        onAddConnection={() => setShowConnectionDialog(true)}
        onManageTemplates={() => setShowTemplateDialog(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="main-content">
        <ConnectionList
          activeConnectionId={activeConnectionId}
          onSelectConnection={(id) => useAppStore.getState().setActiveConnection(id)}
        />

        {activeConnectionId && (
          <SessionList
            connectionId={activeConnectionId}
            activeSessionId={activeSessionId}
            onSelectSession={(id) => useAppStore.getState().setActiveSession(id)}
          />
        )}

        {activeSessionId && <ChatWindow />}
      </div>

      {showConnectionDialog && (
        <ConnectionDialog
          onClose={() => setShowConnectionDialog(false)}
          onSave={handleAddConnection}
        />
      )}

      {showTemplateDialog && (
        <TemplateDialog onClose={() => setShowTemplateDialog(false)} />
      )}

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default App;

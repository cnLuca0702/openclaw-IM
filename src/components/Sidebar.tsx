import React from 'react';
import { useAppStore } from '../stores/appStore';
import '../styles/App.css';

interface SidebarProps {
  onAddConnection: () => void;
  onManageTemplates: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onAddConnection,
  onManageTemplates,
  onOpenSettings,
}) => {
  const { theme, toggleSidebar, sidebarCollapsed } = useAppStore();

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    useAppStore.getState().setTheme(newTheme);
  };

  if (sidebarCollapsed) {
    return (
      <div className="sidebar">
        <div
          className="sidebar-icon"
          onClick={() => toggleSidebar()}
          title="展开"
        >
          ➤
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-icon" onClick={onAddConnection} title="添加连接">
        +
      </div>
      <div className="sidebar-icon" onClick={onManageTemplates} title="模板管理">
        📝
      </div>
      <div
        className="sidebar-icon"
        onClick={handleThemeToggle}
        title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </div>
      <div className="sidebar-icon" onClick={onOpenSettings} title="设置">
        ⚙️
      </div>
      <div style={{ flex: 1 }} />
      <div
        className="sidebar-icon"
        onClick={() => toggleSidebar()}
        title="收起"
      >
        ◀
      </div>
    </div>
  );
};

export default Sidebar;

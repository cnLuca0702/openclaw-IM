import React from 'react';
import { useAppStore } from '../stores/appStore';
import { Plus, FileText, Moon, Sun, Settings } from 'lucide-react';

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
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const handleThemeToggle = () => {
    useAppStore.getState().setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div
      className="flex flex-col items-center pb-5 shrink-0"
      style={{
        width: 60,
        paddingTop: 16,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* + button */}
      <button
        onClick={onAddConnection}
        style={{
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          border: 'none',
          background: 'var(--accent)',
          color: '#ffffff',
          cursor: 'pointer',
          fontSize: 20,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        <Plus size={20} strokeWidth={2} />
      </button>

      {/* separator */}
      <div style={{
        width: 28,
        height: 1,
        background: 'var(--border-color)',
        margin: '16px 0',
      }} />

      {/* template icon */}
      <SidebarIcon onClick={onManageTemplates}>
        <FileText size={20} strokeWidth={1.5} />
      </SidebarIcon>

      {/* spacer */}
      <div className="flex-1" />

      {/* theme toggle */}
      <SidebarIcon onClick={handleThemeToggle}>
        {isDark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
      </SidebarIcon>

      {/* settings */}
      <div style={{ marginTop: 8 }}>
        <SidebarIcon onClick={onOpenSettings}>
          <Settings size={20} strokeWidth={1.5} />
        </SidebarIcon>
      </div>
    </div>
  );
};

const SidebarIcon: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 38,
      height: 38,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      border: 'none',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      transition: 'background 0.15s, color 0.15s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background = 'var(--bg-hover)';
      e.currentTarget.style.color = 'var(--text-secondary)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--text-muted)';
    }}
  >
    {children}
  </button>
);

export default Sidebar;

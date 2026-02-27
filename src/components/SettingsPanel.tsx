import React from 'react';
import { useAppStore } from '../stores/appStore';
import '../styles/App.css';

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { theme, setTheme } = useAppStore();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">设置</div>
          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dialog-body">
          <div className="form-group">
            <label className="form-label">主题</label>
            <div className="flex gap-2">
              <button
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleThemeChange('light')}
              >
                浅色
              </button>
              <button
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleThemeChange('dark')}
              >
                深色
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">关于</label>
            <div className="text-secondary">
              <p>OpenClaw IM Client</p>
              <p style={{ fontSize: '0.875rem' }}>
                版本 1.0.0
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                支持 OpenClaw 多连接、多会话通信
              </p>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn btn-primary" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

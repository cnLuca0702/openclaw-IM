import React, { useState } from 'react';
import { OpenClawConfig } from '../types';
import { Server, X } from 'lucide-react';
import { useAppStore } from '../stores/appStore';

interface ConnectionDialogProps {
  onClose: () => void;
  onSave: (config: OpenClawConfig) => void;
}

const ConnectionDialog: React.FC<ConnectionDialogProps> = ({ onClose, onSave }) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [connName, setConnName] = useState('OpenClaw Bot');

  // WebSocket 对应的状态
  const [wsEndpoint, setWsEndpoint] = useState('ws://8.153.174.191:18789');
  const [wsToken, setWsToken] = useState('ecb934d4613dd25ca37be5cce9c86df00fe64659b886c42c');

  const handleSubmit = () => {
    if (!connName.trim() || !wsToken.trim()) {
      alert('请填写连接名称和Gateway Token');
      return;
    }
    if (!wsEndpoint.trim()) {
      alert('请填写WebSocket地址');
      return;
    }
    const config: OpenClawConfig = {
      name: connName.trim(),
      endpoint: wsEndpoint.trim(),
      protocol: 'websocket',
      apiKey: wsToken.trim(),
    };
    onSave(config);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div style={{
        width: 480,
        background: 'var(--bg-main)',
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.2s ease-out',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: 'var(--accent)',
              color: '#ffffff',
            }}>
              <Server size={17} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>添加连接</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                连接名称 <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="例如：生产环境、测试机器人"
                value={connName}
                onChange={e => setConnName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                WebSocket 地址 <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="ws://IP:端口"
                value={wsEndpoint}
                onChange={e => setWsEndpoint(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: 'monospace',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                例如：ws://8.153.174.191:18789
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Gateway Token <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="输入Gateway Token"
                value={wsToken}
                onChange={e => setWsToken(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  fontFamily: 'monospace',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                在 OpenClaw 管理后台获取相应的凭证
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-main)'; }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 24px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            立即连接
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionDialog;

import React, { useState, useEffect } from 'react';
import { OpenClawConfig } from '../types';
import '../styles/App.css';

interface ConnectionDialogProps {
  onClose: () => void;
  onSave: (config: OpenClawConfig) => void;
}

type ConnectionMode = 'direct' | 'reverse';

const ConnectionDialog: React.FC<ConnectionDialogProps> = ({ onClose, onSave }) => {
  const [mode, setMode] = useState<ConnectionMode>('direct');
  const [name, setName] = useState('');
  const [botToken, setBotToken] = useState('');
  const [endpoint, setEndpoint] = useState('wss://api.openclaw.com/ws');
  const [connectCommand, setConnectCommand] = useState('');
  const [waitingForServer, setWaitingForServer] = useState(false);

  // 生成服务器端连接命令（类似Kimi Claw）
  useEffect(() => {
    if (mode === 'reverse' && name && botToken) {
      const command = `bash <(curl -fsSL https://cdn.kimi.com/kimi-claw/install.sh) --bot-token ${botToken} --connection-name "${name}"`;
      setConnectCommand(command);
    }
  }, [mode, name, botToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !botToken.trim()) {
      alert('请填写连接名称和Bot Token');
      return;
    }

    if (mode === 'direct') {
      const config: OpenClawConfig = {
        name: name.trim(),
        endpoint: endpoint.trim(),
        protocol: 'websocket',
        apiKey: botToken.trim(),
      };
      onSave(config);
      onClose();
    } else {
      // 反向连接模式 - 保存连接并等待服务器
      const config: OpenClawConfig = {
        name: name.trim(),
        endpoint: 'reverse',
        protocol: 'websocket',
        apiKey: botToken.trim(),
      };
      onSave(config);
      setWaitingForServer(true);
      onClose();
    }
  };

  // 服务器主动连接模式的内容
  const renderReverseMode = () => (
    <>
      <div className="form-group">
        <label className="form-label">Bot Token *</label>
        <input
          type="password"
          className="form-input"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxx"
          required
        />
        <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          在OpenClaw管理后台获取Bot Token
        </small>
      </div>

      {name && botToken && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          border: '2px dashed var(--accent-color)'
        }}>
          <div style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>
            📋 第一步：复制以下命令
          </div>

          <div style={{
            backgroundColor: 'var(--bg-primary)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
            marginBottom: '0.75rem',
            color: '#d63384',
            border: '1px solid var(--accent-color)'
          }}>
            {connectCommand}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              navigator.clipboard.writeText(connectCommand);
              alert('✅ 命令已复制到剪贴板！\n\n接下来：\n1. 登录到OpenClaw服务器\n2. 粘贴并执行此命令\n3. 返回IM客户端，点击"我已运行"按钮');
            }}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          >
            📋 复制命令
          </button>

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>📌 使用步骤：</div>
            <div>1. 复制上面的命令</div>
            <div>2. 在OpenClaw服务器上执行命令</div>
            <div>3. 看到连接成功提示后，点击下方"我已运行"按钮</div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">添加OpenClaw连接</div>
          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            {/* 连接方式选择 */}
            <div className="form-group">
              <label className="form-label">连接方式</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${mode === 'direct' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setMode('direct');
                    setWaitingForServer(false);
                  }}
                  style={{ flex: 1 }}
                >
                  📡 直接连接
                </button>
                <button
                  type="button"
                  className={`btn ${mode === 'reverse' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setMode('reverse');
                    setWaitingForServer(false);
                  }}
                  style={{ flex: 1 }}
                >
                  🔄 服务器主动连接
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">连接名称 *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：生产环境、测试机器人"
                required
              />
            </div>

            {mode === 'direct' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Bot Token *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WebSocket地址</label>
                  <input
                    type="text"
                    className="form-input"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="wss://api.openclaw.com/ws"
                  />
                </div>
              </>
            ) : (
              renderReverseMode()
            )}
          </div>

          <div className="dialog-footer">
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {mode === 'direct' ? '🔗 立即连接' : waitingForServer ? '✅ 我已运行' : '➡️ 下一步'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionDialog;

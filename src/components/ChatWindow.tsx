import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { openClawService } from '../services/openClawService';
import { fileService } from '../services/fileService';
import { Paperclip, Bot, FileText, Activity, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatWindowProps {
  isDark: boolean;
  onShowTemplates: () => void;
  pendingTemplateContent?: string;
  onClearPendingTemplate?: () => void;
  gatewayInfo?: {
    ok: boolean;
    version: string;
    uptimeMs: number;
    sessionCount: number;
  };
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onShowTemplates, pendingTemplateContent, onClearPendingTemplate, gatewayInfo }) => {
  const {
    activeConnectionId,
    activeSessionId,
    messages,
    sessions,
    addMessage,
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Consume pending template content
  useEffect(() => {
    if (pendingTemplateContent) {
      setInputText(pendingTemplateContent);
      onClearPendingTemplate?.();
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [pendingTemplateContent]);

  const currentSessionId = activeSessionId || '';
  const sessionMessages = activeSessionId ? messages[activeSessionId] || [] : [];
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const sessionName = activeSession?.name || '请选择会话';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionMessages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending || !currentSessionId) return;

    if (activeConnectionId && activeSessionId) {
      // WebSocket 模式
      setIsSending(true);
      try {
        const message = await openClawService.sendMessage(activeConnectionId, activeSessionId, inputText);
        addMessage(activeSessionId, message);
        setInputText('');
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = async () => {
    if (!activeConnectionId || !activeSessionId) return;
    try {
      const filePaths = await fileService.selectFiles();
      if (filePaths.length > 0) {
        for (const filePath of filePaths) {
          await fileService.uploadFile(activeConnectionId, activeSessionId, filePath, () => { });
        }
      }
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  const storeMessages = sessionMessages.length > 0
    ? sessionMessages.map(msg => ({
      id: msg.id, sender: msg.sender.name,
      time: new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      text: msg.content, isMe: msg.sender.id === 'me',
    }))
    : [];

  // 显示当前 session 的消息
  const displayMessages = storeMessages;
  // 格式化运行时间
  const formatUptime = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) return `${hours}小时${minutes}分`;
    return `${minutes}分钟`;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-main)' }}>
      {/* ── HEADER ─── */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            {sessionName}
          </span>
        </div>
        {/* Gateway 状态显示 */}
        {gatewayInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity size={14} strokeWidth={1.5} style={{ color: gatewayInfo.ok ? '#22c55e' : '#ef4444' }} />
              <span style={{ color: gatewayInfo.ok ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {gatewayInfo.ok ? '正常' : '异常'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-light)' }}>运行:</span>
              <span style={{ fontFamily: 'monospace' }}>{formatUptime(gatewayInfo.uptimeMs)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-light)' }}>会话:</span>
              <span style={{ fontFamily: 'monospace' }}>{gatewayInfo.sessionCount}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--text-light)' }}>v</span>
              <span style={{ fontFamily: 'monospace' }}>{gatewayInfo.version}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── MESSAGES ─── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 28px' }}>
        <div style={{ maxWidth: '100%', margin: '0 auto' }}>
          {displayMessages.map(msg => (
            <div key={msg.id} style={{ marginBottom: 28 }}>
              {/* sender + time */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  {msg.sender}
                </span>
                <span style={{
                  fontSize: 12,
                  color: 'var(--text-light)',
                  marginLeft: 10,
                }}>
                  {msg.time}
                </span>
              </div>
              {/* bubble */}
              <div style={{ display: 'flex', justifyContent: msg.isMe ? 'flex-end' : 'flex-start' }}>
                <div className="prose prose-sm max-w-none" style={{
                  padding: '12px 18px',
                  fontSize: 15,
                  lineHeight: 1.65,
                  borderRadius: 12,
                  wordBreak: 'break-word',
                  ...(msg.isMe ? {
                    background: 'var(--accent)',
                    color: '#ffffff',
                  } : {
                    background: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }),
                }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p style={{ margin: '0 0 0.5em 0' }} {...props} />,
                      a: ({ node, ...props }) => <a style={{ color: msg.isMe ? '#fff' : 'var(--accent)', textDecoration: 'underline' }} target="_blank" {...props} />,
                      code: ({ node, inline, ...props }: any) => (
                        inline
                          ? <code style={{ background: 'rgba(128,128,128,0.2)', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.9em' }} {...props} />
                          : <pre style={{ background: 'var(--bg-hover)', padding: '12px', borderRadius: 8, overflowX: 'auto', margin: '0.5em 0' }}><code {...props} /></pre>
                      )
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── INPUT AREA ─── */}
      <div style={{ padding: '12px 28px 24px' }}>
        <div style={{ maxWidth: '100%', margin: '0 auto' }}>
          <div style={{
            border: '1.5px solid var(--accent)',
            borderRadius: 12,
            background: 'var(--bg-input-box)',
            overflow: 'hidden',
          }}>
            {/* toolbar row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '8px 14px',
              borderBottom: '1px solid var(--border-light)',
            }}>
              <ToolBtn onClick={handleFileSelect}><Paperclip size={18} strokeWidth={1.5} /></ToolBtn>
              <ToolBtn onClick={() => { }}><Bot size={18} strokeWidth={1.5} /></ToolBtn>
              <ToolBtn onClick={onShowTemplates}><FileText size={18} strokeWidth={1.5} /></ToolBtn>
            </div>
            {/* textarea row */}
            <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <textarea
                ref={textareaRef}
                className="w-full resize-none outline-none"
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none',
                  minHeight: 24,
                  maxHeight: 120,
                  flex: 1,
                }}
                placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isSending}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  border: 'none',
                  background: (!inputText.trim() || isSending) ? 'var(--bg-hover)' : 'var(--accent)',
                  color: (!inputText.trim() || isSending) ? 'var(--text-muted)' : '#ffffff',
                  cursor: (!inputText.trim() || isSending) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                  marginBottom: 2,
                }}
                onMouseEnter={e => {
                  if (inputText.trim() && !isSending) {
                    e.currentTarget.style.opacity = '0.85';
                  }
                }}
                onMouseLeave={e => {
                  if (inputText.trim() && !isSending) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                <Send size={16} strokeWidth={2} style={{ marginLeft: -2, marginTop: 1 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolBtn: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      border: 'none',
      background: 'transparent',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      transition: 'color 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
  >
    {children}
  </button>
);

export default ChatWindow;

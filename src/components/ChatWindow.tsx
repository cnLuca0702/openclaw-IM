import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { openClawService } from '../services/openClawService';
import { fileService } from '../services/fileService';
import { replyService } from '../services/replyService';
import '../styles/App.css';

const ChatWindow: React.FC = () => {
  const {
    activeConnectionId,
    activeSessionId,
    messages,
    addMessage,
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionMessages = activeSessionId
    ? messages[activeSessionId] || []
    : [];

  useEffect(() => {
    scrollToBottom();
  }, [sessionMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConnectionId || !activeSessionId || isSending) {
      return;
    }

    setIsSending(true);
    try {
      const message = await openClawService.sendMessage(
        activeConnectionId,
        activeSessionId,
        inputText
      );
      addMessage(activeSessionId, message);
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('发送失败，请重试');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = async () => {
    if (!activeConnectionId || !activeSessionId) {
      return;
    }

    try {
      const filePaths = await fileService.selectFiles();
      if (filePaths.length > 0) {
        for (const filePath of filePaths) {
          await fileService.uploadFile(
            activeConnectionId,
            activeSessionId,
            filePath,
            (progress) => {
              console.log(`Upload progress: ${progress}%`);
            }
          );
        }
        alert(`成功上传 ${filePaths.length} 个文件`);
      }
    } catch (error) {
      console.error('File upload failed:', error);
      alert('文件上传失败');
    }
  };

  const handleGetAISuggestions = async () => {
    if (!activeSessionId) return;

    try {
      const suggestions = await replyService.generateReplySuggestions({
        sessionId: activeSessionId,
        lastMessages: sessionMessages.slice(-10),
      });
      setAiSuggestions(suggestions);
      setShowAISuggestions(true);
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    }
  };

  const handleShowTemplates = async () => {
    try {
      const allTemplates = await replyService.getTemplates();
      setTemplates(allTemplates);
      setShowTemplates(true);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleUseSuggestion = (suggestion: any) => {
    setInputText(suggestion.content);
    setShowAISuggestions(false);
  };

  const handleUseTemplate = (template: any) => {
    setInputText(template.content);
    setShowTemplates(false);
  };

  if (!activeSessionId) {
    return (
      <div className="chat-window">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">选择一个会话开始聊天</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-title">
          {useAppStore.getState().sessions.find(s => s.id === activeSessionId)?.name || '聊天'}
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost"
            onClick={handleGetAISuggestions}
            title="AI辅助回复"
          >
            🤖
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleShowTemplates}
            title="模板回复"
          >
            📝
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {sessionMessages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">开始新的对话</div>
          </div>
        ) : (
          sessionMessages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender.id === 'me' ? 'sent' : ''}`}
            >
              <div>
                {message.sender.id !== 'me' && (
                  <div className="message-sender">{message.sender.name}</div>
                )}
                <div className="message-bubble">{message.content}</div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        <button
          className="btn btn-ghost"
          onClick={handleFileSelect}
          title="上传文件"
        >
          📎
        </button>
        <textarea
          className="message-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter发送，Shift+Enter换行)"
          rows={1}
        />
        <button
          className="send-btn"
          onClick={handleSendMessage}
          disabled={!inputText.trim() || isSending}
          title="发送"
        >
          ➤
        </button>
      </div>

      {showAISuggestions && aiSuggestions.length > 0 && (
        <div className="dialog-overlay" onClick={() => setShowAISuggestions(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">AI回复建议</div>
              <button
                className="dialog-close"
                onClick={() => setShowAISuggestions(false)}
              >
                ×
              </button>
            </div>
            <div className="dialog-body">
              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="session-item"
                  onClick={() => handleUseSuggestion(suggestion)}
                  style={{ cursor: 'pointer' }}
                >
                  <div>{suggestion.content}</div>
                  {suggestion.reason && (
                    <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                      {suggestion.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTemplates && templates.length > 0 && (
        <div className="dialog-overlay" onClick={() => setShowTemplates(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-title">模板回复</div>
              <button
                className="dialog-close"
                onClick={() => setShowTemplates(false)}
              >
                ×
              </button>
            </div>
            <div className="dialog-body">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="session-item"
                  onClick={() => handleUseTemplate(template)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="session-name">{template.name}</div>
                  <div className="session-preview">{template.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

import React, { useState, useEffect } from 'react';
import { replyService } from '../services/replyService';
import { ReplyTemplate } from '../types';
import { useAppStore } from '../stores/appStore';
import { FileText, X, Search, Plus } from 'lucide-react';

interface TemplateDialogProps {
  onClose: () => void;
  onSelectTemplate?: (content: string) => void;
}



const TAG_COLORS: Record<string, string> = {
  '#客服': '#4f7df9',
  '#常用': '#52c41a',
  '#确认': '#faad14',
  '#运维': '#ff4d4f',
};

const TemplateDialog: React.FC<TemplateDialogProps> = ({ onClose, onSelectTemplate }) => {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      const loaded = await replyService.getTemplates();
      setTemplates(loaded);
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('确定要删除此模板吗？')) return;
    try {
      await replyService.deleteTemplate(templateId);
      await loadTemplates();
    } catch (e) {
      console.error('Failed to delete template:', e);
    }
  };

  const displayTemplates = templates.map(t => ({ id: t.id, title: t.name, content: t.content, tags: t.tags || [] }));

  const filtered = displayTemplates.filter(t =>
    !searchText || t.title.includes(searchText) || t.content.includes(searchText)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <div className="flex flex-col" style={{
        width: 580,
        maxHeight: '70vh',
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
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8,
              background: 'var(--accent)',
              color: '#ffffff',
            }}>
              <FileText size={17} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>回复模板管理</span>
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
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={15} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              placeholder="搜索模板名称或内容..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 36px',
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            />
          </div>
          <select style={{
            padding: '9px 12px',
            fontSize: 13,
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-main)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            outline: 'none',
          }}>
            <option>全部标签</option>
          </select>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '9px 16px',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
            whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <Plus size={14} /> 新建
          </button>
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '16px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(tpl => (
              <div
                key={tpl.id}
                style={{
                  padding: '18px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(79,125,249,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {tpl.title}
                  </span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => {
                        onSelectTemplate?.(tpl.content);
                        onClose();
                      }}
                      style={{
                        fontSize: 13, fontWeight: 500, color: 'var(--accent)',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
                      onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
                    >
                      使用
                    </button>
                    <button
                      style={{
                        fontSize: 13, color: 'var(--text-muted)',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      style={{
                        fontSize: 13, color: 'var(--text-muted)',
                        background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ff4d4f'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <p style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  marginTop: 8,
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                }}>
                  {tpl.content}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {tpl.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '2px 10px',
                        borderRadius: 12,
                        background: `${TAG_COLORS[tag] || '#4f7df9'}18`,
                        color: TAG_COLORS[tag] || '#4f7df9',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDialog;

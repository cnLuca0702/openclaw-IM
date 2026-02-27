import React, { useState, useEffect } from 'react';
import { replyService } from '../services/replyService';
import { ReplyTemplate } from '../types';
import '../styles/App.css';

interface TemplateDialogProps {
  onClose: () => void;
}

const TemplateDialog: React.FC<TemplateDialogProps> = ({ onClose }) => {
  const [templates, setTemplates] = useState<ReplyTemplate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: '',
    tags: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await replyService.getTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      alert('请填写模板名称和内容');
      return;
    }

    try {
      await replyService.saveTemplate({
        name: newTemplate.name.trim(),
        content: newTemplate.content.trim(),
        category: newTemplate.category.trim() || undefined,
        tags: newTemplate.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      await loadTemplates();
      setNewTemplate({ name: '', content: '', category: '', tags: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('保存失败');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('确定要删除此模板吗？')) return;

    try {
      await replyService.deleteTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('删除失败');
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">回复模板管理</div>
          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="dialog-body">
          {!showAddForm ? (
            <>
              <button
                className="btn btn-primary"
                style={{ marginBottom: '1rem' }}
                onClick={() => setShowAddForm(true)}
              >
                + 新建模板
              </button>

              {templates.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-text">暂无模板</div>
                  <div className="empty-state-hint">点击上方按钮创建新模板</div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="session-item"
                      style={{ cursor: 'default' }}
                    >
                      <div className="flex-between">
                        <div className="session-name">{template.name}</div>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          删除
                        </button>
                      </div>
                      <div className="session-preview">{template.content}</div>
                      {template.category && (
                        <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                          分类: {template.category}
                        </div>
                      )}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex gap-1" style={{ flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          {template.tags.map((tag, index) => (
                            <span
                              key={index}
                              style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <h3>新建回复模板</h3>

              <div className="form-group">
                <label className="form-label">模板名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  placeholder="例如：问候回复、感谢回复"
                />
              </div>

              <div className="form-group">
                <label className="form-label">模板内容 *</label>
                <textarea
                  className="form-textarea"
                  value={newTemplate.content}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, content: e.target.value })
                  }
                  placeholder="输入回复内容，可使用 {{date}}、{{time}} 等变量"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">分类</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTemplate.category}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, category: e.target.value })
                  }
                  placeholder="例如：问候、感谢、告别"
                />
              </div>

              <div className="form-group">
                <label className="form-label">标签（用逗号分隔）</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTemplate.tags}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, tags: e.target.value })
                  }
                  placeholder="例如：常用,快速,正式"
                />
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveTemplate}
                >
                  保存
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTemplate({ name: '', content: '', category: '', tags: '' });
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateDialog;

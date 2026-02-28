import { ReplyTemplate, AIReplyContext, AIReplySuggestion, Message } from '../types';

/**
 * Custom Reply Service
 * Handles template replies and AI-assisted responses
 */
export class ReplyService {
  private templates: ReplyTemplate[] = [];
  private static STORAGE_KEY = 'openclaw_templates';

  private static DEFAULT_TEMPLATES: ReplyTemplate[] = [
    { id: '1', name: '问候语', content: '您好，有什么可以帮您的？', category: '客服', tags: ['#客服', '#常用'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '2', name: '确认收到', content: '收到，我会尽快处理。', category: '确认', tags: ['#确认'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: '3', name: '故障排查', content: '请提供以下信息：\n1. 错误日志截图\n2. 发生时间\n3. 影响范围', category: '运维', tags: ['#运维'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  private loadFromStorage(): ReplyTemplate[] {
    try {
      const stored = localStorage.getItem(ReplyService.STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) { /* ignore */ }
    return [];
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(ReplyService.STORAGE_KEY, JSON.stringify(this.templates));
    } catch (e) { /* ignore */ }
  }

  /**
   * Get all templates
   */
  async getTemplates(): Promise<ReplyTemplate[]> {
    if ((window as any).electronAPI) {
      this.templates = await (window as any).electronAPI.templates.get();
    } else {
      this.templates = this.loadFromStorage();
      if (this.templates.length === 0) {
        this.templates = [...ReplyService.DEFAULT_TEMPLATES];
        this.saveToStorage();
      }
    }
    return this.templates;
  }

  /**
   * Save a new template
   */
  async saveTemplate(template: Omit<ReplyTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReplyTemplate> {
    if ((window as any).electronAPI) {
      const result = await (window as any).electronAPI.templates.save(template);
      this.templates.push(result);
      return result;
    }
    const now = new Date().toISOString();
    const newTemplate: ReplyTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    this.templates.push(newTemplate);
    this.saveToStorage();
    return newTemplate;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    if ((window as any).electronAPI) {
      await (window as any).electronAPI.templates.delete(templateId);
    }
    this.templates = this.templates.filter((t) => t.id !== templateId);
    this.saveToStorage();
  }

  /**
   * Search templates by keyword or category
   */
  searchTemplates(query: string, category?: string): ReplyTemplate[] {
    let results = this.templates;

    if (category) {
      results = results.filter((t) => t.category === category);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.content.toLowerCase().includes(lowerQuery) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return results;
  }

  /**
   * Get template categories
   */
  getCategories(): string[] {
    const categories = new Set(
      this.templates
        .map((t) => t.category)
        .filter((c): c is string => !!c)
    );
    return Array.from(categories);
  }

  /**
   * Generate AI reply suggestions
   */
  async generateReplySuggestions(context: AIReplyContext): Promise<AIReplySuggestion[]> {
    if ((window as any).electronAPI) {
      const result = await (window as any).electronAPI.ai.generateReply(context);
      return result.suggestions || [];
    }

    // Fallback: Generate basic suggestions based on context
    return this.generateBasicSuggestions(context);
  }

  /**
   * Generate basic reply suggestions (fallback)
   */
  private generateBasicSuggestions(context: AIReplyContext): AIReplySuggestion[] {
    const suggestions: AIReplySuggestion[] = [];
    const lastMessages = context.lastMessages.slice(-5);

    // Analyze last messages to generate context-aware suggestions
    const lastMessage = lastMessages[lastMessages.length - 1];

    if (lastMessage) {
      const content = lastMessage.content.toLowerCase();

      // Greeting responses
      if (content.match(/^(hi|hello|hey|早上|下午|晚上|您好)/)) {
        suggestions.push({
          content: '您好！很高兴为您服务，有什么可以帮助您的吗？',
          confidence: 0.9,
          reason: '问候回复',
        });
        suggestions.push({
          content: '你好！请问有什么可以帮到您的？',
          confidence: 0.85,
          reason: '问候回复',
        });
      }

      // Question responses
      if (content.includes('?') || content.includes('？') || content.includes('怎么') || content.includes('如何')) {
        suggestions.push({
          content: '好的，我来帮您了解一下具体情况。',
          confidence: 0.8,
          reason: '问题回复',
        });
        suggestions.push({
          content: '明白您的问题了，让我为您查询一下相关信息。',
          confidence: 0.75,
          reason: '问题回复',
        });
      }

      // Thank you responses
      if (content.includes('谢谢') || content.includes('感谢') || content.includes('thank')) {
        suggestions.push({
          content: '不客气！如果还有其他问题，随时可以联系我。',
          confidence: 0.95,
          reason: '感谢回复',
        });
        suggestions.push({
          content: '这是我应该做的，祝您生活愉快！',
          confidence: 0.9,
          reason: '感谢回复',
        });
      }

      // Goodbye responses
      if (content.includes('再见') || content.includes('拜拜') || content.includes('bye')) {
        suggestions.push({
          content: '再见！祝您有美好的一天！',
          confidence: 0.95,
          reason: '告别回复',
        });
      }
    }

    // Add generic suggestions if no specific ones
    if (suggestions.length === 0) {
      suggestions.push({
        content: '收到您的内容了，我会尽快处理。',
        confidence: 0.7,
        reason: '通用回复',
      });
      suggestions.push({
        content: '好的，我明白了。',
        confidence: 0.65,
        reason: '通用回复',
      });
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Apply template with variable substitution
   */
  applyTemplate(template: ReplyTemplate, variables: Record<string, string>): string {
    let content = template.content;

    // Replace variables in the format {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    });

    // Replace timestamp
    const now = new Date();
    content = content.replace(/\{\{timestamp\}\}/g, now.toLocaleString('zh-CN'));
    content = content.replace(/\{\{date\}\}/g, now.toLocaleDateString('zh-CN'));
    content = content.replace(/\{\{time\}\}/g, now.toLocaleTimeString('zh-CN'));

    return content;
  }

  /**
   * Extract variables from template
   */
  extractTemplateVariables(template: ReplyTemplate): string[] {
    const matches = template.content.match(/\{\{(\w+)\}\}/g) || [];
    const variables = matches.map((m) => m.replace(/\{|\}/g, ''));

    // Filter out common built-in variables
    const builtInVars = ['timestamp', 'date', 'time'];
    return variables.filter((v) => !builtInVars.includes(v));
  }

  /**
   * Get quick reply suggestions based on last messages
   */
  getQuickReplies(lastMessages: Message[]): string[] {
    const quickReplies: string[] = [];

    if (lastMessages.length === 0) {
      return ['您好', '请问有什么可以帮助您的？', '很高兴为您服务'];
    }

    const lastMessage = lastMessages[lastMessages.length - 1];
    const content = lastMessage.content.toLowerCase();

    if (content.includes('你好') || content.includes('您好') || content.includes('hi')) {
      quickReplies.push('您好！有什么可以帮助您的吗？');
      quickReplies.push('你好！请问有什么问题？');
    }

    if (content.includes('谢谢') || content.includes('感谢')) {
      quickReplies.push('不客气！');
      quickReplies.push('这是我应该做的');
    }

    if (content.includes('?') || content.includes('？')) {
      quickReplies.push('好的，我来帮您处理');
      quickReplies.push('明白，请稍等');
    }

    if (content.includes('再见') || content.includes('拜拜')) {
      quickReplies.push('再见，祝您愉快！');
    }

    // Always add some generic quick replies
    quickReplies.push('收到', '好的', '明白');

    return [...new Set(quickReplies)].slice(0, 8);
  }

  /**
   * Create smart reply based on conversation context
   */
  createSmartReply(
    lastMessages: Message[],
    userPrompt?: string
  ): string {
    // Combine conversation analysis with user prompt
    const quickReplies = this.getQuickReplies(lastMessages);

    if (userPrompt) {
      // If user provided a prompt, use it as base
      return userPrompt;
    }

    // Return the first quick reply or a default
    return quickReplies[0] || '好的';
  }

  /**
   * Format reply preview
   */
  formatPreview(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }
}

// Singleton instance
export const replyService = new ReplyService();

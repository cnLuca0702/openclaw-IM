import { OpenClawConfig, OpenClawConnection, Message } from '../types';

/**
 * OpenClaw Connection Service
 * 支持直接连接和反向连接模式
 */
export class OpenClawService {
  private connections: Map<string, OpenClawConnection> = new Map();
  private webSockets: Map<string, WebSocket> = new Map();
  private eventHandlers: Map<string, Set<Function>> = new Map();

  /**
   * 生成OpenClaw连接命令
   */
  generateConnectCommand(connectionName: string, botToken: string): string {
    return `bash <(curl -fsSL https://cdn.openclaw.com/openclaw-agent/install.sh) --bot-token ${botToken} --connection-name "${connectionName}"`;
  }

  /**
   * 连接到OpenClaw实例
   * 支持直接连接(endpoint是WebSocket地址)和反向连接(endpoint是'reverse')
   */
  async connect(config: OpenClawConfig): Promise<OpenClawConnection> {
    const connectionId = this.generateConnectionId(config);

    // 检查是否已存在
    if (this.connections.has(connectionId)) {
      return this.connections.get(connectionId)!;
    }

    const connection: OpenClawConnection = {
      id: connectionId,
      config,
      status: 'connecting',
    };

    this.connections.set(connectionId, connection);
    this.emit('connection:connecting', connection);

    // 反向连接模式 - 保存连接并等待服务器连接
    if (config.endpoint === 'reverse') {
      connection.status = 'waiting';
      this.emit('connection:waiting', connection);
      return connection;
    }

    // 直接连接模式 - 建立WebSocket连接
    try {
      // 直接使用用户提供的endpoint URL
      let wsUrl = config.endpoint;
      // 如果没有ws://或wss://前缀，自动添加ws://
      if (!/^wss?:\/\//.test(wsUrl)) {
        wsUrl = `ws://${wsUrl}`;
      }
      // 将token作为查询参数附加到URL
      const separator = wsUrl.includes('?') ? '&' : '?';
      const fullUrl = `${wsUrl}${separator}token=${encodeURIComponent(config.apiKey)}`;

      console.log(`[OpenClaw] Connecting to: ${wsUrl}`);
      const ws = new WebSocket(fullUrl);

      this.webSockets.set(connectionId, ws);

      // 设置消息处理（包含challenge-response认证），必须在 await 之前设置，否则收不到 challenge
      ws.onmessage = (event) => {
        console.log(`[OpenClaw] Message received:`, event.data);
        this.handleMessage(connectionId, event.data, config.apiKey);
      };

      // 等待连接建立和认证完成（监听 connect.ready）
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.off('status:received', onStatus);
          ws.close();
          reject(new Error('Connection or Authentication timeout (10s)'));
        }, 10000);

        const onStatus = (status: any) => {
          if (status.event === 'connect.ready') {
            clearTimeout(timeout);
            this.off('status:received', onStatus);
            resolve();
          } else if (status.event === 'connect.error' || status.closeCode === 1008) {
            clearTimeout(timeout);
            this.off('status:received', onStatus);
            ws.close();
            reject(new Error(status.error || 'Authentication failed'));
          }
        };

        this.on('status:received', onStatus);

        ws.onopen = () => {
          console.log(`[OpenClaw] WebSocket connected, waiting for server challenge...`);
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          this.off('status:received', onStatus);
          console.error(`[OpenClaw] WebSocket error:`, error);
          reject(new Error(`WebSocket连接失败：${wsUrl}`));
        };
      });

      ws.onclose = (event) => {
        console.log(`[OpenClaw] WebSocket closed: code=${event.code} reason=${event.reason}`);
        connection.status = 'disconnected';
        this.emit('connection:disconnected', connection);
        // 如果是正常关闭(1000)，通知用户认证结果
        if (event.code === 1000) {
          this.emit('status:received', {
            _summary: '✅ Token 验证通过',
            status: '已认证',
            info: '服务器已接受Token并关闭连接。OpenClaw Bot 已注册，等待服务器回连。',
            closeCode: event.code,
          });
        } else if (event.code === 1008) {
          this.emit('status:received', {
            _summary: '❌ 认证失败',
            error: event.reason || 'invalid request frame',
            closeCode: event.code,
          });
        }
      };

      connection.status = 'connected';
      connection.connectedAt = new Date();
      this.emit('connection:connected', connection);

      return connection;
    } catch (error) {
      connection.status = 'error';
      connection.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[OpenClaw] Connection failed:`, connection.lastError);
      this.emit('connection:error', connection);
      throw error;
    }
  }



  /**
   * 断开连接
   */
  async disconnect(connectionId: string): Promise<void> {
    const ws = this.webSockets.get(connectionId);
    if (ws) {
      ws.close();
      this.webSockets.delete(connectionId);
    }

    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      this.emit('connection:disconnected', connection);
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(
    connectionId: string,
    sessionId: string,
    content: string,
    attachments?: any[],
    sessionKey?: string
  ): Promise<Message> {
    const connection = this.connections.get(connectionId);
    const ws = this.webSockets.get(connectionId);

    if (!connection || connection.status !== 'connected') {
      throw new Error('Connection not established');
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message: Message = {
      id: this.generateMessageId(),
      sessionId,
      connectionId,
      content,
      type: attachments && attachments.length > 0 ? 'file' : 'text',
      sender: {
        id: 'me',
        name: 'Me',
      },
      timestamp: new Date(),
      status: 'sending',
      attachments,
    };

    try {
      // 使用event/payload格式发送消息
      ws.send(JSON.stringify({
        type: 'event',
        event: 'message.send',
        payload: {
          sessionId: sessionKey || sessionId,
          content,
          attachments,
          messageId: message.id,
        },
      }));

      message.status = 'sent';
      this.emit('message:sent', message);
      return message;
    } catch (error) {
      message.status = 'failed';
      this.emit('message:failed', message);
      throw error;
    }
  }

  /**
   * 获取会话列表
   */
  async getSessions(connectionId: string): Promise<any[]> {
    const ws = this.webSockets.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout loading sessions')), 5000);
      const reqId = `req-sessions-${Date.now()}`;

      const handler = (sessions: any[]) => {
        clearTimeout(timeout);
        this.off(`rpc:response:${reqId}`, handler);
        resolve(sessions);
      };

      this.on(`rpc:response:${reqId}`, handler);

      ws.send(JSON.stringify({
        type: 'req',
        id: reqId,
        method: 'sessions.list',
        params: { limit: 100 }
      }));
    });
  }

  /**
   * 获取消息历史
   * @param connectionId WebSocket 连接 ID
   * @param sessionKey session 的 key（如 agent:main:main），不是 UUID
   */
  async getMessages(connectionId: string, sessionKey: string): Promise<Message[]> {
    const ws = this.webSockets.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout loading messages')), 10000);
      const reqId = `req-messages-${Date.now()}`;

      const handler = (messages: any[]) => {
        clearTimeout(timeout);
        this.off(`rpc:response:${reqId}`, handler);
        resolve(messages);
      };

      this.on(`rpc:response:${reqId}`, handler);

      console.log(`[OpenClaw] Fetching chat.history for sessionKey=${sessionKey}`);
      ws.send(JSON.stringify({
        type: 'req',
        id: reqId,
        method: 'chat.history',
        params: { sessionKey, limit: 100 }
      }));
    });
  }

  /**
   * 删除服务器端 session
   * @param connectionId WebSocket 连接 ID
   * @param sessionKey session 的 key（如 agent:main:main）
   * @param deleteTranscript 是否同时删除聊天记录文件
   */
  async deleteSession(connectionId: string, sessionKey: string, deleteTranscript: boolean = true): Promise<boolean> {
    const ws = this.webSockets.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout deleting session')), 10000);
      const reqId = `req-delete-session-${Date.now()}`;

      const handler = (response: any) => {
        clearTimeout(timeout);
        this.off(`rpc:response:${reqId}`, handler);
        if (response.ok) {
          resolve(true);
        } else {
          reject(new Error(response.error?.message || response.error || 'Failed to delete session on server'));
        }
      };

      this.on(`rpc:response:${reqId}`, handler);

      console.log(`[OpenClaw] Deleting session: ${sessionKey}`);
      ws.send(JSON.stringify({
        type: 'req',
        id: reqId,
        method: 'sessions.delete',
        params: { key: sessionKey, deleteTranscript }
      }));
    });
  }

  /**
   * 重命名服务器端 session
   * @param connectionId WebSocket 连接 ID
   * @param sessionKey session 的 key（如 agent:main:main）
   * @param label 新的标签/名称
   */
  async renameSession(connectionId: string, sessionKey: string, label: string): Promise<boolean> {
    const ws = this.webSockets.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout renaming session')), 10000);
      const reqId = `req-rename-session-${Date.now()}`;

      const handler = (response: any) => {
        clearTimeout(timeout);
        this.off(`rpc:response:${reqId}`, handler);
        if (response.ok) {
          resolve(true);
        } else {
          reject(new Error(response.error?.message || response.error || 'Failed to rename session on server'));
        }
      };

      this.on(`rpc:response:${reqId}`, handler);

      console.log(`[OpenClaw] Renaming session ${sessionKey} to "${label}"`);
      ws.send(JSON.stringify({
        type: 'req',
        id: reqId,
        method: 'sessions.patch',
        params: { key: sessionKey, label }
      }));
    });
  }

  /**
   * 上传文件
   */
  async uploadFile(
    connectionId: string,
    sessionId: string,
    file: File
  ): Promise<{ fileId: string; url: string }> {
    const ws = this.webSockets.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);

    const base64 = await base64Promise;

    ws.send(JSON.stringify({
      type: 'event',
      event: 'file.upload',
      payload: {
        sessionId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: base64,
      },
    }));

    return {
      fileId: Date.now().toString(),
      url: '',
    };
  }

  /**
   * 处理收到的消息
   * 支持 event/payload 格式 (OpenClaw协议) 和 type 格式 (旧协议)
   */
  private async handleMessage(connectionId: string, data: string, token?: string): Promise<void> {
    try {
      const message = JSON.parse(data);

      // Handle JSON-RPC responses
      if (message.type === 'res') {
        if (message.id === 'conn-1') {
          if (message.ok) {
            console.log('[OpenClaw] Auth success! Connection ready.');
            this.emit('status:received', {
              event: 'connect.ready',
              ...message.payload,
              _summary: '认证成功，连接就绪',
            });
            // 收到响应后，可以初步提取一些 sessions
            if (message.payload?.sessions?.recent) {
              this.emit('sessions:received', message.payload.sessions.recent);
            }
          } else {
            console.error('[OpenClaw] Auth error:', message.error);
            this.emit('status:received', {
              event: 'connect.error',
              error: message.error?.message || JSON.stringify(message.error),
              _summary: '连接错误',
            });
          }
          return;
        }

        if (message.id?.startsWith('req-sessions-')) {
          if (message.ok) {
            const sessions = message.payload?.items || message.payload?.sessions || [];
            this.emit('sessions:received', sessions);
            this.emit(`rpc:response:${message.id}`, sessions);
          } else {
            console.error('[OpenClaw] Failed to list sessions:', message.error);
            this.emit(`rpc:response:${message.id}`, []);
          }
          return;
        }

        if (message.id?.startsWith('req-messages-')) {
          if (message.ok) {
            const rawMessages = message.payload?.messages || message.payload?.items || [];
            console.log(`[OpenClaw] parse history response: raw count=`, rawMessages.length);

            // 提取消息文本内容的辅助函数
            // content 可能是字符串、也可能是数组: [{type:'text', text:'...'}, {type:'thinking', thinking:'...'}]
            const extractContent = (content: any): string => {
              if (typeof content === 'string') return content;
              if (Array.isArray(content)) {
                return content
                  .filter((block: any) => block.type === 'text' || block.type === 'thinking')
                  .map((block: any) => block.text || block.thinking || '')
                  .filter(Boolean)
                  .join('\n\n');
              }
              return '';
            };

            // 将服务端的原始消息列表映射为本地组件所需的 Message 格式
            // 跳过 toolResult 类型的消息
            const mappedMessages: Message[] = rawMessages
              .filter((msg: any) => msg.role !== 'toolResult')
              .map((msg: any) => ({
                id: msg.id || `hist-${Date.now()}-${Math.random()}`,
                content: extractContent(msg.content),
                type: 'text' as const,
                sender: {
                  id: msg.role === 'user' ? 'me' : 'bot',
                  name: msg.role === 'user' ? '我' : 'OpenClaw AI',
                },
                timestamp: new Date(msg.timestamp || msg.createdAt || Date.now()),
                status: 'sent' as const,
                sessionId: message.payload?.sessionKey || '',
                connectionId: '',
                attachments: [],
              }))
              .filter((msg: any) => msg.content.trim().length > 0); // 跳过空内容的消息

            console.log(`[OpenClaw] mapped messages: ${mappedMessages.length}, first content preview:`, mappedMessages[0]?.content?.substring(0, 80));

            // 确保消息按时间从早到晚排序
            const sortedMessages = mappedMessages.reverse();

            this.emit(`rpc:response:${message.id}`, sortedMessages);
          } else {
            console.error('[OpenClaw] Failed to get messages:', message.error);
            this.emit(`rpc:response:${message.id}`, []);
          }
          return;
        }

        // 处理 session 删除响应
        if (message.id?.startsWith('req-delete-session-')) {
          if (message.ok) {
            console.log('[OpenClaw] Session deleted successfully');
          } else {
            console.error('[OpenClaw] Failed to delete session:', message.error);
          }
          this.emit(`rpc:response:${message.id}`, message);
          return;
        }

        // 处理 session 重命名响应
        if (message.id?.startsWith('req-rename-session-')) {
          if (message.ok) {
            console.log('[OpenClaw] Session renamed successfully');
          } else {
            console.error('[OpenClaw] Failed to rename session:', message.error);
          }
          this.emit(`rpc:response:${message.id}`, message);
          return;
        }

        // Default log for unknown responses
        console.log('[OpenClaw] Unhandled RPC res:', message.id, message.ok);
        return;
      }

      // ── OpenClaw event/payload 协议 ──
      const event = message.event || message.type;
      const payload = message.payload || message;

      switch (event) {
        // 服务器发来挑战，回复 connect auth request
        case 'connect.challenge': {
          const nonce = payload.nonce;
          const ts = payload.ts;
          console.log(`[OpenClaw] Challenge received: nonce=${nonce}, ts=${ts}`);
          const ws = this.webSockets.get(connectionId);
          if (ws && token) {
            console.log(`[OpenClaw] Sending JSON-RPC connect request with token...`);
            const req = {
              type: 'req',
              id: 'conn-1',
              method: 'connect',
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: { id: 'webchat', version: '1.0', platform: 'web', mode: 'ui' },
                role: 'operator',
                scopes: ['operator.read', 'operator.write', 'operator.admin'],
                auth: { token },
              }
            };
            ws.send(JSON.stringify(req));
          }
          break;
        }

        // 认证成功 (旧协议或某些兼容事件)
        case 'connect.ready':
          console.log('[OpenClaw] Auth success event! Connection ready.');
          this.emit('status:received', {
            event: 'connect.ready',
            ...payload,
            _summary: '认证成功，连接就绪',
          });
          break;

        // 状态信息
        case 'status':
        case 'status.response':
          console.log('[OpenClaw] Status:', payload);
          this.emit('status:received', payload);
          break;

        // 会话相关
        case 'sessions':
        case 'session.list':
          this.emit('sessions:received', payload.sessions || payload);
          break;

        // 消息相关
        case 'messages':
        case 'message.list':
          this.emit('messages:received', payload.messages || payload);
          break;

        case 'message':
        case 'message.received':
          this.emit('message:received', payload);
          break;

        // 错误
        case 'error':
        case 'connect.error':
          console.error('[OpenClaw] Error:', payload);
          this.emit('error', payload);
          this.emit('status:received', {
            event: event,
            error: payload.message || payload.error || JSON.stringify(payload),
            _summary: '连接错误',
          });
          break;

        default:
          console.log(`[OpenClaw] Event: ${event}`, payload);
          this.emit('status:received', { event, ...payload });
      }
    } catch (error) {
      // 非JSON数据
      console.log('[OpenClaw] Raw data:', data);
      this.emit('status:received', { raw: data });
    }
  }



  /**
   * 注册事件处理器
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 取消事件处理器
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * 生成连接ID
   */
  private generateConnectionId(config: OpenClawConfig): string {
    return `${config.name}-${Date.now()}`;
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 单例
export const openClawService = new OpenClawService();

import { OpenClawConfig, OpenClawConnection, Session, Message } from '../types';

/**
 * OpenClaw Connection Service
 * 支持直接连接和反向连接模式
 */
export class OpenClawService {
  private connections: Map<string, OpenClawConnection> = new Map();
  private webSockets: Map<string, WebSocket> = new Map();
  private eventHandlers: Map<string, Set<Function>> = new Map();

  /**
   * 生成Kimi Claw风格的连接命令
   * 用户在OpenClaw服务器上执行此命令后，服务器会主动连接到IM客户端
   */
  generateConnectCommand(connectionName: string, botToken: string): string {
    // 使用Kimi Claw的CDN脚本，简单直接
    return `bash <(curl -fsSL https://cdn.kimi.com/kimi-claw/install.sh) --bot-token ${botToken} --connection-name "${connectionName}"`;
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
      const wsUrl = config.endpoint || this.buildWebSocketUrl(config);
      const ws = new WebSocket(wsUrl);

      this.webSockets.set(connectionId, ws);

      // 等待连接建立
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        ws.onopen = () => {
          clearTimeout(timeout);
          // 发送认证信息
          ws.send(JSON.stringify({
            type: 'auth',
            token: config.apiKey,
          }));
          resolve();
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

      // 设置消息处理
      ws.onmessage = (event) => {
        this.handleMessage(connectionId, event.data);
      };

      ws.onclose = () => {
        connection.status = 'disconnected';
        this.emit('connection:disconnected', connection);
      };

      connection.status = 'connected';
      connection.connectedAt = new Date();
      this.emit('connection:connected', connection);

      return connection;
    } catch (error) {
      connection.status = 'error';
      connection.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.emit('connection:error', connection);
      throw error;
    }
  }

  /**
   * 构建WebSocket URL
   */
  private buildWebSocketUrl(config: OpenClawConfig): string {
    const endpoint = config.endpoint.replace(/^https?:\/\//, '');
    return `wss://${endpoint}/ws`;
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
    attachments?: any[]
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
      ws.send(JSON.stringify({
        type: 'message',
        sessionId,
        content,
        attachments,
        messageId: message.id,
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
  async getSessions(connectionId: string): Promise<Session[]> {
    const ws = this.webSockets.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    // 发送请求获取会话列表
    ws.send(JSON.stringify({
      type: 'get_sessions',
    }));

    // 返回空数组，实际会通过事件返回
    return [];
  }

  /**
   * 获取消息历史
   */
  async getMessages(connectionId: string, sessionId: string): Promise<Message[]> {
    const ws = this.webSockets.get(connectionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    ws.send(JSON.stringify({
      type: 'get_messages',
      sessionId,
    }));

    return [];
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

    // 将文件转换为base64发送
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
      type: 'upload_file',
      sessionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileData: base64,
    }));

    return {
      fileId: Date.now().toString(),
      url: '',
    };
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(_connectionId: string, data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'sessions':
          this.emit('sessions:received', message.sessions);
          break;
        case 'messages':
          this.emit('messages:received', message.messages);
          break;
        case 'message':
          this.emit('message:received', message);
          break;
        case 'auth_success':
          // 认证成功
          break;
        case 'error':
          this.emit('error', message);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
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

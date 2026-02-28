// OpenClaw Connection Types
export interface OpenClawConfig {
  name: string;
  apiKey: string;
  endpoint: string;
  protocol: 'websocket' | 'custom';
  customConfig?: Record<string, any>;
}

export interface OpenClawConnection {
  id: string;
  config: OpenClawConfig;
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'waiting';
  connectedAt?: Date;
  lastError?: string;
}

// Session Types
export interface Session {
  id: string;
  connectionId: string;
  name: string;
  sessionKey?: string; // gateway session key, e.g. "agent:main:main"
  type: 'individual' | 'group' | 'channel';
  participants?: string[];
  unreadCount: number;
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface Message {
  id: string;
  sessionId: string;
  connectionId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'audio' | 'video' | 'system';
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
}

// Template Types
export interface ReplyTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// AI Types
export interface AIReplyContext {
  sessionId: string;
  lastMessages: Message[];
  userPrompt?: string;
  conversationHistory?: Message[];
}

export interface AIReplySuggestion {
  content: string;
  confidence: number;
  reason?: string;
}

// File Upload Types
export interface FileUpload {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// App State Types
export interface AppState {
  connections: OpenClawConnection[];
  activeConnectionId: string | null;
  sessions: Session[];
  activeSessionId: string | null;
  messages: Record<string, Message[]>; // sessionId -> messages
  templates: ReplyTemplate[];
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  fileUploads: Record<string, FileUpload>;
}

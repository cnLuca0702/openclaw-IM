import { create } from 'zustand';
import { AppState, OpenClawConnection, Session, Message, ReplyTemplate, FileUpload } from '../types';

interface AppStore extends AppState {
  // Connection actions
  addConnection: (connection: OpenClawConnection) => void;
  removeConnection: (connectionId: string) => void;
  updateConnection: (connectionId: string, updates: Partial<OpenClawConnection>) => void;
  setActiveConnection: (connectionId: string | null) => void;

  // Session actions
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;

  // Message actions
  setMessages: (sessionId: string, messages: Message[]) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void;

  // Template actions
  setTemplates: (templates: ReplyTemplate[]) => void;
  addTemplate: (template: ReplyTemplate) => void;
  removeTemplate: (templateId: string) => void;

  // UI actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // File upload actions
  addFileUpload: (upload: FileUpload) => void;
  updateFileUpload: (fileId: string, updates: Partial<FileUpload>) => void;
  removeFileUpload: (fileId: string) => void;
}

const initialState: AppState = {
  connections: [],
  activeConnectionId: null,
  sessions: [],
  activeSessionId: null,
  messages: {},
  templates: [],
  theme: 'light',
  sidebarCollapsed: false,
  fileUploads: {},
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,

  // Connection actions
  addConnection: (connection) =>
    set((state) => ({
      connections: [...state.connections, connection],
      activeConnectionId: state.activeConnectionId || connection.id,
    })),

  removeConnection: (connectionId) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== connectionId),
      activeConnectionId:
        state.activeConnectionId === connectionId
          ? state.connections.find((c) => c.id !== connectionId)?.id || null
          : state.activeConnectionId,
      sessions: state.sessions.filter((s) => s.connectionId !== connectionId),
    })),

  updateConnection: (connectionId, updates) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === connectionId ? { ...c, ...updates } : c
      ),
    })),

  setActiveConnection: (connectionId) =>
    set({ activeConnectionId: connectionId, activeSessionId: null }),

  // Session actions
  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
    })),

  updateSession: (sessionId, updates) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates, updatedAt: new Date() } : s
      ),
    })),

  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSessionId:
        state.activeSessionId === sessionId ? null : state.activeSessionId,
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([id]) => id !== sessionId)
      ),
    })),

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  // Message actions
  setMessages: (sessionId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [sessionId]: messages },
    })),

  addMessage: (sessionId, message) =>
    set((state) => {
      const sessionMessages = state.messages[sessionId] || [];
      return {
        messages: {
          ...state.messages,
          [sessionId]: [...sessionMessages, message],
        },
      };
    }),

  updateMessage: (sessionId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: (state.messages[sessionId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),

  // Template actions
  setTemplates: (templates) => set({ templates }),

  addTemplate: (template) =>
    set((state) => ({
      templates: [...state.templates, template],
    })),

  removeTemplate: (templateId) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== templateId),
    })),

  // UI actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setTheme: (theme) => set({ theme }),

  // File upload actions
  addFileUpload: (upload) =>
    set((state) => ({
      fileUploads: {
        ...state.fileUploads,
        [upload.id]: upload,
      },
    })),

  updateFileUpload: (fileId, updates) =>
    set((state) => {
      const fileUploads = state.fileUploads || {};
      return {
        fileUploads: {
          ...fileUploads,
          [fileId]: { ...fileUploads[fileId], ...updates },
        },
      };
    }),

  removeFileUpload: (fileId) =>
    set((state) => {
      const fileUploads = state.fileUploads || {};
      const { [fileId]: removed, ...rest } = fileUploads;
      return { fileUploads: rest };
    }),
}));

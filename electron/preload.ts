import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // OpenClaw APIs
  openclaw: {
    connect: (config: any) => ipcRenderer.invoke('openclaw:connect', config),
    disconnect: (connectionId: string) => ipcRenderer.invoke('openclaw:disconnect', connectionId),
    sendMessage: (connectionId: string, sessionId: string, message: any) =>
      ipcRenderer.invoke('openclaw:sendMessage', connectionId, sessionId, message),
    getSessions: (connectionId: string) => ipcRenderer.invoke('openclaw:getSessions', connectionId),
    getMessages: (connectionId: string, sessionId: string) =>
      ipcRenderer.invoke('openclaw:getMessages', connectionId, sessionId),
  },

  // File APIs
  file: {
    select: () => ipcRenderer.invoke('file:select'),
    upload: (connectionId: string, sessionId: string, filePath: string) =>
      ipcRenderer.invoke('file:upload', connectionId, sessionId, filePath),
  },

  // Settings APIs
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },

  // Template APIs
  templates: {
    get: () => ipcRenderer.invoke('templates:get'),
    save: (template: any) => ipcRenderer.invoke('templates:save', template),
    delete: (templateId: string) => ipcRenderer.invoke('templates:delete', templateId),
  },

  // AI APIs
  ai: {
    generateReply: (context: any) => ipcRenderer.invoke('ai:generateReply', context),
  },

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
});

// Type declarations for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      openclaw: {
        connect: (config: any) => Promise<any>;
        disconnect: (connectionId: string) => Promise<any>;
        sendMessage: (connectionId: string, sessionId: string, message: any) => Promise<any>;
        getSessions: (connectionId: string) => Promise<any[]>;
        getMessages: (connectionId: string, sessionId: string) => Promise<any[]>;
      };
      file: {
        select: () => Promise<string[]>;
        upload: (connectionId: string, sessionId: string, filePath: string) => Promise<any>;
      };
      settings: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<any>;
        getAll: () => Promise<any>;
      };
      templates: {
        get: () => Promise<any[]>;
        save: (template: any) => Promise<any>;
        delete: (templateId: string) => Promise<any>;
      };
      ai: {
        generateReply: (context: any) => Promise<any>;
      };
      on: (channel: string, callback: (...args: any[]) => void) => void;
      off: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import Store from 'electron-store';

const store = new Store();
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
  });

  // 开发环境加载Vite服务器，生产环境加载打包后的文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../react/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for OpenClaw connections
ipcMain.handle('openclaw:connect', async (_, config) => {
  // TODO: Implement OpenClaw connection logic
  return { success: true, connectionId: Date.now().toString() };
});

ipcMain.handle('openclaw:disconnect', async (_, connectionId) => {
  // TODO: Implement disconnection logic
  return { success: true };
});

ipcMain.handle('openclaw:sendMessage', async (_, connectionId, sessionId, message) => {
  // TODO: Implement message sending logic
  return { success: true, messageId: Date.now().toString() };
});

ipcMain.handle('openclaw:getSessions', async (_, connectionId) => {
  // TODO: Implement session retrieval logic
  return [];
});

ipcMain.handle('openclaw:getMessages', async (_, connectionId, sessionId) => {
  // TODO: Implement message retrieval logic
  return [];
});

// File upload handlers
ipcMain.handle('file:select', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths;
  }
  return [];
});

ipcMain.handle('file:upload', async (_, connectionId, sessionId, filePath) => {
  // TODO: Implement file upload logic
  return { success: true, fileId: Date.now().toString() };
});

// Settings handlers
ipcMain.handle('settings:get', async (_, key) => {
  return store.get(key);
});

ipcMain.handle('settings:set', async (_, key, value) => {
  store.set(key, value);
  return { success: true };
});

ipcMain.handle('settings:getAll', async () => {
  return store.store;
});

// Template reply handlers
ipcMain.handle('templates:get', async () => {
  const templates = store.get('templates', []);
  return templates;
});

ipcMain.handle('templates:save', async (_, template) => {
  const templates = store.get('templates', []) as any[];
  templates.push({
    ...template,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  store.set('templates', templates);
  return { success: true, template };
});

ipcMain.handle('templates:delete', async (_, templateId) => {
  const templates = store.get('templates', []) as any[];
  const filtered = templates.filter(t => t.id !== templateId);
  store.set('templates', filtered);
  return { success: true };
});

// AI assisted reply handlers
ipcMain.handle('ai:generateReply', async (_, context) => {
  // TODO: Implement AI reply generation
  // This will integrate with OpenClaw's AI capabilities or external AI service
  return { success: true, suggestions: [] };
});

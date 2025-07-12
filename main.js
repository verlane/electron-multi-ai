const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, screen } = require('electron');
const fs = require('fs');
const path = require('path');

// Global variables
let mainWindow;
const statePath = path.join(app.getPath('userData'), 'window-state.json');

// ===== Window State Management =====
class WindowStateManager {
  static load() {
    try {
      const data = fs.readFileSync(statePath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return { x: undefined, y: undefined, width: 1200, height: 800 };
    }
  }

  static save(bounds) {
    fs.writeFileSync(statePath, JSON.stringify(bounds));
  }
}

// ===== Window Management =====
function createWindow() {
  const savedState = WindowStateManager.load();

  mainWindow = new BrowserWindow({
    ...savedState,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
    }
  });

  mainWindow.loadFile('index.html');
  setupWindowEventHandlers();
}

function setupWindowEventHandlers() {
  // Save window state on resize/move
  mainWindow.on('resize', () => {
    WindowStateManager.save(mainWindow.getBounds());
  });
  mainWindow.on('move', () => {
    WindowStateManager.save(mainWindow.getBounds());
  });

  // Handle window focus events
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('clear-preload');
  });
}

// ===== App Initialization =====
app.whenReady().then(async () => {
  createWindow();
  setupGlobalShortcuts();
});

function setupGlobalShortcuts() {
  // Global shortcut: Ctrl+Shift+Alt+H -> focus chat input
  globalShortcut.register('Control+Shift+Alt+H', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
      focusChat();
    }
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ===== Message Handling =====

ipcMain.on('send-message', (event, message) => {
  // Copy message to clipboard
  clipboard.writeText(message);
  console.log('Message copied to clipboard:', message);
  
  event.reply('dispatch-message', message);
});

function focusChat() {
  mainWindow.webContents.send('focus-chat');
}


// 자동 리로드 (개발 중)
const electronReload = require('electron-reload');
electronReload(__dirname);

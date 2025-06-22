const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, screen } = require('electron');
const fs = require('fs');
const path = require('path');

// Global variables
let mainWindow;
let ahk = null;
const ahkexepath = path.join(__dirname, 'AutoHotkey64.exe');
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
  await initializeAHK();
  setupGlobalShortcuts();
  
  // Initialize IME management
  imeManager.startKeepAlive();
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

// ===== AutoHotkey Management =====
async function initializeAHK() {
  try {
    ahk = await require("ahknodejs")(ahkexepath, [
      { key: '\\', noInterrupt: true },
      { key: ']', noInterrupt: true },
    ]);
    
    // AHK interrupt handler
    (async () => {
      while (true) {
        await ahk.waitForInterrupt();
        await ahk.sleep(5000);
      }
    })();
    
    console.log('AutoHotkey initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AutoHotkey:', error);
  }
}

// ===== Robot Actions & Message Handling =====
class RobotActionHandler {
  static async execute(actions) {
    const position = await ahk.getMousePos();
    
    for (const action of actions) {
      await this.performAction(action);
      await ahk.sleep(100);
    }
    
    await ahk.mouseMove({ x: position[0], y: position[1] });
    
    // Reset IME after automation
    mainWindow.webContents.send('focus-chat');
    await ahk.sleep(100);
    await imeManager.resetIME();
  }

  static async performAction(data) {
    switch (data.type) {
      case 'click-relative':
        await this.clickRelative(data);
        break;
      case 'click':
        await ahk.mouseMove({ x: data.x, y: data.y });
        await ahk.click();
        break;
      case 'clipboard-paste':
        await clipboard.writeText(data.text);
        await ahk.sleep(100);
        await ahk.send('^a^v');
        break;
      case 'ahk':
        await ahk.send(data.text);
        break;
    }
  }

  static async clickRelative(data) {
    const bounds = mainWindow.getBounds();
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const screenX = bounds.x * display.scaleFactor + data.x;
    const screenY = bounds.y * display.scaleFactor + data.y;
    await ahk.mouseMove({ x: screenX, y: screenY });
    await ahk.click();
  }
}

// IPC Message handlers
ipcMain.on('robot-actions', (event, actions) => {
  RobotActionHandler.execute(actions);
});

ipcMain.on('send-message', (event, message) => {
  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  event.reply('dispatch-message', message, bounds, display.scaleFactor);
});

function focusChat() {
  mainWindow.webContents.send('focus-chat');
}

// ===== IME Management =====
class IMEManager {
  constructor() {
    this.keepAliveTimer = null;
  }

  async resetIME() {
    if (ahk) {
      await ahk.send('{Space}{Backspace}');
    }
  }

  scheduleKeepAlive() {
    if (this.keepAliveTimer) clearTimeout(this.keepAliveTimer);
    
    this.keepAliveTimer = setTimeout(async () => {
      if (mainWindow && mainWindow.isFocused()) {
        await this.resetIME();
        this.scheduleKeepAlive(); // Reschedule
      }
    }, 5000); // 5 seconds of idle
  }

  startKeepAlive() {
    setTimeout(() => {
      this.scheduleKeepAlive();
    }, 5000);
  }
}

const imeManager = new IMEManager();

// IME IPC handlers
ipcMain.on('ime-reset', () => imeManager.resetIME());
ipcMain.on('reset-ime-timer', () => imeManager.scheduleKeepAlive());

// 자동 리로드 (개발 중)
const electronReload = require('electron-reload');
electronReload(__dirname);

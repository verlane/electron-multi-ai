// index.js
const { app, BrowserWindow, ipcMain, clipboard, globalShortcut } = require('electron');
const robot = require('robotjs');
const fs = require('fs');
const path = require('path');

let mainWindow;
const statePath = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    const data = fs.readFileSync(statePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    // 저장된 상태가 없으면 기본값 반환
    return { x: undefined, y: undefined, width: 1200, height: 800 };
  }
}

function saveWindowState(bounds) {
  fs.writeFileSync(statePath, JSON.stringify(bounds));
}

function createWindow() {
  const savedState = loadWindowState();

  mainWindow = new BrowserWindow({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile('index.html');

  // 창 크기나 위치가 변경될 때마다 실제 bounds(스냅 상태 포함)를 저장
  mainWindow.on('resize', () => {
    saveWindowState(mainWindow.getBounds());
  });
  mainWindow.on('move', () => {
    saveWindowState(mainWindow.getBounds());
  });
}

app.whenReady().then(() => {
  createWindow();

  // 글로벌 단축키 등록: Ctrl+Shift+Alt+H -> 창 활성화 및 "chat-input" 포커싱
  globalShortcut.register('Control+Shift+Alt+H', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('focus-chat');
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 나머지 robot-action 및 send-message 핸들러 등은 기존대로...
ipcMain.on('robot-action', (event, data) => {
  const mousePos = robot.getMousePos();
  if (data.type === 'click-relative') {
    const bounds = mainWindow.getBounds();
    const screenX = bounds.x + data.x;
    const screenY = bounds.y + data.y;
    robot.moveMouse(screenX, screenY);
    robot.mouseClick();
  } else if (data.type === 'click') {
    robot.moveMouse(data.x, data.y);
    robot.mouseClick();
  } else if (data.type === 'type') {
    robot.typeString(data.text);
  } else if (data.type === 'paste') {
    robot.keyTap('v', process.platform === 'darwin' ? ['command'] : ['control']);
  } else if (data.type === 'clipboard-paste') {
    clipboard.writeText(data.text);
    robot.keyTap('a', process.platform === 'darwin' ? ['command'] : ['control']);
    robot.keyTap('v', process.platform === 'darwin' ? ['command'] : ['control']);
    robot.keyTap('enter');
  }
  robot.moveMouse(mousePos.x, mousePos.y);
});

ipcMain.on('send-message', (event, message) => {
  event.reply('dispatch-message', message, mainWindow.getBounds());
});

// 자동 리로드 (개발 중)
const electronReload = require('electron-reload');
electronReload(__dirname);

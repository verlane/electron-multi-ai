// index.js
const { app, BrowserWindow, ipcMain, clipboard, globalShortcut } = require('electron');
const robot = require('robotjs');
const windowStateKeeper = require('electron-window-state'); // 창 상태 관리 모듈

let mainWindow;

function createWindow() {
  // 이전 창 상태를 불러오고 기본값을 설정함
  let winState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800
  });

  mainWindow = new BrowserWindow({
    x: winState.x,             // 이전 창의 x 좌표
    y: winState.y,             // 이전 창의 y 좌표
    width: winState.width,     // 이전 창의 너비
    height: winState.height,   // 이전 창의 높이
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
    }
  });

  // 창 상태를 자동으로 관리(저장, 복원)
  winState.manage(mainWindow);

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  // 글로벌 단축키 등록: Ctrl+F -> 창 활성화 및 "chat-input" 포커싱
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

ipcMain.handle('get-window-bounds', () => {
  return mainWindow.getBounds();
});

// RobotJS를 이용한 IPC 이벤트 핸들러
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

// 자동 리로드
const electronReload = require('electron-reload');
electronReload(__dirname);

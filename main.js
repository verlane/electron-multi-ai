const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const ahkexepath = path.join(__dirname, 'AutoHotkey64.exe');

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
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
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
      if (mainWindow.isMinimized()) {
        mainWindow.restore(); // 최소화 복원
      }
      // mainWindow.show(); // ignore Snap Assist
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

let ahk = null;
async function loadAHK() {
  ahk = await require("ahknodejs")(ahkexepath, [
    { key: '\\', noInterrupt: true },
    { key: ']', noInterrupt: true },
  ]);
  while (true) {
    await ahk.waitForInterrupt();
    await ahk.sleep(5000);
  }
}
loadAHK().catch(error => console.log(error));

ipcMain.on('robot-actions', async (event, actions) => {
  const position = await ahk.getMousePos();
  for (const actionList of Object.values(actions)) {
    for (const action of actionList) {
      await robotAction(action);
      await ahk.sleep(100)
    }
  }
  await ahk.mouseMove({ x: position[0], y: position[1] });
});

async function robotAction(data) {
  if (data.type === 'click-relative') {
    const bounds = mainWindow.getBounds();
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const screenX = bounds.x * display.scaleFactor + data.x;
    const screenY = bounds.y * display.scaleFactor + data.y;
    await ahk.mouseMove({ x: screenX, y: screenY });
    await ahk.click();
  } else if (data.type === 'click') {
    await ahk.mouseMove({ x: data.x, y: data.y });
    await ahk.click();
  } else if (data.type === 'clipboard-paste') {
    await clipboard.writeText(data.text);
    await ahk.sleep(100);
    await ahk.send('^a^v');
  } else if (data.type === 'ahk') {
    await ahk.send(data.text);
  }
}

ipcMain.on('send-message', (event, message) => {
  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  event.reply('dispatch-message', message, bounds, display.scaleFactor);
});

// 자동 리로드 (개발 중)
const electronReload = require('electron-reload');
electronReload(__dirname);

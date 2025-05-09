# Multi AI Chat (Electron + AutoHotkey Integration)

Multi AI Chat is a cross-platform desktop app built with Electron that allows you to interact with multiple AI chat platforms—ChatGPT, Perplexity, and Grok—simultaneously through WebViews. It also supports message injection, UI automation, and AutoHotkey integration for native-like control.

## ✨ Features

- 📱 Multiple AI interfaces (ChatGPT, Perplexity, Grok) in one window
- ⌨️ Send messages with Enter or "Send" button
- ⚙️ AutoHotkey automation (clicks, pastes, key sequences)
- 🖱️ Accurate positioning of WebView elements with coordinate conversion
- 🧠 Auto-close annoying modals (e.g., Perplexity's "Get the App" banner)
- 🔐 Global shortcut: `Ctrl+Shift+Alt+H` focuses the input field
- 🪟 Remembers window position and size across sessions

## 🚀 Getting Started

### Prerequisites

- Node.js
- Yarn
- AutoHotkey64.exe (included in the project folder)

### Install

```bash
yarn install
```

### Run

```bash
yarn start
```

## 🔧 File Structure

- `main.js` — Electron main process (window, IPC, AHK automation)
- `renderer.js` — Renderer process (WebView message injection and actions)
- `index.html` — Multi-WebView layout with input bar
- `AutoHotkey64.exe` — Required for script-based automation

## ⌨️ Keyboard Shortcuts

- `Ctrl + Shift + Alt + H` — Focus the input field

## 🛠 How It Works

1. The user types a message and presses Enter or clicks Send.
2. The message is sent via IPC to `main.js`, which then redistributes it to all WebViews.
3. Each WebView calculates the prompt box's position and performs:
   - Relative mouse click
   - Clipboard paste
   - Optional keyboard actions (e.g., `{Tab 8}{Enter}`)
4. AutoHotkey performs real native actions such as clicking and key inputs.
5. Modal close buttons are auto-clicked every second using DOM detection.

## ⚠️ Security Notes

- `contextIsolation: false` and `nodeIntegration: true` are enabled for simplicity.
- Do **not** use this architecture for production apps without hardening your security configuration.

## 📦 Packaging

To build a distributable app, consider using [Electron Builder](https://www.electron.build/) and make sure to configure:

```js
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  preload: path.join(__dirname, 'preload.js') // if needed
}
```

## 📄 License

MIT License

## Demo

![Image](https://github.com/user-attachments/assets/c54f2892-10ac-40d4-b9c5-5aa8304a3215)
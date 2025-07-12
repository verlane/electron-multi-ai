# Multi AI Chat (Electron + JavaScript Automation)

Multi AI Chat is a cross-platform desktop app built with Electron that allows you to interact with multiple AI chat platforms—ChatGPT, Perplexity, and Grok—simultaneously through WebViews. It features JavaScript-based DOM manipulation for seamless UI automation across platforms.

## ✨ Features

- 📱 Multiple AI interfaces (ChatGPT, Perplexity, Grok) in one window
- ⌨️ Send messages with Enter or "Send" button
- 🔗 Cross-platform JavaScript DOM manipulation
- 🧠 Automatic clipboard copying of sent messages
- 🎯 Platform-specific input handling (ProseMirror, Lexical, textarea)
- 🚫 Auto-close annoying modals (e.g., Perplexity's "Get the App" banner)
- 🔐 Global shortcut: `Ctrl+Shift+Alt+H` focuses the input field
- 🪟 Remembers window position and size across sessions

## 🚀 Getting Started

### Prerequisites

- Node.js
- Yarn

### Install

```bash
yarn install
```

### Run

```bash
yarn start
```

## 🔧 File Structure

- `main.js` — Electron main process (window, IPC, clipboard integration)
- `renderer.js` — Renderer process (WebView JavaScript injection and DOM manipulation)
- `src/constants.js` — Platform configurations and selectors
- `index.html` — Multi-WebView layout with input bar
- `assets/style.css` — Dark theme styling

## ⌨️ Keyboard Shortcuts

- `Ctrl + Shift + Alt + H` — Focus the input field

## 🛠 How It Works

1. The user types a message and presses Enter or clicks Send.
2. The message is sent via IPC to `main.js`, which copies it to clipboard and dispatches to all WebViews.
3. Each WebView executes JavaScript to:
   - Find the appropriate input element (ProseMirror, Lexical, or textarea)
   - Clear existing content and inject the new message
   - Update React component state for proper detection
   - Trigger input events and click the submit button
4. Platform-specific handling ensures compatibility with different editor types.
5. Modal close buttons are auto-clicked using DOM detection.

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

![Image](https://github.com/user-attachments/assets/61c37769-fb28-4e1f-a05b-6088a7cb0127)
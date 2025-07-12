# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn install` - Install dependencies
- `yarn start` - Start the Electron application
- `yarn rebuild` - Rebuild native modules (use after Node.js version changes)

## Architecture Overview

This is an Electron desktop application that provides a unified interface for multiple AI chat platforms (ChatGPT, Perplexity, Grok) with cross-platform JavaScript automation for precise UI interaction.

### Core Components

- **main.js** - Electron main process that handles:
  - Window management with persistent state (position/size)
  - Global keyboard shortcuts (`Ctrl+Shift+Alt+H`)
  - IPC communication between main and renderer processes
  - Clipboard integration for message copying

- **renderer.js** - Renderer process that manages:
  - WebView JavaScript injection for DOM manipulation
  - Platform-specific selectors and interaction patterns
  - Modal auto-closing (Perplexity's "Get the App" banner)
  - Input field focusing and message dispatching

- **src/constants.js** - Platform configurations including:
  - Selectors for editors and submit buttons
  - Timing settings and retry logic
  - Event types for different input methods

- **index.html** - Multi-WebView layout with three persistent partitions
- **assets/style.css** - Dark theme styling with flexbox layout

### Key Technical Patterns

- **JavaScript Injection**: Uses `webview.executeJavaScript()` to directly manipulate DOM elements within each platform
- **React State Synchronization**: Updates React component state using fiber internals and `_valueTracker`
- **Cross-Platform Input**: Handles different editor types (ProseMirror, Lexical, textarea) with appropriate events
- **IPC Flow**: User input → `send-message` → main process → `dispatch-message` → renderer → JavaScript injection
- **WebView Isolation**: Each AI platform uses separate persistent partitions to maintain independent sessions
- **Security Configuration**: Uses `nodeIntegration: true` and `contextIsolation: false` for development simplicity

### Platform-Specific Implementation

- **ChatGPT**: ProseMirror editor manipulation with paragraph elements
- **Perplexity**: Dynamic handling of Lexical editor (first message) and textarea (subsequent messages)
- **Grok**: Textarea input with ESC key handling to close popups

### Dependencies

- **electron** - Main framework
- **electron-window-state** - Window state persistence
- **electron-reload** - Development auto-reload

### Platform-Specific Notes

- Cross-platform compatibility (no Windows-only dependencies)
- Window state is saved to `userData/window-state.json`
- Global shortcuts are automatically unregistered on app quit
- Messages are automatically copied to clipboard when sent
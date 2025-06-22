# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn install` - Install dependencies
- `yarn start` - Start the Electron application
- `yarn rebuild` - Rebuild native modules (use after Node.js version changes)

## Architecture Overview

This is an Electron desktop application that provides a unified interface for multiple AI chat platforms (ChatGPT, Perplexity, Grok) with AutoHotkey automation for precise UI interaction.

### Core Components

- **main.js** - Electron main process that handles:
  - Window management with persistent state (position/size)
  - Global keyboard shortcuts (`Ctrl+Shift+Alt+H`)
  - IPC communication between main and renderer processes
  - AutoHotkey integration via `ahknodejs` for native automation
  - Coordinate system conversion for multi-monitor setups

- **renderer.js** - Renderer process that manages:
  - WebView message injection and coordinate calculation
  - Platform-specific selectors (`#prompt-textarea` for ChatGPT, `#ask-input` for Perplexity)
  - Modal auto-closing (Perplexity's "Get the App" banner)
  - Input field focusing and message dispatching

- **index.html** - Multi-WebView layout with three persistent partitions
- **assets/style.css** - Dark theme styling with flexbox layout

### Key Technical Patterns

- **Coordinate Conversion**: Screen coordinates are calculated with DPI scaling (`display.scaleFactor`) and window bounds to ensure accurate clicking across different monitor configurations
- **IPC Flow**: User input → `send-message` → main process → `dispatch-message` → renderer → `robot-actions` → AutoHotkey execution
- **WebView Isolation**: Each AI platform uses separate persistent partitions to maintain independent sessions
- **Security Configuration**: Uses `nodeIntegration: true` and `contextIsolation: false` for development simplicity

### Dependencies

- **ahknodejs** - Custom fork (`verlane/AHKNodeJS-Electron`) for AutoHotkey integration
- **electron-window-state** - Window state persistence
- **electron-reload** - Development auto-reload
- **AutoHotkey64.exe** - Required binary for native automation (included in project)

### Platform-Specific Notes

- AutoHotkey integration only works on Windows
- Window state is saved to `userData/window-state.json`
- Global shortcuts are automatically unregistered on app quit
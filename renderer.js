const { ipcRenderer } = require('electron');

// ===== DOM Elements =====
const elements = {
  chatgpt: document.getElementById('chatgpt'),
  perplexity: document.getElementById('perplexity'),
  grok: document.getElementById('grok'),
  input: document.getElementById('chat-input'),
  sendButton: document.getElementById('send-btn')
};

const titleBarHeight = window.outerHeight - window.innerHeight;

// ===== Input Management =====
class InputManager {
  static setupEventHandlers() {
    elements.input.addEventListener('focus', this.handleFocus);
    elements.input.addEventListener('blur', this.handleBlur);
    elements.input.addEventListener('keydown', this.handleKeydown);
    elements.sendButton.addEventListener('click', this.handleSendClick);
  }

  static handleFocus() {
    // Reset IME when textarea gains focus
    setTimeout(() => {
      ipcRenderer.send('ime-reset');
    }, 100);
  }

  static handleBlur() {
    console.log('Input blurred - IME context may be lost');
  }

  static handleKeydown(e) {
    // Reset IME keepalive timer on any input
    ipcRenderer.send('reset-ime-timer');
    
    if (!e.ctrlKey && !e.shiftKey && e.key === 'Enter') {
      InputManager.sendMessage();
      e.preventDefault();
    }
  }

  static handleSendClick() {
    InputManager.sendMessage();
  }

  static sendMessage() {
    const message = elements.input.value.trim();
    if (message) {
      ipcRenderer.send('send-message', message);
      elements.input.value = '';
    }
  }

  static focus() {
    elements.input.focus();
  }
}

// ===== IPC Event Handlers =====
class IPCEventManager {
  static setupEventHandlers() {
    ipcRenderer.on('focus-chat', () => InputManager.focus());
    ipcRenderer.on('preload-space', this.handlePreloadSpace);
    ipcRenderer.on('clear-preload', this.handleClearPreload);
    ipcRenderer.on('dispatch-message', MessageDispatcher.handle);
  }

  static handlePreloadSpace() {
    elements.input.value = ' ';
    elements.input.focus();
  }

  static handleClearPreload() {
    if (elements.input.value === ' ') {
      elements.input.value = '';
    }
  }
}

// ===== Message Dispatcher =====
class MessageDispatcher {
  static async handle(_, message, mainWindowBounds, scaleFactor) {
    const actions = [];
    
    // Platform configurations
    const platforms = [
      { webview: elements.chatgpt, selector: '#prompt-textarea', keys: '{Tab 4}{Enter}' },
      { webview: elements.perplexity, selector: '#ask-input', keys: '{Enter}' },
      { webview: elements.grok, selector: 'textarea', keys: '{Enter}' }
    ];

    for (const platform of platforms) {
      const pos = await MessageDispatcher.getPromptPosition(platform.webview, platform.selector);
      if (pos) {
        actions.push(
          { type: 'click-relative', x: pos.x * 1.1 * scaleFactor, y: (pos.y + titleBarHeight) * scaleFactor * 1.01 },
          { type: 'clipboard-paste', text: message },
          { type: 'ahk', text: platform.keys }
        );
      }
    }

    ipcRenderer.send('robot-actions', actions);
  }

  static getPromptPosition(webview, selector = 'textarea') {
    const rect = webview.getBoundingClientRect();
    return webview.executeJavaScript(`
      (() => {
        const el = document.querySelector('${selector}');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        };
      })();
    `).then(position => {
      if (!position) return null;
      return {
        x: rect.left + position.x,
        y: rect.top + position.y,
      };
    });
  }
}

// ===== Modal Management =====
class ModalManager {
  static startAutoClose() {
    const closeModalInterval = setInterval(() => {
      elements.perplexity.executeJavaScript(`(() => {
        const btn = document.querySelector('[data-testid="close-modal"]');
        if (btn) {
          btn.click();
          return 'clicked';
        }
        return 'button not found';
      })();`).then(result => {
        console.log('Modal close result:', result);
        if (result === 'clicked') {
          clearInterval(closeModalInterval);
        }
      });
    }, 1000);
  }
}

// ===== App Initialization =====
window.addEventListener('DOMContentLoaded', () => {
  InputManager.setupEventHandlers();
  IPCEventManager.setupEventHandlers();
  ModalManager.startAutoClose();
  
  // Initial focus after delay
  setTimeout(() => {
    InputManager.focus();
  }, 3000);
});
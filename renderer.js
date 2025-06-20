const { ipcRenderer } = require('electron');

const chatgptWebview = document.getElementById('chatgpt');
const perplexityWebview = document.getElementById('perplexity');
const grokWebview = document.getElementById('grok');
const titleBarHeight = window.outerHeight - window.innerHeight;
const input = document.getElementById('chat-input');
const sendButton = document.getElementById('send-btn');

// 엔터키로 메시지 전송
input.addEventListener('keydown', (e) => {
  if (!e.ctrlKey && !e.shiftKey && e.key === 'Enter') {
    const message = input.value.trim();
    if (message) {
      ipcRenderer.send('send-message', message);
      input.value = '';
    }
    e.preventDefault();
  }
});

// 보내기 버튼 클릭 시 메시지 전송
sendButton.addEventListener('click', () => {
  const message = input.value.trim();
  if (message) {
    ipcRenderer.send('send-message', message);
    input.value = '';
  }
});

// 초기 포커스 설정
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    input.focus();
  }, 3000);
});

// 메인 프로세스에서 보낸 'focus-chat' 이벤트 수신 시 포커스
ipcRenderer.on('focus-chat', () => {
  focusChat();
});

function focusChat() {
  input.focus();
}

function getPromptPosition(webview, selector = 'textarea') {
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

ipcRenderer.on('dispatch-message', async (_, message, mainWindowBounds, scaleFactor) => {
  const actions = [];
  let pos = null;

  pos = await getPromptPosition(chatgptWebview, '#prompt-textarea');
  if (pos) {
    actions.push({ type: 'click-relative', x: pos.x * 1.1 * scaleFactor, y: (pos.y + titleBarHeight) * scaleFactor * 1.01 });
    actions.push({ type: 'clipboard-paste', text: message });
    actions.push({ type: 'ahk', text: '{Tab 4}{Enter}' });
  }

  pos = await getPromptPosition(perplexityWebview, '#ask-input');
  if (pos) {
    actions.push({ type: 'click-relative', x: pos.x * 1.1 * scaleFactor, y: (pos.y + titleBarHeight) * scaleFactor * 1.01 });
    actions.push({ type: 'clipboard-paste', text: message });
    actions.push({ type: 'ahk', text: '{Enter}' });
  }

  pos = await getPromptPosition(grokWebview);
  if (pos) {
    actions.push({ type: 'click-relative', x: pos.x * 1.1 * scaleFactor, y: (pos.y + titleBarHeight) * scaleFactor * 1.01 });
    actions.push({ type: 'clipboard-paste', text: message });
    actions.push({ type: 'ahk', text: '{Enter}' });
  }

  ipcRenderer.send('robot-actions', actions);
});

// Close App 추천 배너
let closeModalInterval = setInterval(() => {
  perplexityWebview.executeJavaScript(`(() => {
      const btn = document.querySelector('[data-testid="close-modal"]');
      if (btn) {
        btn.click();
        return 'clicked';
      } else {
        return 'button not found';
      }
    })();`).then(result => {
    console.log('버튼 클릭 결과:', result);
    if (result === 'clicked') {
      clearInterval(closeModalInterval); // 클릭 성공하면 반복 중단
    }
  });
}, 1000); // 1초마다 반복
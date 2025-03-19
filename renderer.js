const { ipcRenderer } = require('electron');

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
  input.focus();
});

let sendingCount = 0;

ipcRenderer.on('dispatch-message', (_, message, mainWindowBounds) => {
  // 창 너비와 최초 전송 여부에 따라 시나리오 키 결정
  const sizeKey = mainWindowBounds.width < 1600 ? 'small' : 'large';
  const sendKey = sendingCount < 1 ? 'first' : 'subsequent';

  // 시나리오별 액션 목록 정의
  const scenarios = {
    small: {
      first: {
        chatgpt: [
          { type: 'click-relative', x: 324, y: 1925 },
          { type: 'clipboard-paste', text: message },
          { type: 'click-relative', x: 589, y: 1992 }
        ],
        perplexity: [
          { type: 'click-relative', x: 930, y: 320 },
          { type: 'clipboard-paste', text: message }
        ],
        grok: [
          { type: 'click-relative', x: 1604, y: 1937 },
          { type: 'clipboard-paste', text: message }
        ],
      },
      subsequent: {
        chatgpt: [
          { type: 'click-relative', x: 324, y: 1925 },
          { type: 'clipboard-paste', text: message },
          { type: 'click-relative', x: 589, y: 1992 }
        ],
        perplexity: [
          { type: 'click-relative', x: 932, y: 1939 },
          { type: 'clipboard-paste', text: message }
        ],
        grok: [
          { type: 'click-relative', x: 1604, y: 1937 },
          { type: 'clipboard-paste', text: message }
        ],
      }
    },
    large: {
      first: {
        chatgpt: [
          { type: 'click-relative', x: 660, y: 1050 },
          { type: 'clipboard-paste', text: message }
        ],
        perplexity: [
          { type: 'click-relative', x: 2040, y: 1010 },
          { type: 'clipboard-paste', text: message }
        ],
        grok: [
          { type: 'click-relative', x: 3100, y: 1080 },
          { type: 'clipboard-paste', text: message }
        ]
      },
      subsequent: {
        chatgpt: [
          { type: 'click-relative', x: 634, y: 1917 },
          { type: 'clipboard-paste', text: message }
        ],
        perplexity: [
          { type: 'click-relative', x: 1950, y: 2000 },
          { type: 'clipboard-paste', text: message }
        ],
        grok: [
          { type: 'click-relative', x: 3060, y: 1940 },
          { type: 'clipboard-paste', text: message }
        ]
      }
    }
  };

  // 선택된 시나리오의 액션 전송
  const actions = scenarios[sizeKey][sendKey];
  ipcRenderer.send('robot-actions', actions);

  sendingCount++;

  setTimeout(() => {
    input.focus();
  }, 5000);
});

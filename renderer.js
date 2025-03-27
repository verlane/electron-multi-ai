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

ipcRenderer.on('dispatch-message', (_, message, mainWindowBounds, scaleFactor) => {
  // 창 너비와 최초 전송 여부에 따라 시나리오 키 결정
  const sizeKey = (mainWindowBounds.width * scaleFactor) < 2200 ? 'small' : 'large';
  const sendKey = sendingCount < 1 ? 'first' : 'subsequent';

  const distance = mainWindowBounds.width * scaleFactor / 3;
  const startX = distance / 2;
  const height = mainWindowBounds.height * scaleFactor;

  // 시나리오별 액션 목록 정의
  const scenarios = {
    small: {
      first: {
        chatgpt: [
          { type: 'click-relative', x: startX, y: height - 235 },
          { type: 'clipboard-paste', text: message },
          { type: 'click-relative', x: distance - 60, y: height - 170 }
        ],
        perplexity: [
          { type: 'click-relative', x: startX + distance * 1, y: 320 },
          { type: 'clipboard-paste', text: message }
        ],
        grok: [
          { type: 'click-relative', x: startX + distance * 2, y: height - 235 },
          { type: 'clipboard-paste', text: message }
        ],
        etc: [
          { type: 'click-relative', x: startX + (distance / 2) * 0.89, y: height - 400 },
        ],
      },
      subsequent: {
        chatgpt: [
          { type: 'click-relative', x: startX, y: height - 235 },
          { type: 'clipboard-paste', text: message },
          { type: 'click-relative', x: distance - 60, y: height - 170 }
        ],
        perplexity: [
          { type: 'click-relative', x: startX + distance * 1, y: height - 235 },
          { type: 'clipboard-paste', text: message }
        ],
        grok: [
          { type: 'click-relative', x: startX + distance * 2, y: height - 235 },
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
        ],
        // etc: [
        //   { type: 'click-relative', x: 890, y: 2100 },
        // ],
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
        ],
        // etc: [
        //   { type: 'click-relative', x: 890, y: 2100 },
        // ],
      }
    }
  };

  // 선택된 시나리오의 액션 전송
  const actions = scenarios[sizeKey][sendKey];
  ipcRenderer.send('robot-actions', actions);

  sendingCount++;

  // setTimeout(() => {
  //   input.focus();
  // }, 5000);
});

// Platform configurations and selectors
const PLATFORMS = {
  CHATGPT: {
    name: 'ChatGPT',
    webviewId: 'chatgpt',
    selectors: {
      editor: [
        '.ProseMirror[contenteditable="true"]',
        'div[contenteditable="true"]#prompt-textarea',
        '[data-placeholder*="무엇이든"]'
      ],
      submitButton: [
        'button[data-testid="send-button"]',
        'button[aria-label*="프롬프트 보내기"]',
        'button[aria-label*="Send"]',
        'form button[type="submit"]'
      ]
    },
    type: 'contenteditable',
    submitDelay: 100
  },
  
  PERPLEXITY: {
    name: 'Perplexity',
    webviewId: 'perplexity',
    selectors: {
      editor: [
        'textarea#ask-input',
        'div[contenteditable="true"]#ask-input',
        '[data-lexical-editor="true"]',
        'div[contenteditable="true"]',
        'textarea[placeholder*="추가"]',
        '[aria-placeholder*="아무거나"]',
        '[role="textbox"]'
      ],
      submitButton: [
        'button[data-testid="submit-button"]',
        'button[aria-label="Submit"]',
        'button[aria-label*="제출"]'
      ]
    },
    type: 'hybrid', // can be textarea or contenteditable
    submitDelay: 300,
    focusDelay: 200,
    retryCount: 5,
    retryDelay: 1000
  },
  
  GROK: {
    name: 'Grok',
    webviewId: 'grok',
    selectors: {
      editor: [
        'textarea[aria-label="Ask Grok anything"]',
        'textarea',
        '[placeholder*="What do you want"]',
        '[placeholder*="How can Grok"]'
      ],
      submitButton: [
        'button[type="submit"][aria-label="Submit"]',
        'button[type="submit"]',
        'button[aria-label="Submit"]',
        'form button[type="submit"]'
      ]
    },
    type: 'textarea',
    submitDelay: 300,
    focusDelay: 300,
    retryCount: 5,
    retryDelay: 1000,
    needsEscapeKey: true
  }
};

const TIMING = {
  INITIAL_FOCUS_DELAY: 3000,
  MODAL_CHECK_INTERVAL: 1000,
  BUTTON_RETRY_DELAY: 500
};

const EVENTS = {
  TEXTAREA: ['focus', 'input', 'change', 'keyup', 'keydown'],
  CONTENTEDITABLE: ['input', 'keyup', 'change', 'blur', 'focus']
};

module.exports = { PLATFORMS, TIMING, EVENTS };
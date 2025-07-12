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
    console.log('Input focused');
  }

  static handleBlur() {
    console.log('Input blurred');
  }

  static handleKeydown(e) {
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
  static async handle(_, message) {
    // Send to all platforms
    await MessageDispatcher.sendToChatGPT(message);
    await MessageDispatcher.sendToPerplexity(message);
    await MessageDispatcher.sendToGrok(message);
  }

  static async sendToChatGPT(message) {
    try {
      const result = await elements.chatgpt.executeJavaScript(`
        (() => {
          // Find the ProseMirror editor
          const editor = document.querySelector('.ProseMirror[contenteditable="true"]') ||
                        document.querySelector('div[contenteditable="true"]#prompt-textarea') ||
                        document.querySelector('[data-placeholder*="무엇이든"]');
          
          if (!editor) {
            return { success: false, error: 'Editor not found' };
          }

          // Focus first
          editor.focus();
          
          // Clear existing content
          editor.innerHTML = '';
          
          // Create text node and add to editor
          const text = '${message.replace(/'/g, "\\'")}';
          const paragraph = document.createElement('p');
          paragraph.textContent = text;
          editor.appendChild(paragraph);
          
          // Trigger input events
          const inputEvent = new Event('input', { bubbles: true });
          editor.dispatchEvent(inputEvent);
          
          const changeEvent = new Event('change', { bubbles: true });
          editor.dispatchEvent(changeEvent);
          
          // Wait a bit for the submit button to appear
          setTimeout(() => {
            // Look for submit button - it should appear after text input
            const submitButton = document.querySelector('button[data-testid="send-button"]') ||
                                document.querySelector('button[aria-label*="프롬프트 보내기"]') ||
                                document.querySelector('button[aria-label*="Send"]') ||
                                document.querySelector('form button[type="submit"]') ||
                                // Look for button with the specific SVG path you showed
                                Array.from(document.querySelectorAll('button')).find(btn => {
                                  const svg = btn.querySelector('svg');
                                  return svg && svg.innerHTML.includes('M8.99992 16V6.41407');
                                });
            
            if (submitButton && !submitButton.disabled) {
              submitButton.click();
              console.log('Submit button clicked successfully');
            } else {
              console.log('Submit button not found or disabled');
            }
          }, 100);
          
          return { 
            success: true, 
            message: 'Text input completed',
            finalContent: editor.innerHTML
          };
        })();
      `);

      console.log('ChatGPT input result:', result);
    } catch (error) {
      console.error('Error inputting message to ChatGPT:', error);
    }
  }

  static async sendToPerplexity(message) {
    try {
      const result = await elements.perplexity.executeJavaScript(`
        (() => {
          return new Promise((resolve) => {
            const attemptInput = (retryCount = 0) => {
              // Find input element - could be Lexical editor or textarea after first message
              let editor = document.querySelector('textarea#ask-input') ||
                          document.querySelector('div[contenteditable="true"]#ask-input') ||
                          document.querySelector('[data-lexical-editor="true"]') ||
                          document.querySelector('div[contenteditable="true"]') ||
                          document.querySelector('textarea[placeholder*="추가"]') ||
                          document.querySelector('[aria-placeholder*="아무거나"]') ||
                          document.querySelector('[role="textbox"]');
              
              // Debug: log what we find
              console.log('Editor search result:', editor);
              console.log('Editor type:', editor ? editor.tagName : 'not found');
              console.log('Available inputs:', {
                textareas: document.querySelectorAll('textarea').length,
                contenteditable: document.querySelectorAll('[contenteditable="true"]').length
              });
              
              if (!editor) {
                if (retryCount < 5) { // Increased retry count
                  console.log('Editor not found, retrying...', retryCount);
                  setTimeout(() => attemptInput(retryCount + 1), 1000); // Increased delay
                  return;
                }
                resolve({ success: false, error: 'Editor not found after retries' });
                return;
              }

              // Focus first
              editor.focus();
              
              // Wait a bit for focus to complete
              setTimeout(() => {
                const text = '${message.replace(/'/g, "\\'")}';
                
                if (editor.tagName === 'TEXTAREA') {
                  // Handle textarea (after first message)
                  // Clear first
                  editor.value = '';
                  
                  // Use property setter to ensure React detects change
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                  nativeInputValueSetter.call(editor, text);
                  
                  // Trigger multiple events for textarea
                  const events = ['focus', 'input', 'change', 'keyup', 'keydown'];
                  events.forEach(eventType => {
                    let event;
                    if (eventType === 'keyup' || eventType === 'keydown') {
                      event = new KeyboardEvent(eventType, { bubbles: true, key: 'a' });
                    } else {
                      event = new Event(eventType, { bubbles: true });
                    }
                    editor.dispatchEvent(event);
                  });
                  
                  // Additional React state update attempt
                  const reactKey = Object.keys(editor).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
                  if (reactKey) {
                    const reactInstance = editor[reactKey];
                    if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
                      reactInstance.memoizedProps.onChange({ target: { value: text } });
                    }
                  }
                  
                } else {
                  // Handle contenteditable div (Lexical editor - first message)
                  // Clear existing content and set selection
                  editor.innerHTML = '<p><br></p>';
                  
                  // Set cursor position to the paragraph
                  const range = document.createRange();
                  const selection = window.getSelection();
                  const p = editor.querySelector('p');
                  range.setStart(p, 0);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  
                  // Simulate typing using document.execCommand (works better with Lexical)
                  document.execCommand('insertText', false, text);
                  
                  // Alternative method if execCommand doesn't work
                  if (editor.innerHTML === '<p><br></p>' || !editor.textContent.includes(text)) {
                    editor.innerHTML = '<p>' + text + '</p>';
                    
                    // Trigger multiple events for Lexical
                    ['input', 'keyup', 'change', 'blur', 'focus'].forEach(eventType => {
                      const event = new Event(eventType, { bubbles: true });
                      editor.dispatchEvent(event);
                    });
                  }
                }
                
                // Wait a bit for the submit button to appear/activate
                setTimeout(() => {
                  const submitButton = document.querySelector('button[data-testid="submit-button"]') ||
                                      document.querySelector('button[aria-label="Submit"]') ||
                                      document.querySelector('button[aria-label*="제출"]');
                  
                  console.log('Submit button state:', {
                    found: !!submitButton,
                    disabled: submitButton ? submitButton.disabled : 'not found',
                    classes: submitButton ? submitButton.className : 'not found',
                    text: submitButton ? submitButton.textContent : 'not found'
                  });
                  
                  if (submitButton) {
                    if (!submitButton.disabled) {
                      submitButton.click();
                      console.log('Perplexity submit button clicked successfully');
                    } else {
                      // Try to wait a bit more for button to become enabled
                      setTimeout(() => {
                        if (!submitButton.disabled) {
                          submitButton.click();
                          console.log('Perplexity submit button clicked after delay');
                        } else {
                          console.log('Perplexity submit button still disabled after delay');
                        }
                      }, 500);
                    }
                  } else {
                    console.log('Perplexity submit button not found');
                  }
                }, 300); // Increased wait time
                
                resolve({ 
                  success: true, 
                  message: 'Text input completed',
                  finalContent: editor.tagName === 'TEXTAREA' ? editor.value : editor.innerHTML,
                  editorType: editor.tagName,
                  retryCount: retryCount
                });
              }, 200); // Wait 200ms after focus
            };
            
            attemptInput();
          });
        })();
      `);

      console.log('Perplexity input result:', result);
    } catch (error) {
      console.error('Error inputting message to Perplexity:', error);
    }
  }

  static async sendToGrok(message) {
    try {
      const result = await elements.grok.executeJavaScript(`
        (() => {
          return new Promise((resolve) => {
            const attemptInput = (retryCount = 0) => {
              // Find the textarea
              const textarea = document.querySelector('textarea[aria-label="Ask Grok anything"]') ||
                              document.querySelector('textarea') ||
                              document.querySelector('[placeholder*="What do you want"]') ||
                              document.querySelector('[placeholder*="How can Grok"]');
              
              console.log('Grok textarea search result:', textarea);
              
              if (!textarea) {
                if (retryCount < 5) {
                  console.log('Grok textarea not found, retrying...', retryCount);
                  setTimeout(() => attemptInput(retryCount + 1), 1000);
                  return;
                }
                resolve({ success: false, error: 'Textarea not found after retries' });
                return;
              }

              // Focus first
              textarea.focus();
              
              // Wait a bit for focus to complete
              setTimeout(() => {
                const text = '${message.replace(/'/g, "\\'")}';
                
                // Clear first
                textarea.value = '';
                
                // Use property setter to ensure React detects change
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeInputValueSetter.call(textarea, text);
                
                // Trigger multiple events for textarea
                const events = ['focus', 'input', 'change', 'keyup', 'keydown'];
                events.forEach(eventType => {
                  let event;
                  if (eventType === 'keyup' || eventType === 'keydown') {
                    event = new KeyboardEvent(eventType, { bubbles: true, key: 'a' });
                  } else {
                    event = new Event(eventType, { bubbles: true });
                  }
                  textarea.dispatchEvent(event);
                });
                
                // Additional React state update attempt
                const reactKey = Object.keys(textarea).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
                if (reactKey) {
                  const reactInstance = textarea[reactKey];
                  if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
                    reactInstance.memoizedProps.onChange({ target: { value: text } });
                  }
                }
                
                // Wait for submit button to activate and click
                setTimeout(() => {
                  const submitButton = document.querySelector('button[type="submit"][aria-label="Submit"]') ||
                                      document.querySelector('button[type="submit"]') ||
                                      document.querySelector('button[aria-label="Submit"]') ||
                                      document.querySelector('form button[type="submit"]');
                  
                  console.log('Grok submit button state:', {
                    found: !!submitButton,
                    disabled: submitButton ? submitButton.disabled : 'not found',
                    classes: submitButton ? submitButton.className : 'not found'
                  });
                  
                  if (submitButton) {
                    if (!submitButton.disabled) {
                      submitButton.click();
                      console.log('Grok submit button clicked successfully');
                    } else {
                      // Try to wait a bit more for button to become enabled
                      setTimeout(() => {
                        if (!submitButton.disabled) {
                          submitButton.click();
                          console.log('Grok submit button clicked after delay');
                        } else {
                          console.log('Grok submit button still disabled after delay');
                        }
                      }, 500);
                    }
                  } else {
                    console.log('Grok submit button not found');
                  }
                }, 300);
                
                resolve({ 
                  success: true, 
                  message: 'Text input completed',
                  finalContent: textarea.value,
                  retryCount: retryCount
                });
              }, 200);
            };
            
            attemptInput();
          });
        })();
      `);

      console.log('Grok input result:', result);
    } catch (error) {
      console.error('Error inputting message to Grok:', error);
    }
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
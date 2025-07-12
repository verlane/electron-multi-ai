const { ipcRenderer } = require('electron');
const { PLATFORMS, TIMING } = require('./src/constants.js');

// ===== DOM Elements =====
const elements = {
  chatgpt: document.getElementById('chatgpt'),
  perplexity: document.getElementById('perplexity'),
  grok: document.getElementById('grok'),
  input: document.getElementById('chat-input'),
  sendButton: document.getElementById('send-btn')
};

// ===== Platform Handlers =====
class PlatformHandler {
  static async sendToChatGPT(message) {
    const config = PLATFORMS.CHATGPT;
    try {
      const result = await elements.chatgpt.executeJavaScript(`
        (() => {
          const findElement = (selectors) => {
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) return element;
            }
            return null;
          };

          const editor = findElement(${JSON.stringify(config.selectors.editor)});
          if (!editor) {
            return { success: false, error: 'Editor not found' };
          }

          editor.focus();
          editor.innerHTML = '';
          
          const paragraph = document.createElement('p');
          paragraph.textContent = '${message.replace(/'/g, "\\'")}';
          editor.appendChild(paragraph);
          
          const inputEvent = new Event('input', { bubbles: true });
          editor.dispatchEvent(inputEvent);
          const changeEvent = new Event('change', { bubbles: true });
          editor.dispatchEvent(changeEvent);
          
          setTimeout(() => {
            const submitButton = findElement(${JSON.stringify(config.selectors.submitButton)}) ||
                                Array.from(document.querySelectorAll('button')).find(btn => {
                                  const svg = btn.querySelector('svg');
                                  return svg && svg.innerHTML.includes('M8.99992 16V6.41407');
                                });
            
            if (submitButton && !submitButton.disabled) {
              submitButton.click();
              console.log('ChatGPT submit button clicked successfully');
            } else {
              console.log('ChatGPT submit button not found or disabled');
            }
          }, ${config.submitDelay});
          
          return { success: true, message: 'Text input completed', finalContent: editor.innerHTML };
        })();
      `);

      console.log('ChatGPT input result:', result);
    } catch (error) {
      console.error('Error inputting message to ChatGPT:', error);
    }
  }

  static async sendToPerplexity(message) {
    const config = PLATFORMS.PERPLEXITY;
    try {
      const result = await elements.perplexity.executeJavaScript(`
        (() => {
          return new Promise((resolve) => {
            const findElement = (selectors) => {
              for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return element;
              }
              return null;
            };

            const updateReactState = (element, value) => {
              const reactKey = Object.keys(element).find(key => 
                key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
              );
              if (reactKey) {
                const reactInstance = element[reactKey];
                if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
                  reactInstance.memoizedProps.onChange({ target: { value } });
                }
              }
            };

            const dispatchEvents = (element, eventTypes) => {
              eventTypes.forEach(eventType => {
                let event;
                if (eventType === 'keyup' || eventType === 'keydown') {
                  event = new KeyboardEvent(eventType, { bubbles: true, key: 'a' });
                } else {
                  event = new Event(eventType, { bubbles: true });
                }
                element.dispatchEvent(event);
              });
            };

            const attemptInput = (retryCount = 0) => {
              const editor = findElement(${JSON.stringify(config.selectors.editor)});
              
              
              if (!editor) {
                if (retryCount < ${config.retryCount}) {
                  console.log('Perplexity editor not found, retrying...', retryCount);
                  setTimeout(() => attemptInput(retryCount + 1), ${config.retryDelay});
                  return;
                }
                resolve({ success: false, error: 'Editor not found after retries' });
                return;
              }

              editor.focus();
              
              setTimeout(() => {
                const text = '${message.replace(/'/g, "\\'")}';
                
                if (editor.tagName === 'TEXTAREA') {
                  editor.value = '';
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                  nativeInputValueSetter.call(editor, text);
                  dispatchEvents(editor, ['focus', 'input', 'change', 'keyup', 'keydown']);
                  updateReactState(editor, text);
                } else {
                  editor.innerHTML = '<p><br></p>';
                  const range = document.createRange();
                  const selection = window.getSelection();
                  const p = editor.querySelector('p');
                  if (p) {
                    range.setStart(p, 0);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                  
                  document.execCommand('insertText', false, text);
                  
                  if (editor.innerHTML === '<p><br></p>' || !editor.textContent.includes(text)) {
                    editor.innerHTML = '<p>' + text + '</p>';
                    dispatchEvents(editor, ['input', 'keyup', 'change', 'blur', 'focus']);
                  }
                }
                
                setTimeout(() => {
                  const submitButton = findElement(${JSON.stringify(config.selectors.submitButton)});
                  
                  
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
                }, ${config.submitDelay});
                
                resolve({ 
                  success: true, 
                  message: 'Text input completed',
                  finalContent: editor.tagName === 'TEXTAREA' ? editor.value : editor.innerHTML,
                  editorType: editor.tagName,
                  retryCount: retryCount
                });
              }, ${config.focusDelay});
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
    const config = PLATFORMS.GROK;
    try {
      const result = await elements.grok.executeJavaScript(`
        (() => {
          return new Promise((resolve) => {
            const findElement = (selectors) => {
              for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return element;
              }
              return null;
            };

            const updateReactState = (element, value) => {
              const reactKey = Object.keys(element).find(key => 
                key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
              );
              if (reactKey) {
                const reactInstance = element[reactKey];
                if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
                  reactInstance.memoizedProps.onChange({ target: { value } });
                }
              }
            };

            const dispatchEvents = (element, eventTypes) => {
              eventTypes.forEach(eventType => {
                let event;
                if (eventType === 'keyup' || eventType === 'keydown') {
                  event = new KeyboardEvent(eventType, { bubbles: true, key: 'a' });
                } else {
                  event = new Event(eventType, { bubbles: true });
                }
                element.dispatchEvent(event);
              });
            };

            const attemptInput = (retryCount = 0) => {
              const textarea = findElement(${JSON.stringify(config.selectors.editor)});
              
              
              if (!textarea) {
                if (retryCount < ${config.retryCount}) {
                  console.log('Grok textarea not found, retrying...', retryCount);
                  setTimeout(() => attemptInput(retryCount + 1), ${config.retryDelay});
                  return;
                }
                resolve({ success: false, error: 'Textarea not found after retries' });
                return;
              }

              textarea.focus();
              ${config.needsEscapeKey ? `
              const escEvent = new KeyboardEvent('keydown', { 
                key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true 
              });
              document.dispatchEvent(escEvent);
              ` : ''}
              
              setTimeout(() => {
                const text = '${message.replace(/'/g, "\\'")}';
                textarea.value = '';
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeInputValueSetter.call(textarea, text);
                
                dispatchEvents(textarea, ['focus', 'input', 'change', 'keyup', 'keydown']);
                updateReactState(textarea, text);
                
                setTimeout(() => {
                  const submitButton = findElement(${JSON.stringify(config.selectors.submitButton)});
                  
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
                }, ${config.submitDelay});
                
                resolve({ 
                  success: true, 
                  message: 'Text input completed',
                  finalContent: textarea.value,
                  retryCount: retryCount
                });
              }, ${config.focusDelay});
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
    try {
      await Promise.allSettled([
        PlatformHandler.sendToChatGPT(message),
        PlatformHandler.sendToPerplexity(message),
        PlatformHandler.sendToGrok(message)
      ]);
    } catch (error) {
      console.error('Error dispatching messages:', error);
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
    }, TIMING.MODAL_CHECK_INTERVAL);
  }
}

// ===== App Initialization =====
window.addEventListener('DOMContentLoaded', () => {
  InputManager.setupEventHandlers();
  IPCEventManager.setupEventHandlers();
  ModalManager.startAutoClose();
  
  setTimeout(() => {
    InputManager.focus();
  }, TIMING.INITIAL_FOCUS_DELAY);
});
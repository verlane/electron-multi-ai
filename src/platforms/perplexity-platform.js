import { BasePlatform } from './base-platform.js';
import { EVENTS } from '../constants.js';

export class PerplexityPlatform extends BasePlatform {
  getInjectionFunction() {
    return ({ message, config }) => {
      return new Promise((resolve) => {
        // Import utilities
        const DOMUtils = {
          findElement: (selectors) => {
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) return element;
            }
            return null;
          },
          
          getNativeInputSetter: (element) => {
            return Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          },
          
          updateReactState: (element, value) => {
            const reactKey = Object.keys(element).find(key => 
              key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
            );
            
            if (reactKey) {
              const reactInstance = element[reactKey];
              if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
                reactInstance.memoizedProps.onChange({ target: { value } });
              }
            }
          },
          
          dispatchEvents: (element, eventTypes) => {
            eventTypes.forEach(eventType => {
              let event;
              if (eventType === 'keyup' || eventType === 'keydown') {
                event = new KeyboardEvent(eventType, { bubbles: true, key: 'a' });
              } else {
                event = new Event(eventType, { bubbles: true });
              }
              element.dispatchEvent(event);
            });
          },
          
          setCursorPosition: (element) => {
            const range = document.createRange();
            const selection = window.getSelection();
            const p = element.querySelector('p');
            
            if (p) {
              range.setStart(p, 0);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        };

        const attemptInput = (retryCount = 0) => {
          const editor = DOMUtils.findElement(config.selectors.editor);
          
          console.log('Perplexity editor search result:', editor);
          console.log('Editor type:', editor ? editor.tagName : 'not found');
          console.log('Available inputs:', {
            textareas: document.querySelectorAll('textarea').length,
            contenteditable: document.querySelectorAll('[contenteditable="true"]').length
          });
          
          if (!editor) {
            if (retryCount < config.retryCount) {
              console.log('Perplexity editor not found, retrying...', retryCount);
              setTimeout(() => attemptInput(retryCount + 1), config.retryDelay);
              return;
            }
            resolve({ success: false, error: 'Editor not found after retries' });
            return;
          }

          // Focus first
          editor.focus();
          
          // Wait for focus to complete
          setTimeout(() => {
            if (editor.tagName === 'TEXTAREA') {
              // Handle textarea (after first message)
              editor.value = '';
              const nativeInputValueSetter = DOMUtils.getNativeInputSetter(editor);
              nativeInputValueSetter.call(editor, message);
              
              DOMUtils.dispatchEvents(editor, ['focus', 'input', 'change', 'keyup', 'keydown']);
              DOMUtils.updateReactState(editor, message);
              
            } else {
              // Handle contenteditable div (Lexical editor - first message)
              editor.innerHTML = '<p><br></p>';
              DOMUtils.setCursorPosition(editor);
              
              // Try document.execCommand first
              document.execCommand('insertText', false, message);
              
              // Fallback method
              if (editor.innerHTML === '<p><br></p>' || !editor.textContent.includes(message)) {
                editor.innerHTML = '<p>' + message + '</p>';
                DOMUtils.dispatchEvents(editor, ['input', 'keyup', 'change', 'blur', 'focus']);
              }
            }
            
            // Find and click submit button
            setTimeout(() => {
              const submitButton = DOMUtils.findElement(config.selectors.submitButton);
              
              console.log('Perplexity submit button state:', {
                found: !!submitButton,
                disabled: submitButton ? submitButton.disabled : 'not found',
                classes: submitButton ? submitButton.className : 'not found'
              });
              
              if (submitButton) {
                if (!submitButton.disabled) {
                  submitButton.click();
                  console.log('Perplexity submit button clicked successfully');
                } else {
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
            }, config.submitDelay);
            
            resolve({ 
              success: true, 
              message: 'Text input completed',
              finalContent: editor.tagName === 'TEXTAREA' ? editor.value : editor.innerHTML,
              editorType: editor.tagName,
              retryCount: retryCount
            });
          }, config.focusDelay);
        };
        
        attemptInput();
      });
    };
  }
}
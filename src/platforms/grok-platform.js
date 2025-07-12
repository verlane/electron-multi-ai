import { BasePlatform } from './base-platform.js';
import { EVENTS } from '../constants.js';

export class GrokPlatform extends BasePlatform {
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
          
          sendEscapeKey: () => {
            const escEvent = new KeyboardEvent('keydown', { 
              key: 'Escape', 
              code: 'Escape', 
              keyCode: 27,
              bubbles: true 
            });
            document.dispatchEvent(escEvent);
          }
        };

        const attemptInput = (retryCount = 0) => {
          const textarea = DOMUtils.findElement(config.selectors.editor);
          
          console.log('Grok textarea search result:', textarea);
          
          if (!textarea) {
            if (retryCount < config.retryCount) {
              console.log('Grok textarea not found, retrying...', retryCount);
              setTimeout(() => attemptInput(retryCount + 1), config.retryDelay);
              return;
            }
            resolve({ success: false, error: 'Textarea not found after retries' });
            return;
          }

          // Send ESC key first to close any popups
          textarea.focus();
          if (config.needsEscapeKey) {
            DOMUtils.sendEscapeKey();
          }
          
          // Wait for ESC to take effect and focus to complete
          setTimeout(() => {
            // Clear and set value
            textarea.value = '';
            const nativeInputValueSetter = DOMUtils.getNativeInputSetter(textarea);
            nativeInputValueSetter.call(textarea, message);
            
            // Trigger events
            DOMUtils.dispatchEvents(textarea, ['focus', 'input', 'change', 'keyup', 'keydown']);
            DOMUtils.updateReactState(textarea, message);
            
            // Find and click submit button
            setTimeout(() => {
              const submitButton = DOMUtils.findElement(config.selectors.submitButton);
              
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
            }, config.submitDelay);
            
            resolve({ 
              success: true, 
              message: 'Text input completed',
              finalContent: textarea.value,
              retryCount: retryCount
            });
          }, config.focusDelay);
        };
        
        attemptInput();
      });
    };
  }
}
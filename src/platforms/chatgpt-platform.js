import { BasePlatform } from './base-platform.js';
import { EVENTS } from '../constants.js';

export class ChatGPTPlatform extends BasePlatform {
  getInjectionFunction() {
    return ({ message, config }) => {
      // Import utilities
      const DOMUtils = {
        findElement: (selectors) => {
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
          }
          return null;
        }
      };

      // Find the ProseMirror editor
      const editor = DOMUtils.findElement(config.selectors.editor);
      
      if (!editor) {
        return { success: false, error: 'Editor not found' };
      }

      // Focus and clear
      editor.focus();
      editor.innerHTML = '';
      
      // Create and add content
      const paragraph = document.createElement('p');
      paragraph.textContent = message;
      editor.appendChild(paragraph);
      
      // Trigger events
      const inputEvent = new Event('input', { bubbles: true });
      editor.dispatchEvent(inputEvent);
      
      const changeEvent = new Event('change', { bubbles: true });
      editor.dispatchEvent(changeEvent);
      
      // Find and click submit button
      setTimeout(() => {
        const submitButton = DOMUtils.findElement(config.selectors.submitButton) ||
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
      }, config.submitDelay);
      
      return { 
        success: true, 
        message: 'Text input completed',
        finalContent: editor.innerHTML
      };
    };
  }
}
import { DOMUtils } from '../utils/dom-utils.js';
import { TIMING, EVENTS } from '../constants.js';

export class BasePlatform {
  constructor(config) {
    this.config = config;
  }

  /**
   * Send message to platform
   */
  async sendMessage(webview, message) {
    try {
      const result = await webview.executeJavaScript(this.generateScript(message));
      console.log(`${this.config.name} input result:`, result);
      return result;
    } catch (error) {
      console.error(`Error inputting message to ${this.config.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate injection script for the platform
   */
  generateScript(message) {
    return `
      (${this.getInjectionFunction.toString()})(${JSON.stringify({
        message: message,
        config: this.config
      })});
    `;
  }

  /**
   * Base injection function (to be overridden)
   */
  getInjectionFunction() {
    return ({ message, config }) => {
      return new Promise((resolve) => {
        // Import utilities into the injected context
        ${DOMUtils.toString()}

        const attemptInput = (retryCount = 0) => {
          const editor = DOMUtils.findElement(config.selectors.editor);
          
          if (!editor) {
            if (retryCount < (config.retryCount || 3)) {
              setTimeout(() => attemptInput(retryCount + 1), config.retryDelay || 1000);
              return;
            }
            resolve({ success: false, error: 'Editor not found after retries' });
            return;
          }

          this.handleInput(editor, message, config, resolve, retryCount);
        };

        attemptInput();
      });
    };
  }

  /**
   * Handle input for the specific platform (to be implemented by subclasses)
   */
  handleInput(editor, message, config, resolve, retryCount) {
    throw new Error('handleInput must be implemented by subclass');
  }

  /**
   * Find and click submit button
   */
  findAndClickSubmitButton(config, delay = 300) {
    setTimeout(() => {
      const submitButton = DOMUtils.findElement(config.selectors.submitButton);
      
      console.log(`${config.name} submit button state:`, {
        found: !!submitButton,
        disabled: submitButton ? submitButton.disabled : 'not found',
        classes: submitButton ? submitButton.className : 'not found'
      });
      
      if (submitButton) {
        if (!submitButton.disabled) {
          submitButton.click();
          console.log(`${config.name} submit button clicked successfully`);
        } else {
          // Retry after delay
          setTimeout(() => {
            if (!submitButton.disabled) {
              submitButton.click();
              console.log(`${config.name} submit button clicked after delay`);
            } else {
              console.log(`${config.name} submit button still disabled after delay`);
            }
          }, TIMING.BUTTON_RETRY_DELAY);
        }
      } else {
        console.log(`${config.name} submit button not found`);
      }
    }, delay);
  }
}
// DOM utility functions for cross-platform input handling

export class DOMUtils {
  /**
   * Find element using multiple selectors
   */
  static findElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }

  /**
   * Get native property setter for input elements
   */
  static getNativeInputSetter(element) {
    if (element.tagName === 'TEXTAREA') {
      return Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    }
    return Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  }

  /**
   * Update React component state
   */
  static updateReactState(element, value) {
    const reactKey = Object.keys(element).find(key => 
      key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')
    );
    
    if (reactKey) {
      const reactInstance = element[reactKey];
      if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
        reactInstance.memoizedProps.onChange({ target: { value } });
      }
    }
  }

  /**
   * Dispatch multiple events on an element
   */
  static dispatchEvents(element, eventTypes) {
    eventTypes.forEach(eventType => {
      let event;
      if (eventType === 'keyup' || eventType === 'keydown') {
        event = new KeyboardEvent(eventType, { bubbles: true, key: 'a' });
      } else {
        event = new Event(eventType, { bubbles: true });
      }
      element.dispatchEvent(event);
    });
  }

  /**
   * Send escape key to close popups
   */
  static sendEscapeKey() {
    const escEvent = new KeyboardEvent('keydown', { 
      key: 'Escape', 
      code: 'Escape', 
      keyCode: 27,
      bubbles: true 
    });
    document.dispatchEvent(escEvent);
  }

  /**
   * Set up cursor position for contenteditable elements
   */
  static setCursorPosition(element) {
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
}
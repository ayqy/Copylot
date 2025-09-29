/**
 * Event simulation utilities for realistic user interactions
 * Based on user-event library principles for better framework compatibility
 */

/**
 * Simulates a realistic click event on an element
 * @param element The element to click
 */
export function simulateClick(element: HTMLElement): void {
  // Dispatch sequence of events that frameworks expect
  const events = ['mousedown', 'mouseup', 'click'];
  
  events.forEach(eventType => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0,
      buttons: 1,
    });
    element.dispatchEvent(event);
  });
}

/**
 * Simulates realistic typing into an input element
 * @param input The input element to type into
 * @param text The text to type
 */
export function simulateType(input: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  // Focus the input first
  input.focus();
  
  // Clear existing value
  input.value = '';
  
  // Type character by character
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    input.value += char;
    
    // Dispatch input event after each character
    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: char,
      inputType: 'insertText',
    });
    input.dispatchEvent(inputEvent);
  }
  
  // Dispatch change event at the end
  const changeEvent = new Event('change', {
    bubbles: true,
    cancelable: true,
  });
  input.dispatchEvent(changeEvent);
}

/**
 * Simulates pasting HTML content into an element
 * @param target The target element
 * @param html The HTML content to paste
 */
export function simulatePaste(target: Element, html: string): void {
  // Focus the target first
  if (target instanceof HTMLElement) {
    target.focus();
  }
  
  // Method 1: Try using execCommand (works in many rich text editors)
  try {
    const success = document.execCommand('insertHTML', false, html);
    if (success) {
      console.log('Successfully pasted using execCommand');
      return;
    }
  } catch (error) {
    console.warn('execCommand failed, trying clipboard API method:', error);
  }
  
  // Method 2: Simulate paste event with clipboard data
  try {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/html', html);
    clipboardData.setData('text/plain', html.replace(/<[^>]*>/g, ''));
    
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: clipboardData,
    });
    
    target.dispatchEvent(pasteEvent);
    console.log('Dispatched paste event with clipboard data');
  } catch (error) {
    console.warn('Paste event simulation failed:', error);
    
    // Method 3: Fallback - try to set innerHTML directly
    if (target instanceof HTMLElement) {
      target.innerHTML = html;
      console.log('Fallback: Set innerHTML directly');
    }
  }
}

/**
 * Simulates focus on an element
 * @param element The element to focus
 */
export function simulateFocus(element: HTMLElement): void {
  element.focus();
  
  const focusEvent = new FocusEvent('focus', {
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(focusEvent);
}

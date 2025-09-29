/**
 * Simple notification system for showing toasts
 */

export interface NotificationOptions {
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number; // in milliseconds, 0 means no auto-dismiss
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Shows a toast notification
 * @param message The message to display
 * @param options Notification options
 */
export function showNotification(message: string, options: NotificationOptions = {}): void {
  const {
    type = 'info',
    duration = 4000,
    position = 'top-right'
  } = options;
  
  // Remove existing notification of same type to avoid duplicates
  const existingNotification = document.querySelector(`[data-notification-type="${type}"]`);
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.setAttribute('data-notification-type', type);
  notification.style.cssText = getNotificationStyles(type, position);
  
  // Add icon based on type
  const icon = getIconForType(type);
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      ${icon}
      <span>${message}</span>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = getVisibleTransform(position);
    notification.style.opacity = '1';
  }, 10);
  
  // Auto-dismiss if duration > 0
  if (duration > 0) {
    setTimeout(() => {
      dismissNotification(notification, position);
    }, duration);
  }
  
  // Add click to dismiss
  notification.addEventListener('click', () => {
    dismissNotification(notification, position);
  });
}

/**
 * Shows a success notification
 * @param message The success message
 * @param duration Duration in milliseconds
 */
export function showSuccess(message: string, duration: number = 4000): void {
  showNotification(message, { type: 'success', duration });
}

/**
 * Shows an error notification
 * @param message The error message
 * @param duration Duration in milliseconds
 */
export function showError(message: string, duration: number = 6000): void {
  showNotification(message, { type: 'error', duration });
}

/**
 * Shows an info notification
 * @param message The info message
 * @param duration Duration in milliseconds
 */
export function showInfo(message: string, duration: number = 4000): void {
  showNotification(message, { type: 'info', duration });
}

/**
 * Shows a warning notification
 * @param message The warning message
 * @param duration Duration in milliseconds
 */
export function showWarning(message: string, duration: number = 5000): void {
  showNotification(message, { type: 'warning', duration });
}

/**
 * Dismisses a notification with animation
 * @param notification The notification element
 * @param position The position of the notification
 */
function dismissNotification(notification: HTMLElement, position: string): void {
  notification.style.transform = getHiddenTransform(position);
  notification.style.opacity = '0';
  
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 300);
}

/**
 * Gets the CSS styles for a notification
 * @param type The notification type
 * @param position The notification position
 * @returns CSS string
 */
function getNotificationStyles(type: string, position: string): string {
  const baseStyles = `
    position: fixed;
    z-index: 10000;
    background: ${getBackgroundColor(type)};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    min-width: 200px;
    transform: ${getHiddenTransform(position)};
    transition: all 0.3s ease;
    opacity: 0;
    cursor: pointer;
    word-wrap: break-word;
  `;
  
  const positionStyles = getPositionStyles(position);
  
  return baseStyles + positionStyles;
}

/**
 * Gets position-specific CSS styles
 * @param position The notification position
 * @returns CSS string
 */
function getPositionStyles(position: string): string {
  switch (position) {
    case 'top-right':
      return 'top: 20px; right: 20px;';
    case 'top-left':
      return 'top: 20px; left: 20px;';
    case 'bottom-right':
      return 'bottom: 20px; right: 20px;';
    case 'bottom-left':
      return 'bottom: 20px; left: 20px;';
    default:
      return 'top: 20px; right: 20px;';
  }
}

/**
 * Gets the background color for a notification type
 * @param type The notification type
 * @returns CSS color
 */
function getBackgroundColor(type: string): string {
  switch (type) {
    case 'success':
      return '#10B981';
    case 'error':
      return '#EF4444';
    case 'warning':
      return '#F59E0B';
    case 'info':
    default:
      return '#3B82F6';
  }
}

/**
 * Gets the icon for a notification type
 * @param type The notification type
 * @returns SVG icon HTML
 */
function getIconForType(type: string): string {
  const iconSize = '16';
  
  switch (type) {
    case 'success':
      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>`;
    case 'error':
      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`;
    case 'warning':
      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`;
    case 'info':
    default:
      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`;
  }
}

/**
 * Gets the hidden transform for animation based on position
 * @param position The notification position
 * @returns CSS transform
 */
function getHiddenTransform(position: string): string {
  switch (position) {
    case 'top-right':
    case 'bottom-right':
      return 'translateX(100%)';
    case 'top-left':
    case 'bottom-left':
      return 'translateX(-100%)';
    default:
      return 'translateX(100%)';
  }
}

/**
 * Gets the visible transform for animation based on position
 * @param _position The notification position (unused, all positions use same transform)
 * @returns CSS transform
 */
function getVisibleTransform(_position: string): string {
  return 'translateX(0)';
}

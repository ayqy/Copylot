/**
 * Simple notification system for showing toasts
 */

export interface NotificationOptions {
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number; // in milliseconds, 0 means no auto-dismiss
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  exclusive?: boolean; // 标记是否为独占通知，阻止其他非错误通知显示并启用特殊动画效果
}

// 跳动动画控制函数
let bounceTimer: number | null = null;
let bounceInterval: number | null = null;

/**
 * 注入跳动动画CSS关键帧到页面
 */
function injectBounceKeyframes(): void {
  if (document.getElementById('copylot-bounce-keyframes')) return;

  const style = document.createElement('style');
  style.id = 'copylot-bounce-keyframes';
  style.textContent = `
    @keyframes copylot-bounce {
      0% { transform: translateY(0px); }
      30% { transform: translateY(-18px); }
      50% { transform: translateY(-15px); }
      70% { transform: translateY(-18px); }
      100% { transform: translateY(0px); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * 开始跳动动画
 * @param iconElement 图标元素
 */
function startBouncingAnimation(iconElement: SVGElement): void {
  if (bounceTimer || bounceInterval) {
    stopBouncingAnimation();
  }

  // 先注入CSS关键帧
  injectBounceKeyframes();

  // 【macOS风格】应用跳动动画类，使用弹性缓动曲线
  iconElement.style.animation = 'copylot-bounce 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite';

  // 使用定时器控制跳动节奏，与CSS动画形成复合效果
  let bounceCount = 0;
  bounceInterval = window.setInterval(() => {
    bounceCount++;
    // 【macOS风格】每8秒（大约7-8次跳动）后停止，或在用户交互时停止
    if (bounceCount >= 8) {
      stopBouncingAnimation();
      return;
    }
  }, 1000);

  // 备用定时器，确保动画不会永久运行
  bounceTimer = window.setTimeout(() => {
    stopBouncingAnimation();
  }, 8500);
}

/**
 * 停止跳动动画
 */
function stopBouncingAnimation(): void {
  if (bounceInterval) {
    clearInterval(bounceInterval);
    bounceInterval = null;
  }
  if (bounceTimer) {
    clearTimeout(bounceTimer);
    bounceTimer = null;
  }

  // 移除所有图标上的跳动动画
  const bouncingIcons = document.querySelectorAll('svg[style*="copylot-bounce"]');
  bouncingIcons.forEach((icon) => {
    (icon as SVGElement).style.animation = '';
  });
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
    position = 'top-right',
    exclusive = false
  } = options;

  const actualType = exclusive ? 'bounce' : type;

  // 【修复】移除所有现有通知，确保同一时间只显示一个通知
  // 特别处理：如果当前显示的是独占通知，则阻止其他通知显示，除非是错误通知
  const existingNotifications = document.querySelectorAll('[data-notification-type]');
  if (existingNotifications.length > 0) {
    // 检查是否有正在显示的独占通知
    const hasActiveExclusive = Array.from(existingNotifications).some(notification =>
      notification.getAttribute('data-exclusive') === 'true'
    );

    if (hasActiveExclusive && type !== 'error') {
      console.log('[Notification] 独占通知正在显示，阻止其他非错误通知');
      return; // 不显示新通知
    }
  }

  // 移除所有现有通知
  existingNotifications.forEach(notification => {
    const element = notification as HTMLElement;
    // 如果是独占通知，停止跳动动画
    if (element.getAttribute('data-exclusive') === 'true') {
      stopBouncingAnimation();
    }
    element.remove();
  });

  // Create notification element
  const notification = document.createElement('div');
  notification.setAttribute('data-notification-type', actualType);
  notification.setAttribute('data-exclusive', exclusive.toString());
  notification.style.cssText = getNotificationStyles(actualType, position);

  // Add icon based on type
  const icon = getIconForType(actualType);
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
    notification.style.transform += ' scale(1)';

    // 如果是独占通知，开始跳动动画
    if (exclusive) {
      const iconElement = notification.querySelector('svg') as SVGElement;
      if (iconElement) {
        startBouncingAnimation(iconElement);
      }
    }
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
  // 如果是粘贴提示，停止跳动动画
  const isPasteHint = notification.textContent?.includes('已复制') && notification.textContent?.includes('粘贴');
  if (isPasteHint) {
    stopBouncingAnimation();
  }

  notification.style.transform = getHiddenTransform(position) + ' scale(0.8)';
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
    padding: 18px 24px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    max-width: 450px;
    min-width: 280px;
    transform: ${getHiddenTransform(position)};
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0;
    cursor: pointer;
    word-wrap: break-word;
    border: 2px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
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
      return 'top: 30px; right: 30px;';
    case 'top-left':
      return 'top: 30px; left: 30px;';
    case 'bottom-right':
      return 'bottom: 30px; right: 30px;';
    case 'bottom-left':
      return 'bottom: 30px; left: 30px;';
    default:
      return 'top: 30px; right: 30px;';
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
  const iconSize = '20';

  // 使用项目原生多彩图标，保持原有颜色结构
  const projectIconSvg = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M512 1024a128.103 128.103 0 0 1-111.806-65.726A128 128 0 0 1 181.91 896.87 128 128 0 0 1 55.794 675.154C19.143 606.537 0 529.223 0 448 0 184.229 210.549 0 512 0s512 184.229 512 448c0 81.223-19.143 158.537-55.84 227.131a128 128 0 0 1-126.114 221.715A128 128 0 0 1 623.76 958.25 128.103 128.103 0 0 1 512 1024z" fill="#2D1B69"></path><path d="M896 704c-2.377 0-4.731 0.149-7.051 0.354C941.714 634.126 972.8 546.64 972.8 448c0-254.491-206.309-396.8-460.8-396.8S51.2 193.509 51.2 448c0 98.64 31.074 186.126 83.851 256.354-2.285-0.205-4.674-0.354-7.051-0.354a76.8 76.8 0 1 0 76.8 76.8c0-1.337-0.137-2.651-0.206-3.977a443.097 443.097 0 0 0 51.212 36.571A76.766 76.766 0 1 0 384 870.4c0-1.143-0.114-2.206-0.171-3.314a498.423 498.423 0 0 0 53.622 10.743 76.8 76.8 0 1 0 149.098 0 498.423 498.423 0 0 0 53.622-10.743c0 1.143-0.171 2.194-0.171 3.314a76.8 76.8 0 1 0 128.194-56.96 443.097 443.097 0 0 0 51.212-36.571c-0.069 1.325-0.206 2.64-0.206 3.977A76.8 76.8 0 1 0 896 704z" fill="#4A2C85"></path><path d="M972.8 780.8a76.8 76.8 0 0 1-153.6 0c0-1.28 0.126-2.686 0.251-3.966a431.531 431.531 0 0 1-51.325 36.572A76.743 76.743 0 1 1 640 870.4c0-1.143 0.126-2.171 0.126-3.326a484.571 484.571 0 0 1-53.635 10.755 76.8 76.8 0 1 1-148.982 0 484.571 484.571 0 0 1-53.635-10.755c0 1.143 0.126 2.172 0.126 3.326a76.8 76.8 0 1 1-128.126-56.96 431.531 431.531 0 0 1-51.325-36.571c0.125 1.28 0.251 2.685 0.251 3.965a76.8 76.8 0 1 1-84.869-76.411A515.943 515.943 0 0 0 428.8 806.4c281.349 0 510.206-224 518.274-503.429C963.714 346.114 972.8 394.63 972.8 448c0 98.686-31.109 186.114-83.84 256.389A61.554 61.554 0 0 1 896 704a76.869 76.869 0 0 1 76.8 76.8z" fill="#1A0F3D"></path><path d="M512 550.4a64.069 64.069 0 0 1-64-64 12.8 12.8 0 1 1 25.6 0 38.4 38.4 0 0 0 76.8 0 12.8 12.8 0 1 1 25.6 0 64.069 64.069 0 0 1-64 64zM345.6 384a38.4 38.4 0 1 0 76.8 0 38.4 38.4 0 1 0-76.8 0zM601.6 384a38.4 38.4 0 1 0 76.8 0 38.4 38.4 0 1 0-76.8 0z" fill="#FF4444"></path><path d="M332.8 448h-51.2a25.6 25.6 0 1 0 0 51.2h51.2a25.6 25.6 0 1 0 0-51.2z m409.6 0h-51.2a25.6 25.6 0 1 0 0 51.2h51.2a25.6 25.6 0 0 0 0-51.2z" fill="#8B4513"></path><path d="M400 150 L420 120 L440 150 Z" fill="#8B4513"></path><path d="M584 150 L604 120 L624 150 Z" fill="#8B4513"></path></svg>`;

  return projectIconSvg;
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
      return 'translateX(100%) scale(0.8)';
    case 'top-left':
    case 'bottom-left':
      return 'translateX(-100%) scale(0.8)';
    default:
      return 'translateX(100%) scale(0.8)';
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

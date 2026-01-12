import { todoRepository } from '@/data/repositories';

let notificationInterval: ReturnType<typeof setInterval> | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

async function showNotification(title: string, body: string, tag: string): Promise<void> {
  if (Notification.permission !== 'granted') return;

  try {
    // Try to use service worker notification if available (works in background)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        tag,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        requireInteraction: true,
      } as NotificationOptions);
    } else {
      // Fallback to regular notification
      new Notification(title, {
        body,
        tag,
        icon: '/icons/icon-192.svg',
      });
    }
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

async function checkPendingReminders(): Promise<void> {
  try {
    const pending = await todoRepository.getPendingReminders();
    
    for (const { todo, reminder } of pending) {
      await showNotification(
        '📋 Task Reminder',
        todo.title,
        `reminder-${reminder.id}`
      );
      await todoRepository.markReminderNotified(todo.id, reminder.id);
    }
  } catch (error) {
    console.error('Failed to check reminders:', error);
  }
}

export function startNotificationService(): void {
  if (notificationInterval) return;

  // Check immediately
  checkPendingReminders();

  // Then check every minute
  notificationInterval = setInterval(checkPendingReminders, 60 * 1000);
}

export function stopNotificationService(): void {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}

export const notificationService = {
  requestPermission: requestNotificationPermission,
  isSupported: isNotificationSupported,
  getPermission: getNotificationPermission,
  start: startNotificationService,
  stop: stopNotificationService,
  showNotification,
};

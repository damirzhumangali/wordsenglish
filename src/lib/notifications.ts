/**
 * Daily Study Notifications and Reminders Manager
 * Handles native OS/Browser Notifications and in-app triggers for 13:00 and 20:00 (8 PM)
 */

export interface ReminderSlotInfo {
  time: string; // '13:00' or '20:00'
  title: string;
  message: string;
  tag: string;
  iconType: 'sun' | 'moon';
}

export const REMINDER_SLOTS: Record<string, ReminderSlotInfo> = {
  '13:00': {
    time: '13:00',
    title: '☀️ Дневная тренировка VocabFlow (13:00)',
    message: 'Пора освежить словарный запас! 5 минут практики в обеденный перерыв сохранят ваш ударный режим 🔥.',
    tag: 'vocabflow-slot-13',
    iconType: 'sun',
  },
  '20:00': {
    time: '20:00',
    title: '🌙 Вечерний обзор VocabFlow (20:00)',
    message: 'Время закрыть дневную цель! Закрепите новые слова перед сном для максимальной памяти 🏆.',
    tag: 'vocabflow-slot-20',
    iconType: 'moon',
  },
};

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return Notification.permission;
  }
}

/**
 * Sends a native OS/browser notification if permission is granted
 */
export function sendNativeNotification(title: string, body: string, tag: string): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const options: NotificationOptions = {
      body,
      tag,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
    };

    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    // Auto close after 8 seconds
    setTimeout(() => {
      try {
        notif.close();
      } catch {}
    }, 8000);

    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a daily reminder is due right now (at 13:00 or 20:00)
 */
export function checkDueReminder(reminderTimes: string[] = ['13:00', '20:00']): ReminderSlotInfo | null {
  if (typeof window === 'undefined') return null;

  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const timeStr of reminderTimes) {
    const targetHour = parseInt(timeStr.split(':')[0], 10);
    const storageKey = `vocabflow_reminder_${todayStr}_${targetHour}`;

    // Has already been fired today?
    const alreadyFired = localStorage.getItem(storageKey);
    if (alreadyFired) continue;

    // Check if within the reminder window (at or past the scheduled hour)
    if (targetHour === 13 && currentHour >= 13 && currentHour < 18) {
      return REMINDER_SLOTS['13:00'] || {
        time: '13:00',
        title: '☀️ Дневная тренировка VocabFlow',
        message: 'Пора освежить словарный запас! Закрепите несколько слов.',
        tag: 'vocabflow-slot-13',
        iconType: 'sun',
      };
    }

    if (targetHour === 20 && currentHour >= 20 && currentHour < 24) {
      return REMINDER_SLOTS['20:00'] || {
        time: '20:00',
        title: '🌙 Вечерний обзор VocabFlow',
        message: 'Время закрыть дневную цель и повторить слова перед сном!',
        tag: 'vocabflow-slot-20',
        iconType: 'moon',
      };
    }
  }

  return null;
}

/**
 * Marks a reminder slot as completed for today
 */
export function markReminderCompleted(timeStr: string) {
  if (typeof window === 'undefined') return;
  const now = new Date();
  const targetHour = parseInt(timeStr.split(':')[0], 10);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const storageKey = `vocabflow_reminder_${todayStr}_${targetHour}`;
  localStorage.setItem(storageKey, 'true');
}

/**
 * Dispatches an immediate test notification for either 13:00 or 20:00
 */
export async function sendTestReminder(timeSlot: '13:00' | '20:00' = '13:00'): Promise<{
  nativeSent: boolean;
  permission: NotificationPermission | 'unsupported';
  slot: ReminderSlotInfo;
}> {
  const slot = REMINDER_SLOTS[timeSlot] || REMINDER_SLOTS['13:00'];
  let permission = getNotificationPermission();

  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  let nativeSent = false;
  if (permission === 'granted') {
    nativeSent = sendNativeNotification(slot.title, slot.message, `test-${slot.tag}`);
  }

  return {
    nativeSent,
    permission,
    slot,
  };
}

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  checkDueReminder,
  markReminderCompleted,
  sendNativeNotification,
  ReminderSlotInfo,
  REMINDER_SLOTS,
} from '@/lib/notifications';
import { NotificationReminderBanner } from './NotificationReminderBanner';
import { sound } from '@/lib/sound';

export function NotificationManager() {
  const { profile, startSession } = useApp();
  const [activeSlot, setActiveSlot] = useState<ReminderSlotInfo | null>(null);
  const snoozeUntilRef = useRef<number>(0);

  const notificationsEnabled = profile.settings.notificationsEnabled ?? true;
  const reminderTimes = profile.settings.reminderTimes ?? ['13:00', '20:00'];

  // Periodic reminder checker (checks every 25 seconds)
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkReminders = () => {
      // Don't trigger if snoozed
      if (Date.now() < snoozeUntilRef.current) return;

      const dueSlot = checkDueReminder(reminderTimes);
      if (dueSlot) {
        // Mark as sent for today
        markReminderCompleted(dueSlot.time);

        // Send native desktop/browser notification
        sendNativeNotification(dueSlot.title, dueSlot.message, dueSlot.tag);

        // Play sound and display in-app banner
        sound.playFanfare();
        setActiveSlot(dueSlot);
      }
    };

    // Run immediately once on mount after 2 seconds
    const initialTimer = setTimeout(checkReminders, 2500);

    // Then check periodically
    const interval = setInterval(checkReminders, 25000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [notificationsEnabled, reminderTimes]);

  // Listener for manual test trigger from Settings Modal
  useEffect(() => {
    const handleTestEvent = (e: CustomEvent<{ slot: ReminderSlotInfo }>) => {
      const slot = e.detail?.slot || REMINDER_SLOTS['13:00'];
      sound.playFanfare();
      setActiveSlot(slot);
    };

    window.addEventListener('vocabflow-test-notification' as any, handleTestEvent as any);
    return () => {
      window.removeEventListener('vocabflow-test-notification' as any, handleTestEvent as any);
    };
  }, []);

  const handleStartSession = () => {
    if (activeSlot) {
      markReminderCompleted(activeSlot.time);
    }
    setActiveSlot(null);
    startSession({ mode: 'daily' });
  };

  const handleDismiss = () => {
    if (activeSlot) {
      markReminderCompleted(activeSlot.time);
    }
    setActiveSlot(null);
  };

  const handleSnooze = () => {
    // Snooze for 15 minutes
    snoozeUntilRef.current = Date.now() + 15 * 60 * 1000;
    setActiveSlot(null);
  };

  return (
    <NotificationReminderBanner
      slot={activeSlot}
      onStartSession={handleStartSession}
      onDismiss={handleDismiss}
      onSnooze={handleSnooze}
    />
  );
}

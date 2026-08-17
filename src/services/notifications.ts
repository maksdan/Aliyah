import * as Notifications from 'expo-notifications';
import { getDarkDay } from './planner';
import { isDateRead } from '../utils/storage';

const CONGRATS_ID = 'weekly-congrats';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // The Sunday congrats is a one-time celebration: show it as a banner but
    // never let it persist in Notification Center, so it goes away on its own
    // after appearing once.
    const isCongrats = notification.request.identifier === CONGRATS_ID;
    return {
      shouldShowBanner: true,
      shouldShowList: !isCongrats,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

// Reminders.
//
// iOS cannot ask a question when a notification fires — a scheduled alert
// simply arrives. "Only if it is still unread" therefore has to be expressed by
// what is on the schedule: every reminder is placed in advance, and taken off
// the moment the day it belongs to is marked read. Un-marking a day puts its
// remaining times back, so a day that goes unread → read → unread is treated as
// unread, which is what it is.
//
// The old 9am alert was a repeating weekly trigger, which fired whether or not
// the reading was done and could not skip a date — so it would have gone off on
// Yom Kippur. Repeats are gone: the window below is rebuilt on every app open
// and every change of read state.
const REMINDER_HOURS = [9, 12, 17, 21];

// Two weeks of reminders at a time. Four a day over fourteen days is 56 at the
// outside, under iOS's 64-notification ceiling with the weekly congrats and a
// margin to spare; dark days come off that total. Anyone who opens the app even
// once a fortnight keeps a full window ahead of them.
const WINDOW_DAYS = 14;
const REMINDER_PREFIX = 'reminder-';

function reminderId(d: Date, hour: number): string {
  return `${REMINDER_PREFIX}${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${hour}`;
}

async function cancelAllReminders(): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

// Rebuild the reminder window: the next fortnight of days that have a reading
// and have not been read, at each hour still ahead of now. Dark days — Shabbat,
// yom tov, Yom Kippur — are skipped outright: there is nothing to prepare and
// nothing anyone should be reminded of.
export async function refreshReminders(): Promise<void> {
  // Callers fire this and move on, so it has to be safe on its own: with
  // notifications refused, scheduling rejects, and an unguarded call would
  // surface as an unhandled rejection on every mark-as-read.
  try {
    const { ios } = await Notifications.getPermissionsAsync();
    const granted =
      ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!granted) return;
    await buildReminderWindow();
  } catch {
    // A device that will not take a schedule is not worth failing a read over.
  }
}

async function buildReminderWindow(): Promise<void> {
  await cancelAllReminders();

  const now = new Date();
  for (let i = 0; i < WINDOW_DAYS; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() + i);
    if (getDarkDay(day)) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await isDateRead(day)) continue;

    for (const hour of REMINDER_HOURS) {
      const at = new Date(day);
      at.setHours(hour, 0, 0, 0);
      if (at <= now) continue;
      // eslint-disable-next-line no-await-in-loop
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId(day, hour),
        content:
          hour === REMINDER_HOURS[0]
            ? {
                title: 'Daily Aliyah',
                body: "Today's portion is ready to read.",
              }
            : {
                title: 'Aliyah Reminder',
                body: "You haven't read today's portion yet.",
              },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: at,
        },
      });
    }
  }
}

export async function requestPermissionAndSchedule(): Promise<void> {
  const permissions = await Notifications.requestPermissionsAsync();
  const iosStatus = permissions.ios?.status;
  const isGranted =
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!isGranted) return;
  await refreshReminders();
}

// Arm a one-off Sunday-morning notification celebrating a fully-read week.
// Re-scheduled on every streak refresh, so the message always reflects the
// current streak length. A no-op if the target time is already in the past.
export async function scheduleWeeklyCongrats(streak: number, date: Date): Promise<void> {
  await cancelWeeklyCongrats();
  if (date.getTime() <= Date.now()) return;

  const title = streak <= 1 ? 'A full week of readings!' : `${streak}-week streak!`;
  const body =
    streak <= 1
      ? 'You read every portion last week. Keep it going this week!'
      : `That's ${streak} weeks in a row of complete readings. Yasher koach — keep it up!`;

  await Notifications.scheduleNotificationAsync({
    identifier: CONGRATS_ID,
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
}

export async function cancelWeeklyCongrats(): Promise<void> {
  // Cancel any still-pending schedule and clear it from Notification Center if
  // it has already been delivered, so the "keep it up!" alert doesn't linger.
  await Notifications.cancelScheduledNotificationAsync(CONGRATS_ID).catch(() => {});
  await Notifications.dismissNotificationAsync(CONGRATS_ID).catch(() => {});
}

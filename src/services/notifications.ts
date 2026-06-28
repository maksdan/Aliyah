import * as Notifications from 'expo-notifications';

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

// weekday 1=Sunday … 6=Friday; 7=Saturday is intentionally excluded
const WEEKDAYS_TO_NOTIFY = [1, 2, 3, 4, 5, 6];

const REMINDER_HOURS = [12, 17, 21];

export async function requestPermissionAndSchedule(): Promise<void> {
  const permissions = await Notifications.requestPermissionsAsync();
  const iosStatus = permissions.ios?.status;
  const isGranted =
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!isGranted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Promise.all(
    WEEKDAYS_TO_NOTIFY.map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content:
          weekday === 6 // Friday
            ? {
                title: 'Weekly Haftarah',
                body: "Today's Haftarah is ready to read.",
              }
            : {
                title: 'Daily Aliyah',
                body: "Today's portion from the Torah is ready to read.",
              },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: 9,
          minute: 0,
        },
      })
    )
  );
}

export async function scheduleReminders(): Promise<void> {
  await cancelReminders();

  const now = new Date();
  if (now.getDay() === 6) return;

  await Promise.all(
    REMINDER_HOURS.map(async (hour) => {
      const target = new Date();
      target.setHours(hour, 0, 0, 0);
      if (target <= now) return;

      await Notifications.scheduleNotificationAsync({
        identifier: `reminder-${hour}`,
        content: {
          title: 'Aliyah Reminder',
          body: "You haven't read today's aliyah yet.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: target,
        },
      });
    })
  );
}

export async function cancelReminders(): Promise<void> {
  await Promise.all(
    REMINDER_HOURS.map((hour) =>
      Notifications.cancelScheduledNotificationAsync(`reminder-${hour}`).catch(() => {})
    )
  );
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

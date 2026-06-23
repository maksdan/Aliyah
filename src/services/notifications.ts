import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
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
        content: {
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

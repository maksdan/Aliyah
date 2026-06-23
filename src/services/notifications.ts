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

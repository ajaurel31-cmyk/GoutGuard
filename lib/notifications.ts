import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import type { UserProfile } from './storage';

// ---------------------------------------------------------------------------
// Notification channel / group IDs
// ---------------------------------------------------------------------------

const CHANNEL = {
  WATER: 'water-reminders',
  PURINE: 'purine-reminders',
  URIC_ACID: 'uric-acid-reminders',
  FLARE: 'flare-reminders',
};

// ID ranges to avoid collisions between categories
const ID_BASE = {
  WATER: 1000, // 1000–1099
  PURINE: 2000, // 2000
  URIC_ACID: 3000, // 3000
  FLARE: 4000, // 4000
};

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch {
    return false;
  }
}

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const perm = await LocalNotifications.checkPermissions();
    return perm.display === 'granted';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Cancel helpers
// ---------------------------------------------------------------------------

async function cancelByIds(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    await LocalNotifications.cancel({
      notifications: ids.map((id) => ({ id })),
    });
  } catch {
    // ignore – may not exist
  }
}

function waterIds(): number[] {
  // Support up to 24 water reminders (hourly)
  return Array.from({ length: 24 }, (_, i) => ID_BASE.WATER + i);
}

export async function cancelAllReminders(): Promise<void> {
  await cancelByIds([
    ...waterIds(),
    ID_BASE.PURINE,
    ID_BASE.URIC_ACID,
    ID_BASE.FLARE,
  ]);
}

// ---------------------------------------------------------------------------
// Schedule helpers
// ---------------------------------------------------------------------------

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h ?? 8, minute: m ?? 0 };
}

// ---------------------------------------------------------------------------
// Water reminders – repeating every N hours between start and end
// ---------------------------------------------------------------------------

export async function scheduleWaterReminders(profile: UserProfile): Promise<void> {
  // Cancel existing water reminders
  await cancelByIds(waterIds());

  if (!profile.notificationsEnabled || !profile.waterReminders) return;

  const intervalHours = profile.waterReminderInterval ?? 2;
  const start = parseTime(profile.waterReminderStartTime ?? '08:00');
  const end = parseTime(profile.waterReminderEndTime ?? '20:00');

  const notifications: ScheduleOptions['notifications'] = [];
  let idx = 0;

  for (let h = start.hour; h <= end.hour; h += intervalHours) {
    notifications.push({
      id: ID_BASE.WATER + idx,
      title: 'Time to Hydrate',
      body: `Drink some water! Staying hydrated helps keep uric acid levels down.`,
      schedule: {
        on: { hour: h, minute: start.minute },
        allowWhileIdle: true,
      },
    });
    idx++;
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

// ---------------------------------------------------------------------------
// Purine reminder – daily at set time
// ---------------------------------------------------------------------------

export async function schedulePurineReminder(profile: UserProfile): Promise<void> {
  await cancelByIds([ID_BASE.PURINE]);

  if (!profile.notificationsEnabled || !profile.purineReminders) return;

  const { hour, minute } = parseTime(profile.purineReminderTime ?? '19:00');

  await LocalNotifications.schedule({
    notifications: [
      {
        id: ID_BASE.PURINE,
        title: 'Log Your Meals',
        body: `Don't forget to log today's meals. Your daily purine target is ${profile.dailyPurineTarget} mg.`,
        schedule: {
          on: { hour, minute },
          allowWhileIdle: true,
        },
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Uric acid reminder – weekly / biweekly / monthly
// ---------------------------------------------------------------------------

export async function scheduleUricAcidReminder(profile: UserProfile): Promise<void> {
  await cancelByIds([ID_BASE.URIC_ACID]);

  if (!profile.notificationsEnabled || !profile.uricAcidReminders) return;

  const { hour, minute } = parseTime(profile.uricAcidReminderTime ?? '09:00');
  const interval = profile.uricAcidReminderInterval ?? 'weekly';

  // For weekly reminders, schedule on the chosen day (1=Monday … 7=Sunday)
  // For biweekly / monthly, schedule weekly and let UI explain frequency
  // Capacitor LocalNotifications supports `on` with weekday for repeating
  const day = profile.uricAcidReminderDay ?? 1; // 1 = Sunday in Capacitor, but we use 1 = Monday

  if (interval === 'monthly') {
    // Schedule on a specific day of the month
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID_BASE.URIC_ACID,
          title: 'Uric Acid Check',
          body: 'Time to measure your uric acid level. Regular tracking helps manage gout.',
          schedule: {
            on: { day, hour, minute },
            allowWhileIdle: true,
          },
        },
      ],
    });
  } else {
    // Weekly (also used for biweekly — Capacitor doesn't natively support biweekly,
    // so we schedule weekly and note the frequency in the description)
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ID_BASE.URIC_ACID,
          title: 'Uric Acid Check',
          body: 'Time to measure your uric acid level. Regular tracking helps manage gout.',
          schedule: {
            on: { weekday: day, hour, minute },
            allowWhileIdle: true,
          },
        },
      ],
    });
  }
}

// ---------------------------------------------------------------------------
// Flare check-in – daily at set time
// ---------------------------------------------------------------------------

export async function scheduleFlareReminder(profile: UserProfile): Promise<void> {
  await cancelByIds([ID_BASE.FLARE]);

  if (!profile.notificationsEnabled || !profile.flareReminders) return;

  const { hour, minute } = parseTime(profile.flareReminderTime ?? '20:00');

  await LocalNotifications.schedule({
    notifications: [
      {
        id: ID_BASE.FLARE,
        title: 'Daily Gout Check-In',
        body: 'How are your joints feeling today? Log any flare symptoms to track patterns.',
        schedule: {
          on: { hour, minute },
          allowWhileIdle: true,
        },
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Schedule all reminders based on current profile
// ---------------------------------------------------------------------------

export async function scheduleAllReminders(profile: UserProfile): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Promise.all([
    scheduleWaterReminders(profile),
    schedulePurineReminder(profile),
    scheduleUricAcidReminder(profile),
    scheduleFlareReminder(profile),
  ]);
}

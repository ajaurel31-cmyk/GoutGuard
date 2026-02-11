// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format a YYYY-MM-DD date string for display.
 * Example: "Jan 15, 2025"
 */
export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) return dateString;
  return `${MONTH_NAMES_SHORT[month - 1]} ${day}, ${year}`;
}

/**
 * Format a YYYY-MM-DD date string in short form.
 * Example: "Jan 15"
 */
export function formatDateShort(dateString: string): string {
  const [, month, day] = dateString.split('-').map(Number);
  if (!month || !day) return dateString;
  return `${MONTH_NAMES_SHORT[month - 1]} ${day}`;
}

/**
 * Format an HH:mm (24-hour) or ISO time string to 12-hour display.
 * Example: "14:30" -> "2:30 PM"
 */
export function formatTime(timeString: string): string {
  let hours: number;
  let minutes: number;

  if (timeString.includes('T')) {
    // ISO string
    const date = new Date(timeString);
    hours = date.getHours();
    minutes = date.getMinutes();
  } else {
    const parts = timeString.split(':').map(Number);
    hours = parts[0] ?? 0;
    minutes = parts[1] ?? 0;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const displayMinute = String(minutes).padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

/**
 * Return a human-readable relative time string.
 * Examples: "just now", "5 minutes ago", "2 hours ago", "3 days ago"
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

// ---------------------------------------------------------------------------
// Date calculations
// ---------------------------------------------------------------------------

/**
 * Calculate the number of whole days between two YYYY-MM-DD date strings.
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Uric acid helpers
// ---------------------------------------------------------------------------

/**
 * Return a CSS-friendly color representing the uric acid value severity.
 *   <6.0  -> green
 *   6.0-7.0 -> yellow
 *   7.0-9.0 -> orange
 *   >9.0 -> red
 */
export function getUricAcidColor(value: number): string {
  if (value < 6.0) return '#22c55e'; // green
  if (value < 7.0) return '#eab308'; // yellow
  if (value < 9.0) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Return a short status label for a uric acid value.
 */
export function getUricAcidStatus(value: number): string {
  if (value < 6.0) return 'Target';
  if (value < 7.0) return 'Borderline';
  if (value < 9.0) return 'Elevated';
  return 'High';
}

// ---------------------------------------------------------------------------
// Pain level helpers
// ---------------------------------------------------------------------------

/**
 * Return a CSS-friendly color for a pain level on a 1-10 scale.
 */
export function getPainLevelColor(level: number): string {
  if (level <= 2) return '#22c55e'; // green – mild
  if (level <= 4) return '#84cc16'; // lime – moderate-low
  if (level <= 6) return '#eab308'; // yellow – moderate
  if (level <= 8) return '#f97316'; // orange – severe
  return '#ef4444'; // red – extreme
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Format a purine amount in milligrams for display.
 */
export function formatPurines(mg: number): string {
  if (mg < 1) return '<1 mg';
  return `${Math.round(mg)} mg`;
}

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Return an array of YYYY-MM-DD strings for the current week (Monday-Sunday).
 */
export function getCurrentWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  // Shift so Monday = 0
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(toDateString(d));
  }
  return dates;
}

/**
 * Return an array of YYYY-MM-DD strings for the last N days (including today),
 * ordered from oldest to newest.
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(toDateString(d));
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Debounce
// ---------------------------------------------------------------------------

/**
 * Create a debounced version of a function that delays invocation until
 * after `ms` milliseconds have elapsed since the last call.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number,
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: any[]) => {
    if (timeoutId !== null) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, ms);
  };

  return debounced as unknown as T;
}

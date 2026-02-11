// Types for all stored data

export interface DailyLog {
  date: string; // YYYY-MM-DD
  foods: FoodLogEntry[];
  totalPurines: number;
  waterIntake: number; // in oz
  medications: MedicationDose[];
}

export interface FoodLogEntry {
  id: string;
  foodName: string;
  purineContent: number; // mg
  purineLevel: string;
  servingSize: string;
  timestamp: string;
  source: 'manual' | 'scan' | 'database';
}

export interface UricAcidReading {
  id: string;
  date: string;
  value: number; // mg/dL
  notes: string;
}

export interface FlareEvent {
  id: string;
  date: string;
  time: string;
  joints: string[];
  painLevel: number; // 1-10
  duration: string;
  triggers: string[];
  treatments: string[];
  notes: string;
  resolved: boolean;
  resolvedDate?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  reminderTimes: string[];
  active: boolean;
}

export interface MedicationDose {
  medicationId: string;
  medicationName: string;
  timestamp: string;
  taken: boolean;
}

export interface UserProfile {
  goutStage: 'acute' | 'intercritical' | 'chronic' | '';
  medications: string[];
  allergies: string[];
  dietaryRestrictions: string[];
  dailyPurineTarget: number; // mg, default 400
  waterIntakeGoal: number; // oz, default 64
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  waterReminders: boolean;
  medicationReminders: boolean;
}

export interface ScanRecord {
  id: string;
  date: string;
  imageData?: string;
  result: any;
  timestamp: string;
}

export interface SavedMeal {
  id: string;
  name: string;
  foods: FoodLogEntry[];
  totalPurines: number;
  createdAt: string;
}

// Storage keys
const KEYS = {
  DAILY_LOGS: 'goutguard_daily_logs',
  URIC_ACID: 'goutguard_uric_acid',
  FLARES: 'goutguard_flares',
  MEDICATIONS: 'goutguard_medications',
  PROFILE: 'goutguard_profile',
  SCANS: 'goutguard_scans',
  SCAN_COUNT: 'goutguard_scan_count',
  FAVORITES: 'goutguard_favorites',
  SAVED_MEALS: 'goutguard_saved_meals',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const testKey = '__goutguard_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function getItem<T>(key: string, fallback: T): T {
  if (!isLocalStorageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or other error – silently ignore
  }
}

// ---------------------------------------------------------------------------
// Utility: ID generation & date helpers
// ---------------------------------------------------------------------------

export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------

const DEFAULT_PROFILE: UserProfile = {
  goutStage: '',
  medications: [],
  allergies: [],
  dietaryRestrictions: [],
  dailyPurineTarget: 400,
  waterIntakeGoal: 64,
  theme: 'system',
  notificationsEnabled: true,
  waterReminders: true,
  medicationReminders: true,
};

export function getProfile(): UserProfile {
  return getItem<UserProfile>(KEYS.PROFILE, { ...DEFAULT_PROFILE });
}

export function saveProfile(profile: UserProfile): void {
  setItem(KEYS.PROFILE, profile);
}

// ---------------------------------------------------------------------------
// Daily Logs
// ---------------------------------------------------------------------------

function getAllDailyLogs(): Record<string, DailyLog> {
  return getItem<Record<string, DailyLog>>(KEYS.DAILY_LOGS, {});
}

function createEmptyDailyLog(date: string): DailyLog {
  return {
    date,
    foods: [],
    totalPurines: 0,
    waterIntake: 0,
    medications: [],
  };
}

export function getDailyLog(date: string): DailyLog {
  const logs = getAllDailyLogs();
  return logs[date] ?? createEmptyDailyLog(date);
}

export function saveDailyLog(log: DailyLog): void {
  const logs = getAllDailyLogs();
  logs[log.date] = log;
  setItem(KEYS.DAILY_LOGS, logs);
}

export function addFoodToLog(date: string, entry: FoodLogEntry): void {
  const log = getDailyLog(date);
  log.foods.push(entry);
  log.totalPurines = log.foods.reduce((sum, f) => sum + f.purineContent, 0);
  saveDailyLog(log);
}

// ---------------------------------------------------------------------------
// Uric Acid Readings
// ---------------------------------------------------------------------------

export function getUricAcidReadings(): UricAcidReading[] {
  return getItem<UricAcidReading[]>(KEYS.URIC_ACID, []);
}

export function addUricAcidReading(reading: UricAcidReading): void {
  const readings = getUricAcidReadings();
  readings.push(reading);
  readings.sort((a, b) => b.date.localeCompare(a.date));
  setItem(KEYS.URIC_ACID, readings);
}

export function deleteUricAcidReading(id: string): void {
  const readings = getUricAcidReadings().filter((r) => r.id !== id);
  setItem(KEYS.URIC_ACID, readings);
}

// ---------------------------------------------------------------------------
// Flare Events
// ---------------------------------------------------------------------------

export function getFlares(): FlareEvent[] {
  return getItem<FlareEvent[]>(KEYS.FLARES, []);
}

export function addFlare(flare: FlareEvent): void {
  const flares = getFlares();
  flares.push(flare);
  flares.sort((a, b) => b.date.localeCompare(a.date));
  setItem(KEYS.FLARES, flares);
}

export function updateFlare(updated: FlareEvent): void {
  const flares = getFlares().map((f) => (f.id === updated.id ? updated : f));
  setItem(KEYS.FLARES, flares);
}

export function deleteFlare(id: string): void {
  const flares = getFlares().filter((f) => f.id !== id);
  setItem(KEYS.FLARES, flares);
}

// ---------------------------------------------------------------------------
// Medications
// ---------------------------------------------------------------------------

export function getMedications(): Medication[] {
  return getItem<Medication[]>(KEYS.MEDICATIONS, []);
}

export function addMedication(med: Medication): void {
  const meds = getMedications();
  meds.push(med);
  setItem(KEYS.MEDICATIONS, meds);
}

export function updateMedication(updated: Medication): void {
  const meds = getMedications().map((m) => (m.id === updated.id ? updated : m));
  setItem(KEYS.MEDICATIONS, meds);
}

export function deleteMedication(id: string): void {
  const meds = getMedications().filter((m) => m.id !== id);
  setItem(KEYS.MEDICATIONS, meds);
}

export function logMedicationDose(dose: MedicationDose): void {
  const today = getTodayDateString();
  const log = getDailyLog(today);
  log.medications.push(dose);
  saveDailyLog(log);
}

// ---------------------------------------------------------------------------
// Scan Records
// ---------------------------------------------------------------------------

export function getScanRecords(): ScanRecord[] {
  return getItem<ScanRecord[]>(KEYS.SCANS, []);
}

export function addScanRecord(record: ScanRecord): void {
  const records = getScanRecords();
  records.unshift(record); // newest first
  // Keep at most 50 scan records to avoid bloating localStorage
  if (records.length > 50) records.length = 50;
  setItem(KEYS.SCANS, records);
}

// ---------------------------------------------------------------------------
// Scan Count (free-tier daily limit)
// ---------------------------------------------------------------------------

interface ScanCountData {
  date: string;
  count: number;
}

export function getTodayScanCount(): number {
  const data = getItem<ScanCountData>(KEYS.SCAN_COUNT, { date: '', count: 0 });
  if (data.date !== getTodayDateString()) {
    return 0; // new day – count resets
  }
  return data.count;
}

export function incrementScanCount(): void {
  const today = getTodayDateString();
  const data = getItem<ScanCountData>(KEYS.SCAN_COUNT, { date: '', count: 0 });
  if (data.date !== today) {
    setItem(KEYS.SCAN_COUNT, { date: today, count: 1 });
  } else {
    setItem(KEYS.SCAN_COUNT, { date: today, count: data.count + 1 });
  }
}

// ---------------------------------------------------------------------------
// Saved Meals
// ---------------------------------------------------------------------------

export function getSavedMeals(): SavedMeal[] {
  return getItem<SavedMeal[]>(KEYS.SAVED_MEALS, []);
}

export function saveMeal(meal: SavedMeal): void {
  const meals = getSavedMeals();
  meals.push(meal);
  setItem(KEYS.SAVED_MEALS, meals);
}

export function removeSavedMeal(id: string): void {
  const meals = getSavedMeals().filter((m) => m.id !== id);
  setItem(KEYS.SAVED_MEALS, meals);
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export function getFavorites(): string[] {
  return getItem<string[]>(KEYS.FAVORITES, []);
}

export function toggleFavorite(foodId: string): void {
  const favs = getFavorites();
  const index = favs.indexOf(foodId);
  if (index === -1) {
    favs.push(foodId);
  } else {
    favs.splice(index, 1);
  }
  setItem(KEYS.FAVORITES, favs);
}

// ---------------------------------------------------------------------------
// Data Export & Clear
// ---------------------------------------------------------------------------

export function exportAllData(): Record<string, any> {
  return {
    profile: getProfile(),
    dailyLogs: getAllDailyLogs(),
    uricAcidReadings: getUricAcidReadings(),
    flares: getFlares(),
    medications: getMedications(),
    scanRecords: getScanRecords(),
    savedMeals: getSavedMeals(),
    favorites: getFavorites(),
    exportedAt: new Date().toISOString(),
  };
}

export function clearAllData(): void {
  if (!isLocalStorageAvailable()) return;
  Object.values(KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

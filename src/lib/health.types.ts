export interface HealthToday {
  steps: number | null;
  /** Minutes asleep last night */
  sleepMinutes: number | null;
  /** Average or resting heart rate in beats per minute */
  heartRate: number | null;
}

export interface HealthApi {
  /** Platform has a health store the app can read from */
  isAvailable(): Promise<boolean>;
  /** Ask for read permission; resolves true when granted */
  connect(): Promise<boolean>;
  readToday(): Promise<HealthToday>;
  /** Name shown to the user, e.g. "Health Connect" */
  providerName: string;
}

export const EMPTY_HEALTH: HealthToday = { steps: null, sleepMinutes: null, heartRate: null };

/** 6 pm yesterday, used as the start of "last night". */
export function lastNightStart() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(18, 0, 0, 0);
  return d;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

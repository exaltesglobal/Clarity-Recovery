import {
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import { EMPTY_HEALTH, type HealthApi, lastNightStart, startOfToday } from './health.types';

const PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'HeartRate' },
] as const;

let initialized = false;

async function ready() {
  if ((await getSdkStatus()) !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
  if (!initialized) initialized = await initialize();
  return initialized;
}

/** Android: Health Connect, which Fitbit, Samsung Health, Garmin, Wear OS and others sync into. */
export const health: HealthApi = {
  providerName: 'Health Connect',
  async isAvailable() {
    try {
      return await ready();
    } catch {
      return false;
    }
  },
  async connect() {
    try {
      if (!(await ready())) return false;
      const granted = await requestPermission([...PERMISSIONS]);
      return granted.length > 0;
    } catch {
      return false;
    }
  },
  async readToday() {
    try {
      if (!(await ready())) return EMPTY_HEALTH;
      const granted = new Set((await getGrantedPermissions()).map((p) => p.recordType));
      const now = new Date().toISOString();
      const today = { operator: 'between' as const, startTime: startOfToday().toISOString(), endTime: now };
      const night = { operator: 'between' as const, startTime: lastNightStart().toISOString(), endTime: now };
      const [steps, sleep, heart] = await Promise.all([
        granted.has('Steps') ? aggregateRecord({ recordType: 'Steps', timeRangeFilter: today }) : null,
        granted.has('SleepSession') ? aggregateRecord({ recordType: 'SleepSession', timeRangeFilter: night }) : null,
        granted.has('HeartRate') ? aggregateRecord({ recordType: 'HeartRate', timeRangeFilter: today }) : null,
      ]);
      return {
        steps: steps ? steps.COUNT_TOTAL : null,
        sleepMinutes: sleep && sleep.SLEEP_DURATION_TOTAL ? Math.round(sleep.SLEEP_DURATION_TOTAL / 60) : null,
        heartRate: heart && heart.BPM_AVG ? Math.round(heart.BPM_AVG) : null,
      };
    } catch {
      return EMPTY_HEALTH;
    }
  },
};

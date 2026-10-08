import {
  CategoryValueSleepAnalysis,
  isHealthDataAvailableAsync,
  queryCategorySamples,
  queryStatisticsForQuantity,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';

import { EMPTY_HEALTH, type HealthApi, lastNightStart, startOfToday } from './health.types';

const READ = [
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKCategoryTypeIdentifierSleepAnalysis',
] as const;

const ASLEEP = new Set<number>([
  CategoryValueSleepAnalysis.asleepUnspecified,
  CategoryValueSleepAnalysis.asleepCore,
  CategoryValueSleepAnalysis.asleepDeep,
  CategoryValueSleepAnalysis.asleepREM,
]);

/** iOS: Apple Health, which Apple Watch and most fitness trackers write into. */
export const health: HealthApi = {
  providerName: 'Apple Health',
  async isAvailable() {
    try {
      return await isHealthDataAvailableAsync();
    } catch {
      return false;
    }
  },
  async connect() {
    try {
      // iOS never reveals whether read access was granted; a completed request is the best signal.
      return await requestAuthorization({ toRead: READ });
    } catch {
      return false;
    }
  },
  async readToday() {
    try {
      const now = new Date();
      const [steps, heart, sleep] = await Promise.all([
        queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], {
          filter: { date: { startDate: startOfToday(), endDate: now } },
          unit: 'count',
        }),
        queryStatisticsForQuantity('HKQuantityTypeIdentifierRestingHeartRate', ['mostRecent'], {
          unit: 'count/min',
        }),
        queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
          filter: { date: { startDate: lastNightStart(), endDate: now } },
          limit: 0,
        }),
      ]);
      const asleepMs = sleep
        .filter((s) => ASLEEP.has(Number(s.value)))
        .reduce((total, s) => total + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()), 0);
      return {
        steps: steps.sumQuantity ? Math.round(steps.sumQuantity.quantity) : null,
        sleepMinutes: asleepMs > 0 ? Math.round(asleepMs / 60000) : null,
        heartRate: heart.mostRecentQuantity ? Math.round(heart.mostRecentQuantity.quantity) : null,
      };
    } catch {
      return EMPTY_HEALTH;
    }
  },
};

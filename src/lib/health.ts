import { EMPTY_HEALTH, type HealthApi } from './health.types';

// Web and other platforms: no health store.
export const health: HealthApi = {
  providerName: 'Health',
  isAvailable: async () => false,
  connect: async () => false,
  readToday: async () => EMPTY_HEALTH,
};

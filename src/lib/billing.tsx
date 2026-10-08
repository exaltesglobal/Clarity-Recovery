import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Linking, Platform } from 'react-native';
import Purchases, { type CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

/**
 * Subscriptions through RevenueCat, which wraps Google Play Billing and StoreKit.
 * react-native-purchases bundles the native Android SDK (com.revenuecat.purchases:purchases),
 * so no Gradle changes are needed; react-native-purchases-ui adds Paywalls and Customer Center.
 *
 * RevenueCat setup (see docs/revenuecat.md):
 * - Products: monthly, six_month, yearly, each with a 1-month free trial.
 * - Entitlement "clarity_recovery_pro" attached to all three products.
 * - A current offering with the packages $rc_monthly, $rc_six_month and $rc_annual,
 *   plus a Paywall designed in the dashboard.
 * - Prices are set per country in Play Console / App Store Connect; the Paywall shows
 *   the localized price the store returns for the user's account country.
 */

export const ENTITLEMENT_ID = 'clarity_recovery_pro';

// Public SDK keys, inlined at build time. Set them per EAS build profile (eas.json `env`
// or `eas env:create`). Keys starting with "test_" use RevenueCat's Test Store.
const API_KEY =
  Platform.select({
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  }) ?? '';

const STORE_SUBSCRIPTIONS_URL =
  Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions';

interface BillingState {
  /** Billing is configured for this platform (API key present, not web) */
  available: boolean;
  ready: boolean;
  premium: boolean;
  inTrial: boolean;
  expiresAt: string | null;
  willRenew: boolean;
  /** The current offering loaded with at least one package, so a paywall can be shown */
  hasOffering: boolean;
  customerInfo: CustomerInfo | null;
  /** Apply customer info returned by a purchase or restore in the RevenueCat Paywall. */
  update: (info: CustomerInfo) => void;
  /** Opens RevenueCat's Customer Center, falling back to the store's subscription page. */
  manage: () => Promise<void>;
}

const BillingContext = createContext<BillingState | null>(null);

let configured: boolean | null = null;

/** Configures the SDK once per app launch; false when billing can't run here. */
function configureOnce(): boolean {
  if (configured !== null) return configured;
  if (Platform.OS === 'web' || !API_KEY) return (configured = false);
  // The SDK deliberately crashes release builds that use a Test Store key, so only
  // development builds may use one. Preview/production builds need the platform key.
  if (API_KEY.startsWith('test_') && !__DEV__) {
    console.warn('RevenueCat: Test Store key ignored in a release build; set the platform API key.');
    return (configured = false);
  }
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: API_KEY });
    configured = true;
  } catch (e) {
    console.warn('RevenueCat: configure failed', e);
    configured = false;
  }
  return configured;
}

export function BillingProvider({ children }: { children: ReactNode }) {
  const [available] = useState(configureOnce);
  const [ready, setReady] = useState(!available);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [hasOffering, setHasOffering] = useState(false);

  useEffect(() => {
    if (!available) return;
    // Fires on purchases, restores, renewals and expirations, including ones made in the
    // RevenueCat Paywall or Customer Center, so premium state never goes stale.
    const listener = (next: CustomerInfo) => setInfo(next);
    Purchases.addCustomerInfoUpdateListener(listener);
    Promise.allSettled([Purchases.getCustomerInfo(), Purchases.getOfferings()])
      .then(([customer, offerings]) => {
        if (customer.status === 'fulfilled') setInfo(customer.value);
        else if (__DEV__) console.warn('RevenueCat: getCustomerInfo failed', customer.reason);
        if (offerings.status === 'fulfilled') {
          setHasOffering((offerings.value.current?.availablePackages.length ?? 0) > 0);
        } else if (__DEV__) console.warn('RevenueCat: getOfferings failed', offerings.reason);
      })
      .finally(() => setReady(true));
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [available]);

  const manage = useCallback(async () => {
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: { onRestoreCompleted: ({ customerInfo }) => setInfo(customerInfo) },
      });
    } catch (e) {
      if (__DEV__) console.warn('RevenueCat: Customer Center unavailable', e);
      await Linking.openURL(STORE_SUBSCRIPTIONS_URL).catch(() => {});
    }
  }, []);

  const value = useMemo<BillingState>(() => {
    const entitlement = info?.entitlements.active[ENTITLEMENT_ID];
    return {
      available,
      ready,
      // Without billing configured (web preview, builds without keys)
      // everything stays unlocked so the app can be tested end to end.
      premium: available ? !!entitlement : true,
      inTrial: entitlement?.periodType === 'TRIAL',
      expiresAt: entitlement?.expirationDate ?? null,
      willRenew: entitlement?.willRenew ?? false,
      hasOffering,
      customerInfo: info,
      update: setInfo,
      manage,
    };
  }, [available, ready, info, hasOffering, manage]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingState {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used inside <BillingProvider>');
  return ctx;
}

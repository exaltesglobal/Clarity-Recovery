import Constants from 'expo-constants';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
  type PurchasesPackage,
} from 'react-native-purchases';

/**
 * Subscriptions through RevenueCat, which wraps Google Play Billing and StoreKit.
 *
 * Store setup (done once in Play Console / App Store Connect and RevenueCat):
 * - Three auto-renewing subscriptions: monthly, 6-month and yearly.
 * - Each has a 1-month free trial offer for new subscribers.
 * - Prices are set per country in the store consoles (Play Console has
 *   "Set prices by country"; App Store Connect has price schedules per storefront).
 *   The app never hard-codes prices: it shows the localized priceString the
 *   store returns for the user's account country.
 * - RevenueCat: entitlement "premium", default offering with the packages
 *   $rc_monthly, $rc_six_month and $rc_annual.
 */

export const ENTITLEMENT_ID = 'premium';
export const PLAN_TYPES = [PACKAGE_TYPE.MONTHLY, PACKAGE_TYPE.SIX_MONTH, PACKAGE_TYPE.ANNUAL] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

const keys = (Constants.expoConfig?.extra?.revenueCat ?? {}) as { android?: string; ios?: string };
const API_KEY = Platform.select({ android: keys.android, ios: keys.ios }) || '';

export interface Plan {
  type: PlanType;
  pkg: PurchasesPackage;
  price: string;
  pricePerMonth: string | null;
  /** e.g. "1 month free" when the store offers a free trial to this user */
  trialPeriod: { unit: string; count: number } | null;
}

interface BillingState {
  /** Billing is configured for this platform (API key present, not web) */
  available: boolean;
  ready: boolean;
  premium: boolean;
  inTrial: boolean;
  expiresAt: string | null;
  willRenew: boolean;
  plans: Plan[];
  purchase: (plan: Plan) => Promise<'purchased' | 'cancelled' | 'error'>;
  restore: () => Promise<boolean>;
}

const BillingContext = createContext<BillingState | null>(null);

function planFromPackage(pkg: PurchasesPackage): Plan {
  const product = pkg.product;
  const free = product.defaultOption?.freePhase?.billingPeriod;
  const intro = product.introPrice;
  const trialPeriod = free
    ? { unit: free.unit, count: free.value }
    : intro && intro.price === 0
      ? { unit: intro.periodUnit, count: intro.periodNumberOfUnits }
      : null;
  return {
    type: pkg.packageType as PlanType,
    pkg,
    price: product.priceString,
    pricePerMonth: product.pricePerMonthString,
    trialPeriod,
  };
}

let configured: boolean | null = null;

/** Configures the SDK once per app launch; false when billing can't run here. */
function configureOnce(): boolean {
  if (configured !== null) return configured;
  if (Platform.OS === 'web' || !API_KEY) return (configured = false);
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: API_KEY });
    configured = true;
  } catch {
    configured = false;
  }
  return configured;
}

export function BillingProvider({ children }: { children: ReactNode }) {
  const [available] = useState(configureOnce);
  const [ready, setReady] = useState(!available);
  const [info, setInfo] = useState<CustomerInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (!available) return;
    const listener = (next: CustomerInfo) => setInfo(next);
    Purchases.addCustomerInfoUpdateListener(listener);
    Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()])
      .then(([customer, offerings]) => {
        setInfo(customer);
        const pkgs = offerings.current?.availablePackages ?? [];
        setPlans(
          PLAN_TYPES.map((type) => pkgs.find((p) => p.packageType === type))
            .filter((p): p is PurchasesPackage => !!p)
            .map(planFromPackage),
        );
      })
      .catch(() => {})
      .finally(() => setReady(true));
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [available]);

  const purchase = useCallback(async (plan: Plan) => {
    try {
      const result = await Purchases.purchasePackage(plan.pkg);
      setInfo(result.customerInfo);
      return 'purchased' as const;
    } catch (e) {
      return (e as { userCancelled?: boolean }).userCancelled ? ('cancelled' as const) : ('error' as const);
    }
  }, []);

  const restore = useCallback(async () => {
    try {
      const customer = await Purchases.restorePurchases();
      setInfo(customer);
      return !!customer.entitlements.active[ENTITLEMENT_ID];
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<BillingState>(() => {
    const entitlement = info?.entitlements.active[ENTITLEMENT_ID];
    return {
      available,
      ready,
      // Without billing configured (web preview, development builds without keys)
      // everything stays unlocked so the app can be tested end to end.
      premium: available ? !!entitlement : true,
      inTrial: entitlement?.periodType === 'TRIAL',
      expiresAt: entitlement?.expirationDate ?? null,
      willRenew: entitlement?.willRenew ?? false,
      plans,
      purchase,
      restore,
    };
  }, [available, ready, info, plans, purchase, restore]);

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBilling(): BillingState {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used inside <BillingProvider>');
  return ctx;
}

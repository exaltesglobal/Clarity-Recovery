# RevenueCat setup

The app uses RevenueCat's React Native SDK:

- **`react-native-purchases`** bundles the native Android SDK (`com.revenuecat.purchases:purchases`) and the iOS SDK, so you don't need any Gradle changes.
- **`react-native-purchases-ui`** adds Paywalls and Customer Center.
- The code lives in `src/lib/billing.tsx` (setup, entitlement state, Customer Center) and `src/app/paywall.tsx` (Paywall screen).

| Thing | Value |
| --- | --- |
| Entitlement | `clarity_recovery_pro` |
| Products | `monthly`, `six_month`, `yearly` |
| Offering | the **current** offering, with packages `$rc_monthly`, `$rc_six_month`, `$rc_annual` |

## 1. API keys

| Build | Where the key comes from | Key |
| --- | --- | --- |
| Development build (`eas build --profile development`, then `npx expo start`) | `.env` | Test Store key (`test_…`) |
| Preview APK / production | `eas.json` → `build.<profile>.env` | Google Play key (`goog_…`) and App Store key (`appl_…`) from **Project settings → API keys** |

The SDK **deliberately crashes release builds** that use a Test Store key. That includes the preview APK, Google Play testing tracks and TestFlight. To avoid this crash, the app ignores a `test_` key outside development builds. Without a valid key, billing is off and all features are unlocked.

## 2. Products (Test Store first)

1. In RevenueCat, go to **Apps and providers** and create a **Test Store** (this gives you the `test_` key).
2. Go to **Product catalog → Products** and create three subscription products:
   - `monthly`: duration 1 month
   - `six_month`: duration 6 months
   - `yearly`: duration 1 year

   Set the price when you create each one. You can't edit Test Store products later; to change one, create a replacement and swap it into the offering.
3. Test subscriptions renew quickly: a 1-month product renews every 5 minutes, up to 5 times.

For the real stores:

- Create the same three product IDs in **Play Console → Monetize → Subscriptions** and in **App Store Connect**.
- On each one, add a **1-month free trial** offer for new subscribers.
- Set prices by country.
- In RevenueCat, connect the Play and App Store apps (service credentials) and import the products.

## 3. Entitlement

Go to **Product catalog → Entitlements** and create one with the identifier `clarity_recovery_pro`. Attach all three products to it, for every store. The app only checks this entitlement, never product IDs, so plans can change without an app update.

## 4. Offering

1. Go to **Product catalog → Offerings** and create an offering (for example `default`). Mark it **current**.
2. Add the packages:
   - **Monthly** (`$rc_monthly`) → `monthly`
   - **Six Month** (`$rc_six_month`) → `six_month`
   - **Annual** (`$rc_annual`) → `yearly`

## 5. Paywall

- Go to **Paywalls**, create a paywall for the current offering, and publish it.
- Add translations for the app's languages in the paywall editor.
- The app adds its own close button above the paywall, so you don't need one in the design.
- If an offering has no published paywall, RevenueCat shows a default paywall.

## 6. Customer Center

- Configure **Customer Center** in the RevenueCat dashboard.
- Customer Center needs a RevenueCat **Pro or Enterprise** plan. When it isn't available, the app opens the Play Store / App Store subscription page instead.
- Subscribers reach it from **Settings → Subscription** or from **Manage** on the paywall screen.

## 7. Test on a device

Test Store purchases need native code, so they don't work in Expo Go or on web.

```bash
npx eas-cli@latest build --profile development --platform android   # install the dev build on the phone
npx expo start                                                     # loads .env, including the test key
```

Then check:

- **Paywall:** open a premium feature, or **Settings → Subscription**, and the RevenueCat Paywall appears. In the Test Store purchase dialog, choose **success**; the app unlocks and returns.
- **Cancel / failure:** choose **cancel** or **failure** in the dialog; the paywall stays open and nothing unlocks.
- **Customer Center:** **Settings → Subscription** opens Customer Center once you're subscribed.
- **Expiry:** after about 25 minutes the test subscription expires, and premium locks again without restarting the app.

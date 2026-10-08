# RevenueCat setup

The app uses RevenueCat's React Native SDK:

- **`react-native-purchases`** bundles the native Android SDK (`com.revenuecat.purchases:purchases`) and the iOS SDK, so you don't need any Gradle changes.
- **`react-native-purchases-ui`** adds Paywalls and Customer Center.
- The code lives in `src/lib/billing.tsx` (setup, entitlement state, Customer Center) and `src/app/paywall.tsx` (Paywall screen).

| Thing | Value |
| --- | --- |
| Entitlement | `clarity_recovery_pro` |
| Products | `monthly`, `six_month`, `yearly` in Play / App Store; in the Test Store `monthly`, `six_month_v2`, `yearly_v2` (see section 2) |
| Offering | `default`, the **current** offering, with packages `$rc_monthly`, `$rc_six_month`, `$rc_annual` |

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

**Current Test Store products** (project `Clarity Recovery`):

| Product | Duration | Price | In the offering |
| --- | --- | --- | --- |
| `monthly` | 1 month | $9.99 | `$rc_monthly` |
| `six_month_v2` | 6 months | $39.99 | `$rc_six_month` |
| `yearly_v2` | 1 year | $59.99 | `$rc_annual` |
| `six_month` | 6 months | $49.99 | no: wrong price, detached and archived |
| `yearly` | 1 year | $79.99 | no: wrong price, detached and archived |

`six_month` and `yearly` were first created at the wrong prices, so the `_v2` products replace them in the offering and on the entitlement. Archived products keep their display names, so the replacements are named "Six Month (v2)" and "Yearly (v2)". The store products keep the plain IDs `monthly`, `six_month`, `yearly`. Package IDs can differ per store, and the app only checks the entitlement.

Don't model the free trial as a product. A one-time `1_month_free_trial` product was attached to the entitlement once, which would have unlocked Pro forever for $0.99. It is now detached and inactive. Trials belong on the store subscriptions (section 2a).

**Through the API.** The REST API v2 (`POST /v2/projects/{project_id}/products`) creates a Test Store product with `subscription.duration` and a required `title`, but no price. The `display_name` must be unique per app. The price is set afterwards with `POST /v2/projects/{project_id}/products/{product_id}/test_store_prices` and the body `{"prices":[{"amount_micros":39990000,"currency":"USD"}]}`. That endpoint isn't in the public v2 reference; it worked in October 2026.

For the real stores:

- Create the same three product IDs in **Play Console → Monetize → Subscriptions** and in **App Store Connect**.
- Add the 1-month free trial to each one (see the next section).
- Set prices by country.
- In RevenueCat, connect the Play and App Store apps (service credentials) and import the products.

## 2a. The 1-month free trial

The free trial is part of each **store product**, not something the app code sets. Once it's on the product, the SDK applies it automatically:

- **Google Play:** RevenueCat picks the longest free trial the user is eligible for when they buy a package.
- **App Store:** Apple applies the introductory offer at checkout.

**Google Play.** In Play Console → **Subscriptions**, for each of `monthly`, `six_month`, `yearly`:

1. Open the base plan and choose **Add offer**.
2. Set **Eligibility** to *New customer acquisition* (people who never had this subscription).
3. Add a **Free trial** phase of **1 month**, then activate the offer.
4. Don't add other developer-determined offers to the same base plan. RevenueCat would also consider them when choosing an offer.

**App Store.** In App Store Connect, open each subscription and set up an **Introductory Offer**:

- Create a **Free** offer lasting **1 month** for all territories.
- New offers can take a few hours to appear.

**Test Store can't simulate trials yet.** RevenueCat staff confirmed this in December 2025. Test Store purchases start straight away as paid, so test the trial with:

- Google Play license testers on an internal testing track (trials and renewals are shortened in test purchases), or
- App Store sandbox / TestFlight.

**In the Paywall editor**, show the trial only to people who can get it:

- Put a component behind an **Introductory offer** rule, using text like `Start your {{ product.offer_period }} free`.
- RevenueCat requires offer variables to be inside such a rule. Everyone else sees the plain price text.

**What the app does for trial users:**

- **Settings → Subscription** shows "Free trial, ends {date}".
- A notification goes out **2 days before the trial ends**, saying when the paid plan starts and how to cancel.
- The notification is cancelled automatically if the user turns off auto-renew or the trial ends.
- To check a trial was applied, look at the customer's history in RevenueCat: the purchase should show `period_type` **TRIAL**.

## 3. Entitlement

Go to **Product catalog → Entitlements** and create one with the identifier `clarity_recovery_pro`. Attach all three products to it, for every store. When you connect Play and the App Store, attach their `monthly`, `six_month` and `yearly` products here and add them to the matching packages of the `default` offering. The app only checks this entitlement, never product IDs, so plans can change without an app update.

## 4. Offering

1. Go to **Product catalog → Offerings** and create an offering (for example `default`). Mark it **current**.
2. Add the packages:
   - **Monthly** (`$rc_monthly`) → `monthly`
   - **Six Month** (`$rc_six_month`) → `six_month` (Test Store: `six_month_v2`)
   - **Annual** (`$rc_annual`) → `yearly` (Test Store: `yearly_v2`)

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

Then check (with the Test Store; trials need a store sandbox, see 2a):

- **Paywall:** open a premium feature, or **Settings → Subscription**, and the RevenueCat Paywall appears. In the Test Store purchase dialog, choose **success**; the app unlocks and returns.
- **Cancel / failure:** choose **cancel** or **failure** in the dialog; the paywall stays open and nothing unlocks.
- **Customer Center:** **Settings → Subscription** opens Customer Center once you're subscribed.
- **Expiry:** after about 25 minutes the test subscription expires, and premium locks again without restarting the app.

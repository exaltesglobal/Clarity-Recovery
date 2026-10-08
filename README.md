# Clarity Recovery

A private, judgement-free companion app for people quitting porn. Built with React Native and [Expo](https://expo.dev) (SDK 57, Expo Router).

Recovery data (streaks, journal, check-ins) is stored **only on the device**. There are no accounts and no analytics.

## Features

| Area | What it does |
| --- | --- |
| **Onboarding** | Language, gender, age range, country, an 8-question self-check that sets a starting plan (reminders, protection, goal), reasons and faith preference. Everything can be changed later in Settings. |
| **Streak tracker** | Days/hours free, progress to the next milestone, best streak, goal. |
| **Panic / SOS** | Raised SOS button in the tab bar, a long-press app-icon shortcut, paced breathing, a 10-minute timer, your reasons, and a one-tap pre-filled SMS to your accountability partner. Shows scripture and a prayer when faith content is on. |
| **Relapse log, check-in & journal** | Mood, urge level, triggers, notes, gratitude, 7-day insights. |
| **Wellness** | 15 timed sessions (meditation, yoga, exercise, grounding), diet tips, a habit checklist, and research facts that update from a remote feed. |
| **Stories** | Real recovery stories, loaded from the remote feed only with the author's consent. Nothing is invented. |
| **Protection (Android)** | One-tap adult-site blocking through a local DNS-only VPN to CleanBrowsing Family, plus a "mindful pause" screen when you open selected social apps (accessibility service). On iOS, the app guides you to install a DNS profile. |
| **Instagram check** | Reads your own Instagram data export on the device and flags accounts you follow that look like adult content. |
| **Reminders** | Hourly (or every N hours) nudges within waking hours, plus a daily check-in. Uses expo-notifications, which runs on AlarmManager/NotificationManager on Android. |
| **Health (optional)** | Steps, sleep and heart rate from Health Connect (Android) or HealthKit (iOS). |
| **Region & language** | Crisis helplines and resources for the user's country. 14 languages: English, Hindi, Marathi, Spanish, Arabic, Portuguese, Chinese, French, Bengali, Russian, Urdu, Indonesian, German and Japanese. Arabic and Urdu use a right-to-left layout. |
| **Branding & themes** | Logo, five calm theme presets, light/dark/system mode and a custom accent colour. |
| **Subscriptions** | A one-month free trial, then Monthly, 6-month or Yearly plans through RevenueCat, shown in a RevenueCat Paywall, with Customer Center for subscribers. Prices are set per country in the store. SOS, helplines, streaks, check-ins and site blocking are always free. |

## Getting started

```bash
npm install
npx expo start
```

The app uses native modules (DNS filter, health, purchases), so it needs a development build rather than Expo Go:

```bash
npx eas-cli@latest build --profile development --platform android   # dev client
npx eas-cli@latest build --profile preview --platform android       # installable APK
```

Checks:

```bash
npm run typecheck              # tsc --noEmit
npm run lint                   # expo lint
node scripts/check-i18n.mjs    # translation keys / placeholders
npx expo-doctor
```

## Configuration

RevenueCat keys come from `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` / `EXPO_PUBLIC_REVENUECAT_IOS_KEY`:
`.env` (Test Store key, development builds) and `eas.json` → `build.<profile>.env` (store keys).
Without a key, every feature is unlocked. Dashboard setup (entitlement `clarity_recovery_pro`, products,
offering, Paywall, Customer Center) is in [docs/revenuecat.md](docs/revenuecat.md).

In `app.json` → `expo.extra`:

- `contentFeedUrl`: a JSON feed of facts and testimonials (see `content/README.md`).
- `storiesEmail`: the address where users can submit their own stories.

## Project structure

```
src/
  app/            # Expo Router screens; (tabs)/ = Today, Journal, Wellness, Support
  components/     # UI kit, logo, tab bar, pickers, assessment, premium gate
  content/        # helplines by region, countries, wellness sessions, facts feed, verses
  i18n/           # i18next setup + locales/*.json
  lib/            # store, billing, notifications, health, guard, instagram, contact
  theme.ts        # theme presets and customisation
modules/clarity-guard/   # local Expo module (Kotlin): DNS-filter VPN + mindful-pause service
content/feed.json        # remote-updatable facts and testimonials
```

## Notes

- Wellness content is general guidance, not medical advice.
- Helplines were checked against public directories. Check them again before release, and the Support tab always links to findahelpline.com.

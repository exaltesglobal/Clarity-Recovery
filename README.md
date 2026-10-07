# Renew

A private, judgement-free companion app for people quitting porn. Built with React Native and [Expo](https://expo.dev) (SDK 57, Expo Router).

Everything is stored **only on the device**. There are no accounts, servers or analytics.

## Features

| Area | What it does |
| --- | --- |
| **Streak tracker** | Days/hours free, progress to the next milestone (1, 3, 7, 14, 30, 60, 90, 180, 365…), best streak, goal. |
| **Urge SOS** | One tap from the home screen: paced breathing circle, a 10-minute "ride it out" timer, your personal reasons, a verse or affirmation, a quick workout, and a button to text your partner. Logs every urge you beat. |
| **Relapse log** | Compassionate flow that records triggers, what happened and a plan for next time. It resets the streak but keeps your history and best streak. |
| **Daily check-in & journal** | Mood, urge level (0–10), triggers, journal note and gratitude. The Journal tab shows 7-day averages and your most common triggers. |
| **Wellness** | Guided, timed sessions: meditation (calm breathing, urge surfing, body scan, self-compassion), yoga flows, bodyweight workouts, a brisk-walk plan, and diet tips. Finishing a session checks off that day's habit. |
| **Healthy habits** | Daily checklist covering meditation, exercise, yoga, eating, water, connection and phone-free bedroom. |
| **Bible verses & prayer (optional)** | Turned off by default. When on, it shows a daily KJV verse, grace verses after a slip, a breath-prayer session and a prayer habit. |
| **Accountability partner** | Save a trusted contact, text them "I'm struggling", call them, or send a weekly progress summary by SMS or any share target. |
| **Reminders** | Discreet daily check-in notification at a time you choose (iOS/Android). |

## Getting started

```bash
npm install
npx expo start        # scan the QR code with Expo Go, or press i / a / w
```

Useful scripts:

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
npx expo-doctor       # dependency / config health check
```

To build for the stores use [EAS Build](https://docs.expo.dev/build/introduction/): `npx eas-cli@latest build`.

## Project structure

```
src/
  app/                 # Expo Router screens (file-based routes)
    (tabs)/            # Today, Journal, Wellness, Support
    sos.tsx            # Urge SOS modal
    relapse.tsx        # Log a slip
    checkin.tsx        # Daily check-in
    session/[id].tsx   # Guided meditation / yoga / workout player
    settings.tsx
    onboarding.tsx
  components/          # UI kit, breathing circle, reasons editor
  content/             # Verses, affirmations, triggers, wellness sessions, diet tips
  lib/                 # Local store (AsyncStorage), dates, notifications, haptics
  theme.ts             # Light/dark palette
```

## Notes

- Wellness content is general guidance, not medical advice.
- The Support tab points to professional help and, in the US, the 988 crisis line.

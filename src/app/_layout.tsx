import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import * as QuickActions from 'expo-quick-actions';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, useColorScheme, View } from 'react-native';

import { Logo } from '../components/Logo';
// Importing i18n also initializes translations before any screen renders.
import { applyLanguage, languageInfo } from '../i18n';
import { BillingProvider, useBilling } from '../lib/billing';
import { guard, PAUSE_APP_TOKEN } from '../lib/guard';
import { configureNotifications, syncReminders, syncTrialReminder } from '../lib/notifications';
import { StoreProvider, useStore } from '../lib/store';
import { buildTheme, ThemeContext, useFallbackTheme } from '../theme';

configureNotifications();
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });
  const t = useFallbackTheme();
  return (
    <StoreProvider
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: t.bg }}>
          <Logo size={96} />
          <ActivityIndicator color={t.primary} />
        </View>
      }
    >
      <BillingProvider>
        <AppShell fontsLoaded={fontsLoaded} />
      </BillingProvider>
    </StoreProvider>
  );
}

function AppShell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { data } = useStore();
  const { t, i18n } = useTranslation();
  const systemDark = useColorScheme() === 'dark';
  const language = data.profile.language;

  // Apply the saved language before the first frame renders.
  useState(() => applyLanguage(language));
  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  const theme = useMemo(() => {
    const fonts =
      fontsLoaded && languageInfo(language).latin
        ? { regular: 'Nunito_400Regular', semibold: 'Nunito_600SemiBold', bold: 'Nunito_700Bold', heavy: 'Nunito_800ExtraBold' }
        : {};
    return buildTheme(data.appearance, systemDark, fonts);
  }, [data.appearance, systemDark, fontsLoaded, language]);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (data.onboarded) syncReminders(data.reminders, t).catch(() => {});
  }, [data.onboarded, data.reminders, i18n.language, t]);

  // Remind trial users before the free month turns into a paid plan.
  const billing = useBilling();
  const trialEndsAt = billing.inTrial && billing.willRenew ? billing.expiresAt : null;
  useEffect(() => {
    if (billing.ready) syncTrialReminder(trialEndsAt, t, i18n.language).catch(() => {});
  }, [billing.ready, trialEndsAt, i18n.language, t]);

  // Keep the native mindful-pause settings, texts and colours in step with the app.
  const reasons = data.profile.reasons;
  useEffect(() => {
    const app = PAUSE_APP_TOKEN;
    guard?.setPauseConfig(data.protection.mindfulPause, data.protection.pauseApps, {
      title: t('pause.title'),
      body: t('pause.body', { app }),
      breathe: t('pause.breathe'),
      leave: t('pause.leave', { app }),
      support: t('panic.button'),
      notNow: t('pause.notNow'),
      continue: t('pause.continue', { app }),
      reasonsTitle: t('sos.rememberWhy'),
      reasons,
      rtl: !!languageInfo(i18n.language).rtl,
      colors: {
        bg: theme.bg,
        card: theme.card,
        text: theme.text,
        muted: theme.muted,
        primary: theme.primary,
        onPrimary: theme.onPrimary,
        accent: theme.accent,
        danger: theme.danger,
        onDanger: theme.onDanger,
      },
    });
  }, [data.protection.mindfulPause, data.protection.pauseApps, reasons, theme, i18n.language, t]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    QuickActions.setItems([
      {
        id: 'sos',
        title: t('panic.shortcutTitle'),
        subtitle: t('panic.shortcutSubtitle'),
        icon: Platform.OS === 'ios' ? 'symbol:lifepreserver' : 'shortcut_sos',
        params: { href: '/sos' },
      },
    ]).catch(() => {});
  }, [i18n.language, t]);

  const headerFont = theme.fonts.bold ? { fontFamily: theme.fonts.bold } : { fontWeight: '700' as const };

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerShadowVisible: false,
          headerTintColor: theme.text,
          headerTitleStyle: headerFont,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="sos" options={{ title: t('sos.title'), presentation: 'fullScreenModal' }} />
        <Stack.Screen name="relapse" options={{ title: t('relapse.title'), presentation: 'modal' }} />
        <Stack.Screen name="checkin" options={{ title: t('checkin.title'), presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="pause" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
        <Stack.Screen name="appearance" options={{ title: t('appearance.title') }} />
        <Stack.Screen name="reminders" options={{ title: t('reminders.title') }} />
        <Stack.Screen name="sound" options={{ title: t('sound.title') }} />
        <Stack.Screen name="profile" options={{ title: t('profileEdit.title') }} />
        <Stack.Screen name="assessment" options={{ title: t('assessment.title') }} />
        <Stack.Screen name="protection" options={{ title: t('protection.title') }} />
        <Stack.Screen name="setup" options={{ title: t('setup.title') }} />
        <Stack.Screen name="instagram" options={{ title: t('instagram.title') }} />
        <Stack.Screen name="stories" options={{ title: t('stories.title') }} />
        <Stack.Screen name="facts" options={{ title: t('facts.title') }} />
        <Stack.Screen name="helplines" options={{ title: t('helplines.title') }} />
        <Stack.Screen name="health" options={{ title: t('health.title') }} />
        <Stack.Screen name="session/[id]" options={{ title: '' }} />
      </Stack>
    </ThemeContext.Provider>
  );
}

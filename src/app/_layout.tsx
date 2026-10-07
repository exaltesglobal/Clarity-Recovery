import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { configureNotifications } from '../lib/notifications';
import { StoreProvider } from '../lib/store';
import { useTheme } from '../theme';

configureNotifications();

export default function RootLayout() {
  const t = useTheme();
  return (
    <StoreProvider
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
          <ActivityIndicator color={t.primary} />
        </View>
      }
    >
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.card },
          headerTintColor: t.text,
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="sos" options={{ title: 'Urge SOS', presentation: 'modal' }} />
        <Stack.Screen name="relapse" options={{ title: 'Log a slip', presentation: 'modal' }} />
        <Stack.Screen name="checkin" options={{ title: 'Daily check-in', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="session/[id]" options={{ title: '' }} />
      </Stack>
    </StoreProvider>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import { useQuickActionRouting } from 'expo-quick-actions/router';
import { Redirect, router, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable } from 'react-native';

import { TabBar } from '../../components/TabBar';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme';

function useNotificationRouting() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const href = response?.notification.request.content.data?.href;
      if (typeof href === 'string' && href !== '/') router.push(href as never);
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}

export default function TabLayout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { data } = useStore();
  useQuickActionRouting();
  useNotificationRouting();

  if (!data.onboarded) return <Redirect href="/onboarding" />;

  const headerFont = t.fonts.heavy ? { fontFamily: t.fonts.heavy } : { fontWeight: '800' as const };

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerShadowVisible: false,
        headerTintColor: t.text,
        headerTitleAlign: 'left',
        headerTitleStyle: { ...headerFont, fontSize: 22 },
        sceneStyle: { backgroundColor: t.bg },
        headerRight: () => (
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel={tr('settings.title')}
            hitSlop={12}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="settings-outline" size={20} color={t.text} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: tr('tabs.today') }} />
      <Tabs.Screen name="journal" options={{ title: tr('tabs.journal') }} />
      <Tabs.Screen name="wellness" options={{ title: tr('tabs.wellness') }} />
      <Tabs.Screen name="support" options={{ title: tr('tabs.support') }} />
    </Tabs>
  );
}

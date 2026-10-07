import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Redirect, Tabs } from 'expo-router';
import { ColorValue, Pressable } from 'react-native';

import type { IconName } from '../../components/ui';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme';

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color} size={size} />;
  };
}

export default function TabLayout() {
  const t = useTheme();
  const { data } = useStore();

  if (!data.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border },
        headerStyle: { backgroundColor: t.card },
        headerTintColor: t.text,
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: icon('sunny-outline'),
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable accessibilityLabel="Settings" hitSlop={12} style={{ marginRight: 16 }}>
                <Ionicons name="settings-outline" size={22} color={t.text} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarIcon: icon('book-outline') }} />
      <Tabs.Screen name="wellness" options={{ title: 'Wellness', tabBarIcon: icon('leaf-outline') }} />
      <Tabs.Screen name="support" options={{ title: 'Support', tabBarIcon: icon('people-outline') }} />
    </Tabs>
  );
}

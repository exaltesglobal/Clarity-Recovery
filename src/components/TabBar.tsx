import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tap } from '../lib/haptics';
import { useTheme } from '../theme';
import type { IconName } from './ui';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, [IconName, IconName]> = {
  index: ['sunny-outline', 'sunny'],
  journal: ['book-outline', 'book'],
  wellness: ['leaf-outline', 'leaf'],
  support: ['people-outline', 'people'],
};

/** Bottom tab bar with a raised SOS button in the middle, always one tap away. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { t: tr } = useTranslation();
  const routes = state.routes;
  const half = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number], index: number) => {
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = typeof options.title === 'string' ? options.title : route.name;
    const [outline, filled] = ICONS[route.name] ?? ['ellipse-outline', 'ellipse'];
    const color = focused ? t.primary : t.muted;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }}
        style={styles.tab}
      >
        <Ionicons name={focused ? filled : outline} size={23} color={color} />
        <Text numberOfLines={1} style={[styles.label, { color }, t.fonts.semibold ? { fontFamily: t.fonts.semibold } : null]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: t.card, borderTopColor: t.border, paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {routes.slice(0, half).map((r, i) => renderTab(r, i))}
      <View style={styles.sosSlot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr('panic.button')}
          onPress={() => {
            tap();
            router.push('/sos');
          }}
          style={({ pressed }) => [
            styles.sos,
            { backgroundColor: t.danger, borderColor: t.card, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Ionicons name="shield-half" size={26} color={t.onDanger} />
          <Text style={[styles.sosText, { color: t.onDanger }]}>SOS</Text>
        </Pressable>
      </View>
      {routes.slice(half).map((r, i) => renderTab(r, i + half))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
  label: { fontSize: 11, maxWidth: '96%' },
  sosSlot: { flex: 1, alignItems: 'center' },
  sos: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginTop: -30,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sosText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: -2 },
});

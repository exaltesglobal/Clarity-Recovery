import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { health } from '../lib/health';
import { EMPTY_HEALTH, type HealthToday } from '../lib/health.types';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';
import { Body, Card, Muted, useFont } from './ui';

export function useHealthToday(enabled: boolean) {
  const [data, setData] = useState<HealthToday>(EMPTY_HEALTH);
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let alive = true;
      health.readToday().then((d) => alive && setData(d));
      return () => {
        alive = false;
      };
    }, [enabled]),
  );
  return data;
}

/** Steps, sleep and heart rate from a connected wearable, or a prompt to connect one. */
export function HealthSummary() {
  const t = useTheme();
  const font = useFont();
  const { t: tr } = useTranslation();
  const { data } = useStore();
  const today = useHealthToday(data.health.connected);

  if (!data.health.connected) {
    return (
      <Pressable onPress={() => router.push('/health')} accessibilityRole="button">
        <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="watch-outline" size={26} color={t.primary} />
          <View style={{ flex: 1, gap: 2 }}>
            <Body style={font('semibold')}>{tr('health.connectTitle')}</Body>
            <Muted>{tr('health.connectTeaser')}</Muted>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.muted} />
        </Card>
      </Pressable>
    );
  }

  const tiles = [
    { icon: 'footsteps-outline' as const, label: tr('health.steps'), value: today.steps?.toLocaleString() ?? '—' },
    {
      icon: 'moon-outline' as const,
      label: tr('health.sleep'),
      value: today.sleepMinutes ? `${Math.floor(today.sleepMinutes / 60)}h ${today.sleepMinutes % 60}m` : '—',
    },
    { icon: 'heart-outline' as const, label: tr('health.heart'), value: today.heartRate ? `${today.heartRate} bpm` : '—' },
  ];

  return (
    <Pressable onPress={() => router.push('/health')} accessibilityRole="button">
      <Card style={styles.row}>
        {tiles.map((tile) => (
          <View key={tile.label} style={styles.tile}>
            <Ionicons name={tile.icon} size={20} color={t.primary} />
            <Body style={font('bold')} numberOfLines={1}>
              {tile.value}
            </Body>
            <Muted numberOfLines={1}>{tile.label}</Muted>
          </View>
        ))}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, alignItems: 'center', gap: 2 },
});

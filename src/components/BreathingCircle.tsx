import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

const PHASES = [
  { label: 'Breathe in', seconds: 4, to: 1 },
  { label: 'Hold', seconds: 4, to: 1 },
  { label: 'Breathe out', seconds: 6, to: 0.55 },
] as const;

/** Paced breathing guide: 4s in, 4s hold, 6s out. A longer exhale calms the body. */
export function BreathingCircle({ size = 200, paused = false }: { size?: number; paused?: boolean }) {
  const t = useTheme();
  const [scale] = useState(() => new Animated.Value(0.55));
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (paused) return;
    const current = PHASES[phase];
    const animation = Animated.timing(scale, {
      toValue: current.to,
      duration: current.seconds * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    const timer = setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), current.seconds * 1000);
    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [phase, paused, scale]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: t.accent,
            borderColor: t.primary,
            transform: [{ scale }],
          },
        ]}
      />
      <Text style={[styles.label, { color: t.primary }]}>{paused ? 'Paused' : PHASES[phase].label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  circle: { position: 'absolute', borderWidth: 2 },
  label: { fontSize: 18, fontWeight: '600' },
});

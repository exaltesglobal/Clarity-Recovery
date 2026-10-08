import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';

export type BreathPhase = 'in' | 'hold' | 'out';

const PHASES = [
  { id: 'in', labelKey: 'breathing.in', seconds: 4, to: 1 },
  { id: 'hold', labelKey: 'breathing.hold', seconds: 4, to: 1 },
  { id: 'out', labelKey: 'breathing.out', seconds: 6, to: 0.55 },
] as const;

/** Paced breathing guide: 4s in, 4s hold, 6s out. A longer exhale calms the body. */
export function BreathingCircle({
  size = 200,
  paused = false,
  onPhase,
}: {
  size?: number;
  paused?: boolean;
  /** Called as each phase begins, e.g. to play a breath cue */
  onPhase?: (phase: BreathPhase) => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [scale] = useState(() => new Animated.Value(0.55));
  const [phase, setPhase] = useState(0);
  const onPhaseRef = useRef(onPhase);
  useEffect(() => {
    onPhaseRef.current = onPhase;
  });

  useEffect(() => {
    if (paused) return;
    const current = PHASES[phase];
    onPhaseRef.current?.(current.id);
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
      <Text style={[styles.label, { color: t.primary }]}>{paused ? tr('breathing.paused') : tr(PHASES[phase].labelKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  circle: { position: 'absolute', borderWidth: 2 },
  label: { fontSize: 18, fontWeight: '600' },
});

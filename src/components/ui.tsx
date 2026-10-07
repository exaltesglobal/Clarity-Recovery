import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { tap } from '../lib/haptics';
import { useTheme } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }, style]}>
      {children}
    </View>
  );
}

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

export function H1({ children, style }: TextProps) {
  const t = useTheme();
  return <Text style={[styles.h1, { color: t.text }, style]}>{children}</Text>;
}

export function H2({ children, style }: TextProps) {
  const t = useTheme();
  return <Text style={[styles.h2, { color: t.text }, style]}>{children}</Text>;
}

export function Body({ children, style, numberOfLines }: TextProps) {
  const t = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.body, { color: t.text }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: TextProps) {
  const t = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.muted, { color: t.muted }, style]}>
      {children}
    </Text>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const colors: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: t.primary, fg: t.onPrimary, border: t.primary },
    secondary: { bg: t.accent, fg: t.primary, border: t.accent },
    danger: { bg: t.danger, fg: t.onDanger, border: t.danger },
    ghost: { bg: 'transparent', fg: t.muted, border: t.border },
  };
  const c = colors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: c.bg, borderColor: c.border, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={20} color={c.fg} />}
      <Text style={[styles.buttonText, { color: c.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[
        styles.chip,
        { borderColor: selected ? t.primary : t.border, backgroundColor: selected ? t.accent : t.card },
      ]}
    >
      <Text style={{ color: selected ? t.primary : t.text, fontWeight: selected ? '600' : '400' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label && <Muted>{label}</Muted>}
      <TextInput
        placeholderTextColor={t.muted}
        {...props}
        style={[
          styles.input,
          { color: t.text, borderColor: t.border, backgroundColor: t.card },
          props.multiline && { minHeight: 90, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const t = useTheme();
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <View style={[styles.track, { backgroundColor: t.accent }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: t.primary }]} />
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: t.accent }]}>
          <Ionicons name={icon} size={20} color={t.primary} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Body style={{ fontWeight: '600' }}>{title}</Body>
        {subtitle && <Muted>{subtitle}</Muted>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={t.muted} />)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 10 },
  h1: { fontSize: 28, fontWeight: '700' },
  h2: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  muted: { fontSize: 14, lineHeight: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

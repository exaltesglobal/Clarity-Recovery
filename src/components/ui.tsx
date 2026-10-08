import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { tap } from '../lib/haptics';
import { Theme, useTheme } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Space reserved at the bottom of tab screens for the raised SOS button. */
export const TAB_SCREEN_PADDING = 110;

export function Screen({ children, tabs = false }: { children: ReactNode; tabs?: boolean }) {
  const t = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={[styles.screen, { paddingBottom: tabs ? TAB_SCREEN_PADDING : 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  variant = 'plain',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'plain' | 'soft' | 'gold' | 'danger';
}) {
  const t = useTheme();
  const colors = {
    plain: { backgroundColor: t.card, borderColor: t.border },
    soft: { backgroundColor: t.accent, borderColor: t.accent },
    gold: { backgroundColor: t.goldSoft, borderColor: t.goldSoft },
    danger: { backgroundColor: t.dangerSoft, borderColor: t.dangerSoft },
  }[variant];
  return <View style={[styles.card, colors, style]}>{children}</View>;
}

export function GradientCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <LinearGradient
      colors={t.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderWidth: 0 }, style]}
    >
      {children}
    </LinearGradient>
  );
}

type TextProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  center?: boolean;
};

function font(t: Theme, weight: 'regular' | 'semibold' | 'bold' | 'heavy'): TextStyle {
  const family = t.fonts[weight];
  if (family) return { fontFamily: family };
  return { fontWeight: weight === 'regular' ? '400' : weight === 'semibold' ? '600' : weight === 'bold' ? '700' : '800' };
}

export function useFont() {
  const t = useTheme();
  return (weight: 'regular' | 'semibold' | 'bold' | 'heavy') => font(t, weight);
}

export function Title({ children, style, center }: TextProps) {
  const t = useTheme();
  return (
    <Text style={[styles.title, font(t, 'heavy'), { color: t.text }, center && styles.center, style]}>{children}</Text>
  );
}

export function H1({ children, style, center }: TextProps) {
  const t = useTheme();
  return <Text style={[styles.h1, font(t, 'heavy'), { color: t.text }, center && styles.center, style]}>{children}</Text>;
}

export function H2({ children, style, center, numberOfLines }: TextProps) {
  const t = useTheme();
  return (
    <Text numberOfLines={numberOfLines} style={[styles.h2, font(t, 'bold'), { color: t.text }, center && styles.center, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, numberOfLines, center }: TextProps) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.body, font(t, 'regular'), { color: t.text }, center && styles.center, style]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines, center }: TextProps) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[styles.muted, font(t, 'regular'), { color: t.muted }, center && styles.center, style]}
    >
      {children}
    </Text>
  );
}

export function Label({ children, style }: TextProps) {
  const t = useTheme();
  return <Text style={[styles.label, font(t, 'bold'), { color: t.muted }, style]}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'light';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const t = useTheme();
  const colors: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: t.primary, fg: t.onPrimary, border: t.primary },
    secondary: { bg: t.accent, fg: t.primary, border: t.accent },
    danger: { bg: t.danger, fg: t.onDanger, border: t.danger },
    ghost: { bg: 'transparent', fg: t.muted, border: t.border },
    light: { bg: 'rgba(255,255,255,0.18)', fg: '#FFFFFF', border: 'rgba(255,255,255,0.35)' },
  };
  const c = colors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: c.bg, borderColor: c.border, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={small ? 16 : 20} color={c.fg} />}
      <Text style={[styles.buttonText, small && { fontSize: 14 }, font(t, 'bold'), { color: c.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
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
      {icon && <Ionicons name={icon} size={16} color={selected ? t.primary : t.muted} />}
      <Text style={[{ color: selected ? t.primary : t.text, fontSize: 14 }, font(t, selected ? 'bold' : 'regular')]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

/** Large tappable option used in onboarding and the assessment. */
export function Option({
  label,
  description,
  selected,
  onPress,
  icon,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.option,
        {
          borderColor: selected ? t.primary : t.border,
          backgroundColor: selected ? t.accent : t.card,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon && <Ionicons name={icon} size={22} color={selected ? t.primary : t.muted} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.optionLabel, font(t, 'semibold'), { color: selected ? t.primary : t.text }]}>{label}</Text>
        {description ? <Muted>{description}</Muted> : null}
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? t.primary : t.border}
      />
    </Pressable>
  );
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
          font(t, 'regular'),
          { color: t.text, borderColor: t.border, backgroundColor: t.card },
          props.multiline && { minHeight: 96, textAlignVertical: 'top' },
          props.style,
        ]}
      />
    </View>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const t = useTheme();
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <View style={[styles.track, { backgroundColor: t.accent }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color ?? t.primary }]} />
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  iconColor,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  iconColor?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: t.accent }]}>
          <Ionicons name={icon} size={20} color={iconColor ?? t.primary} />
        </View>
      )}
      <View style={{ flex: 1, gap: 1 }}>
        <Body style={font(t, 'semibold')}>{title}</Body>
        {subtitle ? <Muted>{subtitle}</Muted> : null}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={t.muted} style={styles.chevron} />)}
    </Pressable>
  );
}

export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  icon,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: IconName;
}) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: t.accent }]}>
          <Ionicons name={icon} size={20} color={t.primary} />
        </View>
      )}
      <View style={{ flex: 1, gap: 1 }}>
        <Body style={font(t, 'semibold')}>{title}</Body>
        {subtitle ? <Muted>{subtitle}</Muted> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: t.primary, false: t.border }}
        thumbColor="#FFFFFF"
        accessibilityLabel={title}
      />
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.section, font(t, 'bold'), { color: t.muted }]}>{children}</Text>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }} />;
}

export function IconBadge({ icon, color, bg, size = 44 }: { icon: IconName; color?: string; bg?: string; size?: number }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg ?? t.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={color ?? t.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 16 },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 18, gap: 12, overflow: 'hidden' },
  center: { textAlign: 'center' },
  title: { fontSize: 30, lineHeight: 38 },
  h1: { fontSize: 24, lineHeight: 32 },
  h2: { fontSize: 18, lineHeight: 25 },
  body: { fontSize: 16, lineHeight: 23 },
  muted: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  section: { fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 4, marginBottom: -6 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  buttonSmall: { minHeight: 38, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  buttonText: { fontSize: 16, textAlign: 'center', flexShrink: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionLabel: { fontSize: 16, lineHeight: 22 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  chevron: { transform: [{ scaleX: 1 }] },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { PremiumGate } from '../components/Premium';
import { Body, Card, Chip, ChipRow, GradientCard, H2, Muted, Screen } from '../components/ui';
import { useStore } from '../lib/store';
import { ACCENT_SWATCHES, type ColorMode, previewColor, THEME_IDS, useTheme } from '../theme';

const MODES: ColorMode[] = ['system', 'light', 'dark'];

export default function AppearanceScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { data, actions } = useStore();
  const { appearance } = data;

  return (
    <Screen>
      <GradientCard style={{ gap: 6 }}>
        <Body style={{ color: '#FFFFFF' }}>{tr('appearance.preview')}</Body>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.previewPill, { backgroundColor: t.card }]} />
          <View style={[styles.previewPill, { backgroundColor: t.accent }]} />
          <View style={[styles.previewPill, { backgroundColor: t.danger }]} />
        </View>
      </GradientCard>

      <Card>
        <H2>{tr('appearance.mode')}</H2>
        <ChipRow>
          {MODES.map((m) => (
            <Chip key={m} label={tr(`appearance.modes.${m}`)} selected={appearance.mode === m} onPress={() => actions.setAppearance({ mode: m })} />
          ))}
        </ChipRow>
      </Card>

      <PremiumGate feature={tr('appearance.title')}>
        <Card>
          <H2>{tr('appearance.theme')}</H2>
          <View style={styles.grid}>
            {THEME_IDS.map((id) => {
              const selected = appearance.themeId === id && !appearance.accent;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => actions.setAppearance({ themeId: id, accent: null })}
                  style={[styles.theme, { borderColor: selected ? t.primary : t.border, backgroundColor: t.card }]}
                >
                  <View style={[styles.swatch, { backgroundColor: previewColor(id, t.dark) }]}>
                    {selected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </View>
                  <Muted numberOfLines={1}>{tr(`appearance.themes.${id}`)}</Muted>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <H2>{tr('appearance.accent')}</H2>
          <Muted>{tr('appearance.accentBody')}</Muted>
          <View style={styles.swatches}>
            {ACCENT_SWATCHES.map((c) => {
              const selected = appearance.accent === c;
              return (
                <Pressable
                  key={c}
                  accessibilityRole="radio"
                  accessibilityLabel={c}
                  accessibilityState={{ selected }}
                  onPress={() => actions.setAppearance({ accent: selected ? null : c })}
                  style={[styles.dot, { backgroundColor: c, borderColor: selected ? t.text : 'transparent' }]}
                >
                  {selected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                </Pressable>
              );
            })}
          </View>
        </Card>
      </PremiumGate>
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewPill: { height: 14, flex: 1, borderRadius: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  theme: { width: '30%', minWidth: 90, flexGrow: 1, alignItems: 'center', gap: 8, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dot: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});

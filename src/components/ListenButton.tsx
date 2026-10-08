import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { tap } from '../lib/haptics';
import { useNarrator } from '../lib/speech';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';
import { useFont } from './ui';

/** Reads `text` aloud on tap, in the user's chosen voice. Tapping again stops it. */
export function ListenButton({ text, language }: { text: string; language: string }) {
  const t = useTheme();
  const font = useFont();
  const { t: tr } = useTranslation();
  const { data } = useStore();
  const narrator = useNarrator(language, data.sound);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        if (narrator.speaking) narrator.stop();
        else narrator.say(text);
      }}
      hitSlop={8}
      style={({ pressed }) => [styles.button, { borderColor: t.primary, opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons name={narrator.speaking ? 'stop' : 'volume-high-outline'} size={16} color={t.primary} />
      <Text style={[styles.label, font('semibold'), { color: t.primary }]}>{narrator.speaking ? tr('sound.stop') : tr('sound.listen')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontSize: 14 },
});

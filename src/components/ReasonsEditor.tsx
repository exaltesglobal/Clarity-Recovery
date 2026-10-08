import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useTheme } from '../theme';
import { Body, Button, Chip, ChipRow, Field, Muted } from './ui';

const MAX_REASONS = 6;

export function ReasonsEditor({
  reasons,
  onChange,
}: {
  reasons: string[];
  onChange: (reasons: string[]) => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [draft, setDraft] = useState('');

  const add = (reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed || reasons.includes(trimmed) || reasons.length >= MAX_REASONS) return;
    onChange([...reasons, trimmed]);
    setDraft('');
  };

  const all = tr('reasonSuggestions', { returnObjects: true }) as string[];
  const suggestions = all.filter((s) => !reasons.includes(s));

  return (
    <View style={{ gap: 12 }}>
      {reasons.map((reason) => (
        <View key={reason} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="heart" size={16} color={t.danger} />
          <Body style={{ flex: 1 }}>{reason}</Body>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tr('common.remove')}
            hitSlop={10}
            onPress={() => onChange(reasons.filter((r) => r !== reason))}
          >
            <Ionicons name="close-circle" size={22} color={t.muted} />
          </Pressable>
        </View>
      ))}
      {reasons.length < MAX_REASONS && (
        <>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Field
                value={draft}
                onChangeText={setDraft}
                placeholder={tr('reasons.placeholder')}
                onSubmitEditing={() => add(draft)}
                returnKeyType="done"
              />
            </View>
            <Button title={tr('common.add')} variant="secondary" onPress={() => add(draft)} disabled={!draft.trim()} />
          </View>
          {suggestions.length > 0 && (
            <>
              <Muted>{tr('reasons.suggestions')}</Muted>
              <ChipRow>
                {suggestions.map((s) => (
                  <Chip key={s} label={s} onPress={() => add(s)} />
                ))}
              </ChipRow>
            </>
          )}
        </>
      )}
    </View>
  );
}

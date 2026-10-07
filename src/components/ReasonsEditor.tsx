import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { REASON_SUGGESTIONS } from '../content/triggers';
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
  const [draft, setDraft] = useState('');

  const add = (reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed || reasons.includes(trimmed) || reasons.length >= MAX_REASONS) return;
    onChange([...reasons, trimmed]);
    setDraft('');
  };

  const suggestions = REASON_SUGGESTIONS.filter((s) => !reasons.includes(s));

  return (
    <View style={{ gap: 12 }}>
      {reasons.map((reason) => (
        <View key={reason} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="heart" size={16} color={t.primary} />
          <Body style={{ flex: 1 }}>{reason}</Body>
          <Pressable
            accessibilityLabel={`Remove ${reason}`}
            hitSlop={10}
            onPress={() => onChange(reasons.filter((r) => r !== reason))}
          >
            <Ionicons name="close-circle" size={20} color={t.muted} />
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
                placeholder="In your own words…"
                onSubmitEditing={() => add(draft)}
                returnKeyType="done"
              />
            </View>
            <Button title="Add" variant="secondary" onPress={() => add(draft)} disabled={!draft.trim()} />
          </View>
          {suggestions.length > 0 && (
            <>
              <Muted>Or tap a suggestion:</Muted>
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

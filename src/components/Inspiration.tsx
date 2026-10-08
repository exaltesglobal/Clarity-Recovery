import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { dayOfYear } from '../lib/date';
import { Verse, verseOfTheDay } from '../content/verses';
import { useTheme } from '../theme';
import { Body, Card, Muted } from './ui';

export function affirmationOfTheDay(list: string[], date = new Date()) {
  return list[dayOfYear(date) % list.length];
}

/** Shows a Bible verse when faith content is on, otherwise a daily affirmation. */
export function Inspiration({ faith, verse }: { faith: boolean; verse?: Verse }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const v = verse ?? verseOfTheDay();
  const affirmations = tr('affirmations', { returnObjects: true }) as string[];
  return (
    <Card variant="soft">
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name={faith ? 'book-outline' : 'sparkles-outline'} size={18} color={t.primary} />
        <Muted style={{ color: t.primary }}>{faith ? tr('inspiration.verse') : tr('inspiration.thought')}</Muted>
      </View>
      <Body style={{ fontStyle: 'italic' }}>{faith ? `“${v.text}”` : affirmationOfTheDay(affirmations)}</Body>
      {faith && <Muted>— {v.ref} (KJV)</Muted>}
    </Card>
  );
}

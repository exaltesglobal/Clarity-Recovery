import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { dayOfYear } from '../lib/date';
import { Verse, verseOfTheDay, verseSpeech } from '../content/verses';
import { useTheme } from '../theme';
import { ListenButton } from './ListenButton';
import { Body, Card, Muted } from './ui';

export function affirmationOfTheDay(list: string[], date = new Date()) {
  return list[dayOfYear(date) % list.length];
}

/** Shows a Bible verse when faith content is on, otherwise a daily affirmation. */
export function Inspiration({ faith, verse }: { faith: boolean; verse?: Verse }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const v = verse ?? verseOfTheDay();
  const affirmations = tr('affirmations', { returnObjects: true }) as string[];
  const thought = affirmationOfTheDay(affirmations);
  return (
    <Card variant="soft">
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name={faith ? 'book-outline' : 'sparkles-outline'} size={18} color={t.primary} />
        <Muted style={{ color: t.primary }}>{faith ? tr('inspiration.verse') : tr('inspiration.thought')}</Muted>
      </View>
      <Body style={{ fontStyle: 'italic' }}>{faith ? `“${v.text}”` : thought}</Body>
      {faith && <Muted>— {v.ref} (KJV)</Muted>}
      {/* Verses are King James English whatever the app language, so they're read in English. */}
      <ListenButton text={faith ? verseSpeech(v) : thought} language={faith ? 'en' : i18n.language} />
    </Card>
  );
}

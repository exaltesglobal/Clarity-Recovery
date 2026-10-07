import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { affirmationOfTheDay } from '../content/affirmations';
import { Verse, verseOfTheDay } from '../content/verses';
import { useTheme } from '../theme';
import { Body, Card, Muted } from './ui';

/** Shows a Bible verse when faith content is on, otherwise a daily affirmation. */
export function Inspiration({ faith, verse }: { faith: boolean; verse?: Verse }) {
  const t = useTheme();
  const v = verse ?? verseOfTheDay();
  return (
    <Card style={{ backgroundColor: t.accent, borderColor: t.accent }}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name={faith ? 'book-outline' : 'sparkles-outline'} size={18} color={t.primary} />
        <Muted style={{ color: t.primary, fontWeight: '600' }}>
          {faith ? 'Verse for today' : 'Thought for today'}
        </Muted>
      </View>
      <Body style={{ fontStyle: 'italic' }}>{faith ? `"${v.text}"` : affirmationOfTheDay()}</Body>
      {faith && <Muted>— {v.ref} (KJV)</Muted>}
    </Card>
  );
}

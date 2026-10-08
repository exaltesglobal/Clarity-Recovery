import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Body, Card, H2, Muted, Screen } from '../components/ui';
import { useFeed } from '../content/feed';
import { openUrl } from '../lib/contact';
import { useTheme } from '../theme';

const ICONS = {
  science: 'flask-outline',
  habits: 'repeat-outline',
  body: 'fitness-outline',
  mind: 'bulb-outline',
  connection: 'people-outline',
} as const;

export default function Facts() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { facts } = useFeed();
  return (
    <Screen>
      <Muted>{tr('facts.intro')}</Muted>
      {facts.map((f) => {
        const local = f.i18n?.[i18n.language];
        return (
          <Card key={f.id}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Ionicons name={ICONS[f.category] ?? 'flask-outline'} size={18} color={t.gold} />
              <Muted style={{ color: t.gold }}>{tr(`facts.categories.${f.category}`)}</Muted>
            </View>
            <H2>{local?.title ?? f.title ?? tr(`facts.items.${f.id}.title`)}</H2>
            <Body>{local?.body ?? f.body ?? tr(`facts.items.${f.id}.body`)}</Body>
            <Pressable disabled={!f.url} onPress={() => f.url && openUrl(f.url)} accessibilityRole={f.url ? 'link' : undefined}>
              <Muted style={f.url ? { color: t.primary } : undefined}>{tr('facts.source', { source: f.source })}</Muted>
            </Pressable>
          </Card>
        );
      })}
    </Screen>
  );
}

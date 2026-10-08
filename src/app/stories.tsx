import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Body, Button, Card, H2, IconBadge, Muted, Screen } from '../components/ui';
import { countryName, flag } from '../content/countries';
import { useFeed } from '../content/feed';
import { openUrl } from '../lib/contact';
import { useTheme } from '../theme';

const STORIES_EMAIL: string | undefined = Constants.expoConfig?.extra?.storiesEmail;

/**
 * Real recovery stories, published through the content feed after the person
 * has given written consent. The app never invents testimonials.
 */
export default function Stories() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { testimonials, loading } = useFeed();

  const stories = [...testimonials].sort((a, b) => Number(b.lang === i18n.language) - Number(a.lang === i18n.language));

  return (
    <Screen>
      <Card variant="soft" style={{ alignItems: 'center' }}>
        <IconBadge icon="ribbon-outline" size={52} />
        <H2 center>{tr('stories.heading')}</H2>
        <Body center>{tr('stories.body')}</Body>
      </Card>

      {loading && <ActivityIndicator color={t.primary} />}

      {stories.map((s) => (
        <Card key={s.id}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={t.primary} />
          <Body style={{ fontStyle: 'italic' }}>“{s.quote}”</Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Muted style={{ color: t.text }}>— {s.name}</Muted>
            {s.country && <Muted>{`${flag(s.country)} ${countryName(s.country, i18n.language)}`}</Muted>}
            {s.milestone && <Muted>· {s.milestone}</Muted>}
          </View>
        </Card>
      ))}

      {!loading && stories.length === 0 && (
        <Card style={{ alignItems: 'center' }}>
          <Muted center>{tr('stories.empty')}</Muted>
        </Card>
      )}

      {STORIES_EMAIL ? (
        <Card>
          <H2>{tr('stories.shareTitle')}</H2>
          <Body>{tr('stories.shareBody')}</Body>
          <Button
            title={tr('stories.share')}
            icon="mail-outline"
            variant="secondary"
            onPress={() =>
              openUrl(
                `mailto:${STORIES_EMAIL}?subject=${encodeURIComponent(tr('stories.emailSubject'))}&body=${encodeURIComponent(tr('stories.emailBody'))}`,
              )
            }
          />
        </Card>
      ) : null}
      <Muted center>{tr('stories.consentNote')}</Muted>
    </Screen>
  );
}

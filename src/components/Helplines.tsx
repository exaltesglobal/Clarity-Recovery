import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { countryName } from '../content/countries';
import { findAHelplineUrl, GLOBAL_RESOURCES, type Helpline, regionFor } from '../content/regions';
import { callNumber } from '../lib/contact';
import { Body, Button, Card, H2, ListRow, Muted } from './ui';

function open(url: string) {
  Linking.openURL(url).catch(() => {});
}

function HelplineRow({ h }: { h: Helpline }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 6 }}>
      <ListRow
        icon={h.phone ? 'call-outline' : 'globe-outline'}
        title={h.name}
        subtitle={[h.phone, h.note].filter(Boolean).join(' · ') || undefined}
        onPress={h.phone ? () => callNumber(h.phone!) : h.url ? () => open(h.url!) : undefined}
      />
      {h.phone && h.url ? (
        <Button small variant="ghost" icon="open-outline" title={t('helplines.website')} onPress={() => open(h.url!)} />
      ) : null}
    </View>
  );
}

/** Crisis lines for the user's country, the local emergency number and a global directory. */
export function CrisisHelplines({ country, compact = false }: { country: string; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const region = regionFor(country);
  return (
    <Card variant="danger">
      <H2>{t('helplines.crisisTitle')}</H2>
      <Muted>{t('helplines.crisisBody', { country: countryName(country, i18n.language) })}</Muted>
      {region.helplines.map((h) => (
        <HelplineRow key={h.name} h={h} />
      ))}
      <ListRow
        icon="alert-circle-outline"
        title={t('helplines.emergency', { number: region.emergency })}
        onPress={() => callNumber(region.emergency)}
      />
      {!compact && (
        <ListRow
          icon="globe-outline"
          title={t('helplines.findAHelpline')}
          subtitle="findahelpline.com"
          onPress={() => open(findAHelplineUrl(country))}
        />
      )}
    </Card>
  );
}

/** Recovery communities that meet worldwide. */
export function RecoveryResources() {
  const { t } = useTranslation();
  return (
    <Card>
      <H2>{t('helplines.recoveryTitle')}</H2>
      <Body>{t('helplines.recoveryBody')}</Body>
      {GLOBAL_RESOURCES.map((r) => (
        <ListRow key={r.name} icon="people-circle-outline" title={r.name} subtitle={r.url?.replace('https://', '')} onPress={() => open(r.url!)} />
      ))}
    </Card>
  );
}

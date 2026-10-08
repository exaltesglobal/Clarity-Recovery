import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CrisisHelplines, RecoveryResources } from '../components/Helplines';
import { Body, Card, ListRow, Muted, Screen } from '../components/ui';
import { countryName, flag } from '../content/countries';
import { useStore } from '../lib/store';

export default function Helplines() {
  const { t, i18n } = useTranslation();
  const { data } = useStore();
  const country = data.profile.country;
  return (
    <Screen>
      <Card variant="soft">
        <Body>{t('helplines.intro')}</Body>
        <ListRow
          icon="flag-outline"
          title={`${flag(country)}  ${countryName(country, i18n.language)}`}
          subtitle={t('helplines.changeCountry')}
          onPress={() => router.push('/profile')}
        />
      </Card>
      <CrisisHelplines country={country} />
      <RecoveryResources />
      <Muted center>{t('helplines.verifyNote')}</Muted>
    </Screen>
  );
}

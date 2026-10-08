import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { HealthSummary } from '../components/HealthSummary';
import { PremiumGate } from '../components/Premium';
import { Body, Button, Card, H2, IconBadge, Muted, Screen } from '../components/ui';
import { health } from '../lib/health';
import { useStore } from '../lib/store';

export default function HealthScreen() {
  const { t } = useTranslation();
  const { data, actions } = useStore();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    health.isAvailable().then(setAvailable);
  }, []);

  const connect = async () => {
    setFailed(false);
    const ok = await health.connect();
    actions.setHealthConnected(ok);
    if (!ok) setFailed(true);
  };

  return (
    <Screen>
      <PremiumGate feature={t('health.title')}>
        <Card style={{ alignItems: 'center' }}>
          <IconBadge icon="watch-outline" size={56} />
          <H2 center>{t('health.heading')}</H2>
          <Body center>{t('health.body', { provider: health.providerName })}</Body>
          <Muted center>{t('health.why')}</Muted>
        </Card>

        {data.health.connected ? (
          <>
            <HealthSummary />
            <Card variant="soft">
              <Body>{t('health.connected', { provider: health.providerName })}</Body>
              <Button title={t('health.disconnect')} variant="ghost" onPress={() => actions.setHealthConnected(false)} />
            </Card>
          </>
        ) : available === false ? (
          <Card variant="gold">
            <Body>
              {Platform.OS === 'android'
                ? t('health.installHealthConnect')
                : Platform.OS === 'ios'
                  ? t('health.unavailableIos')
                  : t('health.unavailableWeb')}
            </Body>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            <Button title={t('health.connect', { provider: health.providerName })} icon="link-outline" onPress={connect} disabled={available === null} />
            {failed && <Muted center>{t('health.failed')}</Muted>}
          </View>
        )}

        <Muted center>{t('health.privacy')}</Muted>
      </PremiumGate>
    </Screen>
  );
}

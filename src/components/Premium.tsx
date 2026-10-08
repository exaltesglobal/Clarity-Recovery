import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useBilling } from '../lib/billing';
import { Body, Button, Card, H2, IconBadge } from './ui';

/** Shows children for subscribers (or trial users); otherwise an upgrade card. */
export function PremiumGate({ children, feature }: { children: ReactNode; feature: string }) {
  const { premium } = useBilling();
  const { t } = useTranslation();
  if (premium) return <>{children}</>;
  return (
    <Card variant="gold" style={{ alignItems: 'center' }}>
      <IconBadge icon="sparkles-outline" />
      <H2 center>{t('paywall.lockedTitle', { feature })}</H2>
      <Body center>{t('paywall.lockedBody')}</Body>
      <Button title={t('paywall.startTrial')} icon="gift-outline" onPress={() => router.push('/paywall')} style={{ alignSelf: 'stretch' }} />
    </Card>
  );
}

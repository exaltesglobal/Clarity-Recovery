import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Purchases, { type PurchasesError } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '../components/Logo';
import { Body, Button, Card, H1, Muted } from '../components/ui';
import { ENTITLEMENT_ID, useBilling } from '../lib/billing';
import { useTheme } from '../theme';

const FEATURES = ['sessions', 'protection', 'instagram', 'health', 'themes', 'insights'] as const;

export default function Paywall() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const billing = useBilling();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const header = (
    <View style={styles.close}>
      <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={tr('common.close')} hitSlop={12}>
        <Ionicons name="close" size={26} color={t.muted} />
      </Pressable>
    </View>
  );

  // The RevenueCat Paywall (designed in the dashboard) handles plan choice, purchase and restore.
  if (billing.available && billing.ready && !billing.premium && billing.hasOffering) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
        {header}
        <RevenueCatUI.Paywall
          style={{ flex: 1 }}
          onPurchaseCompleted={({ customerInfo }) => {
            billing.update(customerInfo);
            close();
          }}
          onRestoreCompleted={({ customerInfo }) => {
            billing.update(customerInfo);
            if (customerInfo.entitlements.active[ENTITLEMENT_ID]) close();
            else Alert.alert(tr('paywall.nothingToRestore'));
          }}
          onPurchaseError={({ error }: { error: PurchasesError }) => {
            if (error.code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) Alert.alert(tr('paywall.pending'));
          }}
          onDismiss={close}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {header}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Logo size={72} />
          <H1 center>{billing.premium && billing.available ? tr('paywall.activeTitle') : tr('paywall.title')}</H1>
          <Body center style={{ color: t.muted }}>
            {tr('paywall.subtitle')}
          </Body>
        </View>

        <Card>
          {FEATURES.map((f) => (
            <View key={f} style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color={t.primary} />
              <Body style={{ flex: 1 }}>{tr(`paywall.features.${f}`)}</Body>
            </View>
          ))}
          <View style={styles.feature}>
            <Ionicons name="heart-circle" size={20} color={t.danger} />
            <Muted style={{ flex: 1 }}>{tr('paywall.alwaysFree')}</Muted>
          </View>
        </Card>

        {!billing.available ? (
          <Card variant="gold">
            <Body>{Platform.OS === 'web' ? tr('paywall.webNote') : tr('paywall.notConfigured')}</Body>
          </Card>
        ) : !billing.ready ? (
          <ActivityIndicator color={t.primary} />
        ) : billing.premium ? (
          <Card variant="soft">
            <Body>
              {billing.inTrial ? tr('paywall.inTrial', { date: billing.expiresAt?.slice(0, 10) ?? '' }) : tr('paywall.subscribed')}
            </Body>
            <Button title={tr('paywall.manage')} variant="secondary" onPress={billing.manage} />
          </Card>
        ) : (
          <Card variant="gold">
            <Body>{tr('paywall.noPlans')}</Body>
          </Card>
        )}

        {onboarding && !billing.premium && <Button variant="ghost" title={tr('paywall.notNow')} onPress={close} />}
        <Muted center>{tr('paywall.localPricing')}</Muted>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  close: { alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  feature: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});

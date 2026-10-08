import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '../components/Logo';
import { Body, Button, Card, H1, Muted, useFont } from '../components/ui';
import { type Plan, useBilling } from '../lib/billing';
import { openUrl } from '../lib/contact';
import { useTheme } from '../theme';

const FEATURES = ['sessions', 'protection', 'instagram', 'health', 'themes', 'insights'] as const;
const PLAN_KEYS: Record<string, string> = { MONTHLY: 'monthly', SIX_MONTH: 'sixMonth', ANNUAL: 'annual' };

function trialLabel(plan: Plan, tr: TFunction) {
  if (!plan.trialPeriod) return null;
  const unit = plan.trialPeriod.unit.toLowerCase();
  return tr(`paywall.trial.${unit}`, { count: plan.trialPeriod.count });
}

export default function Paywall() {
  const t = useTheme();
  const font = useFont();
  const { t: tr } = useTranslation();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const billing = useBilling();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Default to the yearly plan until the user picks one.
  const selectedType = selected ?? (billing.plans.find((p) => p.type === 'ANNUAL') ?? billing.plans[0])?.type ?? null;
  const plan = billing.plans.find((p) => p.type === selectedType) ?? null;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const subscribe = async () => {
    if (!plan) return;
    setBusy(true);
    setMessage(null);
    const result = await billing.purchase(plan);
    setBusy(false);
    if (result === 'purchased') close();
    else if (result === 'error') setMessage(tr('paywall.error'));
  };

  const restore = async () => {
    setBusy(true);
    const ok = await billing.restore();
    setBusy(false);
    setMessage(ok ? tr('paywall.restored') : tr('paywall.nothingToRestore'));
    if (ok) setTimeout(close, 800);
  };

  const manageUrl =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={styles.close}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={tr('common.close')} hitSlop={12}>
          <Ionicons name="close" size={26} color={t.muted} />
        </Pressable>
      </View>
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
            <Button title={tr('paywall.manage')} variant="secondary" onPress={() => openUrl(manageUrl)} />
          </Card>
        ) : billing.plans.length === 0 ? (
          <Card variant="gold">
            <Body>{tr('paywall.noPlans')}</Body>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {billing.plans.map((p) => {
              const active = p.type === selectedType;
              const trial = trialLabel(p, tr);
              return (
                <Pressable
                  key={p.type}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelected(p.type)}
                  style={[styles.plan, { borderColor: active ? t.primary : t.border, backgroundColor: active ? t.accent : t.card }]}
                >
                  <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={22} color={active ? t.primary : t.border} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[{ color: t.text, fontSize: 17 }, font('bold')]}>{tr(`paywall.plans.${PLAN_KEYS[p.type]}`)}</Text>
                    {trial && <Muted style={{ color: t.primary }}>{trial}</Muted>}
                    {p.type !== 'MONTHLY' && p.pricePerMonth && (
                      <Muted>{tr('paywall.perMonth', { price: p.pricePerMonth })}</Muted>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={[{ color: t.text, fontSize: 17 }, font('heavy')]}>{p.price}</Text>
                    {p.type === 'ANNUAL' && (
                      <View style={[styles.badge, { backgroundColor: t.gold }]}>
                        <Text style={[styles.badgeText, font('bold')]}>{tr('paywall.bestValue')}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
            <Button
              title={plan && plan.trialPeriod ? tr('paywall.startTrial') : tr('paywall.subscribe')}
              icon="gift-outline"
              onPress={subscribe}
              disabled={!plan || busy}
            />
            {plan && (
              <Muted center>
                {plan.trialPeriod
                  ? tr('paywall.trialTerms', { trial: trialLabel(plan, tr), price: plan.price, period: tr(`paywall.periods.${PLAN_KEYS[plan.type]}`) })
                  : tr('paywall.terms', { price: plan.price, period: tr(`paywall.periods.${PLAN_KEYS[plan.type]}`) })}
              </Muted>
            )}
          </View>
        )}

        {busy && <ActivityIndicator color={t.primary} />}
        {message && <Muted center>{message}</Muted>}

        {billing.available && (
          <View style={styles.links}>
            <Button small variant="ghost" title={tr('paywall.restore')} onPress={restore} />
            <Button small variant="ghost" title={tr('paywall.manage')} onPress={() => openUrl(manageUrl)} />
          </View>
        )}
        {onboarding && !billing.premium && <Button variant="ghost" title={tr('paywall.notNow')} onPress={close} />}
        <Muted center>{tr('paywall.localPricing')}</Muted>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  close: { alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  feature: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1.5 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 11 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
});

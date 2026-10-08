import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AppState, Platform, View } from 'react-native';

import { PremiumGate } from '../components/Premium';
import { Body, Button, Card, Chip, ChipRow, H2, IconBadge, ListRow, Muted, Screen, SectionTitle } from '../components/ui';
import { openUrl } from '../lib/contact';
import { appName, guard, guardAvailable, IOS_DNS_PROFILE_URL, PRIVATE_DNS_HOST, SOCIAL_APPS } from '../lib/guard';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

function confirm(title: string, body: string, ok: string, cancel: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(!!globalThis.confirm?.(`${title}\n\n${body}`));
  return new Promise((resolve) =>
    Alert.alert(title, body, [
      { text: cancel, style: 'cancel', onPress: () => resolve(false) },
      { text: ok, onPress: () => resolve(true) },
    ]),
  );
}

function Steps({ steps }: { steps: string[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {steps.map((s, i) => (
        <View key={s} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Muted style={{ color: t.primary, fontSize: 12 }}>{i + 1}</Muted>
          </View>
          <Body style={{ flex: 1 }}>{s}</Body>
        </View>
      ))}
    </View>
  );
}

export default function Protection() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { data, actions } = useStore();
  const [dnsActive, setDnsActive] = useState(false);
  const [pauseServiceOn, setPauseServiceOn] = useState(false);
  const [installed, setInstalled] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    if (!guardAvailable || !guard) return;
    const active = guard.isDnsFilterActive();
    setDnsActive(active);
    const serviceOn = guard.isPauseServiceEnabled();
    setPauseServiceOn(serviceOn);
    setInstalled(guard.installedApps(SOCIAL_APPS.map((a) => a.id)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
      return () => sub.remove();
    }, [refresh]),
  );

  const turnOnDns = async () => {
    if (!guard) return;
    const ok = await confirm(tr('protection.dnsDisclosureTitle'), tr('protection.dnsDisclosure'), tr('common.continue'), tr('common.cancel'));
    if (!ok) return;
    const started = await guard.startDnsFilter();
    actions.setProtection({ dnsFilter: started });
    setTimeout(refresh, 800);
  };

  const turnOffDns = () => {
    guard?.stopDnsFilter();
    actions.setProtection({ dnsFilter: false });
    setTimeout(refresh, 500);
  };

  const setPause = (enabled: boolean, apps = data.protection.pauseApps) => {
    actions.setProtection({ mindfulPause: enabled, pauseApps: apps });
    guard?.setPauseConfig(enabled, apps);
  };

  const enablePause = async () => {
    if (!guard) return;
    if (!pauseServiceOn) {
      const ok = await confirm(
        tr('protection.pauseDisclosureTitle'),
        tr('protection.pauseDisclosure'),
        tr('protection.openSettings'),
        tr('common.cancel'),
      );
      if (!ok) return;
      setPause(true);
      guard.openAccessibilitySettings();
      return;
    }
    setPause(true);
  };

  const toggleApp = (id: string) => {
    const apps = data.protection.pauseApps.includes(id)
      ? data.protection.pauseApps.filter((a) => a !== id)
      : [...data.protection.pauseApps, id];
    setPause(data.protection.mindfulPause, apps);
  };

  const copyHost = async () => {
    await Clipboard.setStringAsync(PRIVATE_DNS_HOST);
    setCopied(true);
  };

  const pauseOn = data.protection.mindfulPause && pauseServiceOn;

  return (
    <Screen>
      <Card variant="soft">
        <Body>{tr('protection.intro')}</Body>
      </Card>

      <SectionTitle>{tr('protection.dnsSection')}</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <IconBadge
            icon={dnsActive ? 'shield-checkmark' : 'shield-outline'}
            color={dnsActive ? t.primary : t.danger}
            bg={dnsActive ? t.accent : t.dangerSoft}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <H2>{tr('protection.dnsTitle')}</H2>
            <Muted>{guardAvailable ? (dnsActive ? tr('protection.dnsOn') : tr('protection.dnsOff')) : tr('protection.dnsWhat')}</Muted>
          </View>
        </View>

        {guardAvailable ? (
          dnsActive ? (
            <>
              <Body>{tr('protection.dnsOnBody')}</Body>
              <ListRow icon="infinite-outline" title={tr('protection.alwaysOn')} subtitle={tr('protection.alwaysOnBody')} onPress={() => guard?.openVpnSettings()} />
              <Button title={tr('protection.turnOff')} variant="ghost" onPress={turnOffDns} />
            </>
          ) : (
            <>
              <Body>{tr('protection.dnsExplain')}</Body>
              <Button title={tr('protection.turnOnDns')} icon="shield-checkmark-outline" onPress={turnOnDns} />
            </>
          )
        ) : Platform.OS === 'android' ? (
          <>
            <Body>{tr('protection.androidManualIntro')}</Body>
            <Steps steps={tr('protection.androidManualSteps', { returnObjects: true, host: PRIVATE_DNS_HOST }) as string[]} />
            <Button title={copied ? tr('protection.copied') : tr('protection.copyHost')} icon="copy-outline" variant="secondary" onPress={copyHost} />
            <Button
              title={tr('protection.openSettings')}
              icon="settings-outline"
              onPress={() => IntentLauncher.startActivityAsync('android.settings.WIRELESS_SETTINGS').catch(() => {})}
            />
          </>
        ) : Platform.OS === 'ios' ? (
          <>
            <Body>{tr('protection.iosIntro')}</Body>
            <Steps steps={tr('protection.iosSteps', { returnObjects: true }) as string[]} />
            <Button title={tr('protection.iosInstall')} icon="download-outline" onPress={() => openUrl(IOS_DNS_PROFILE_URL)} />
          </>
        ) : (
          <Body>{tr('protection.webNote')}</Body>
        )}
        <Muted>{tr('protection.dnsProvider')}</Muted>
      </Card>

      <SectionTitle>{tr('protection.pauseSection')}</SectionTitle>
      <PremiumGate feature={tr('protection.pauseTitle')}>
        <Card>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <IconBadge icon={pauseOn ? 'pause-circle' : 'pause-circle-outline'} color={pauseOn ? t.primary : t.muted} />
            <View style={{ flex: 1, gap: 2 }}>
              <H2>{tr('protection.pauseTitle')}</H2>
              <Muted>{tr('protection.pauseWhat')}</Muted>
            </View>
          </View>
          {guardAvailable ? (
            <>
              {data.protection.mindfulPause && !pauseServiceOn && (
                <Card variant="gold">
                  <Body>{tr('protection.pauseNeedsService')}</Body>
                  <Steps steps={tr('protection.pauseSteps', { returnObjects: true }) as string[]} />
                  <Button small title={tr('protection.openSettings')} onPress={() => guard?.openAccessibilitySettings()} />
                </Card>
              )}
              <Muted>{tr('protection.pauseApps')}</Muted>
              <ChipRow>
                {SOCIAL_APPS.filter((a) => installed.includes(a.id) || data.protection.pauseApps.includes(a.id)).map((a) => (
                  <Chip
                    key={a.id}
                    label={appName(a.id)}
                    icon={data.protection.pauseApps.includes(a.id) ? 'checkmark' : undefined}
                    selected={data.protection.pauseApps.includes(a.id)}
                    onPress={() => toggleApp(a.id)}
                  />
                ))}
              </ChipRow>
              {pauseOn ? (
                <Button title={tr('protection.turnOff')} variant="ghost" onPress={() => setPause(false)} />
              ) : (
                <Button title={tr('protection.turnOnPause')} icon="pause-circle-outline" onPress={enablePause} />
              )}
            </>
          ) : Platform.OS === 'ios' ? (
            <>
              <Body>{tr('protection.iosScreenTime')}</Body>
              <Steps steps={tr('protection.iosScreenTimeSteps', { returnObjects: true }) as string[]} />
            </>
          ) : (
            <Body>{tr('protection.pauseNeedsBuild')}</Body>
          )}
        </Card>
      </PremiumGate>

      <SectionTitle>{tr('protection.moreSection')}</SectionTitle>
      <Card>
        <ListRow icon="logo-instagram" title={tr('instagram.title')} subtitle={tr('instagram.teaser')} onPress={() => router.push('/instagram')} />
        <ListRow icon="people-outline" title={tr('protection.partnerTitle')} subtitle={tr('protection.partnerBody')} onPress={() => router.push('/support')} />
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <Ionicons name="lock-closed-outline" size={16} color={t.muted} style={{ marginTop: 2 }} />
        <Muted style={{ flex: 1 }}>{tr('protection.privacy')}</Muted>
      </View>
    </Screen>
  );
}

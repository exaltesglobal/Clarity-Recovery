import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BreathingCircle } from '../components/BreathingCircle';
import { Body, Button, Card, H1, Muted } from '../components/ui';
import { appName, guard } from '../lib/guard';
import { success } from '../lib/haptics';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

/** Shown by the Android accessibility service when a chosen app is opened. */
export default function MindfulPause() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { app } = useLocalSearchParams<{ app?: string }>();
  const { data } = useStore();
  const [waited, setWaited] = useState(false);
  const name = app ? appName(app) : '';

  const leave = () => {
    success();
    router.replace('/');
  };

  const proceed = () => {
    if (app && guard) {
      guard.allowApp(app, 10);
      guard.openApp(app);
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Ionicons name="pause-circle" size={44} color={t.primary} />
          <H1 center>{tr('pause.title')}</H1>
          <Body center style={{ color: t.muted }}>
            {tr('pause.body', { app: name })}
          </Body>
        </View>

        <BreathingCircle size={170} />
        <Muted center>{tr('pause.breathe')}</Muted>

        {data.profile.reasons.length > 0 && (
          <Card variant="soft">
            <Muted style={{ color: t.primary }}>{tr('sos.rememberWhy')}</Muted>
            {data.profile.reasons.map((r) => (
              <View key={r} style={{ flexDirection: 'row', gap: 10 }}>
                <Ionicons name="heart" size={16} color={t.danger} style={{ marginTop: 3 }} />
                <Body style={{ flex: 1 }}>{r}</Body>
              </View>
            ))}
          </Card>
        )}

        <Button title={tr('pause.leave', { app: name })} icon="home-outline" onPress={leave} />
        <Button title={tr('panic.button')} icon="shield-half" variant="danger" onPress={() => router.replace('/sos')} />
        {waited ? (
          <Button title={tr('pause.continue', { app: name })} variant="ghost" onPress={proceed} />
        ) : (
          <Button title={tr('pause.notNow')} variant="ghost" onPress={() => setWaited(true)} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 18, paddingTop: 32 },
});

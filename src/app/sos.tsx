import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { BreathingCircle } from '../components/BreathingCircle';
import { affirmationOfTheDay } from '../components/Inspiration';
import { Body, Button, Card, H1, H2, ListRow, Muted, ProgressBar, Screen, useFont } from '../components/ui';
import { regionFor } from '../content/regions';
import { VERSES } from '../content/verses';
import { callNumber, textPartner } from '../lib/contact';
import { formatClock, useNow } from '../lib/date';
import { success } from '../lib/haptics';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const RIDE_OUT_SECONDS = 10 * 60;

/** Verses chosen for the moment of temptation (KJV, public domain). */
const SOS_VERSE_REFS = ['1 Corinthians 10:13', 'James 4:7', 'Psalm 51:10', 'Galatians 5:16', 'Philippians 4:13'];

export default function Sos() {
  const t = useTheme();
  const font = useFont();
  const { t: tr } = useTranslation();
  const { data, actions } = useStore();
  const [startedAt] = useState(() => Date.now());
  const now = useNow(1000);
  const [partnerTexted, setPartnerTexted] = useState(false);
  const autoTexted = useRef(false);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = RIDE_OUT_SECONDS - elapsed;
  const partner = data.partner;
  const region = regionFor(data.profile.country);
  const quickMoves = tr('sos.quickMoves', { returnObjects: true }) as string[];

  const sendPartnerAlert = () => {
    if (!partner) return;
    setPartnerTexted(true);
    textPartner(partner.phone, tr('panic.partnerMessage', { name: data.profile.name || tr('panic.someone') }));
  };

  // Open the pre-filled SMS to the accountability partner as soon as SOS opens.
  useEffect(() => {
    if (partner?.alertOnPanic && !autoTexted.current) {
      autoTexted.current = true;
      const timer = setTimeout(sendPartnerAlert, 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const urgePassed = () => {
    actions.logUrgeResisted();
    success();
    router.back();
  };

  const verses = VERSES.filter((v) => SOS_VERSE_REFS.includes(v.ref));

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <H1>{tr('sos.heading')}</H1>
        <Body>{tr('sos.body')}</Body>
      </View>

      <Card style={{ alignItems: 'center', gap: 16 }}>
        <BreathingCircle size={190} />
        <View style={{ alignSelf: 'stretch', gap: 6 }}>
          <ProgressBar value={elapsed / RIDE_OUT_SECONDS} />
          <Text style={[styles.timer, font('bold'), { color: t.text }]}>
            {remaining > 0 ? tr('sos.rideOut', { time: formatClock(remaining) }) : tr('sos.madeIt')}
          </Text>
        </View>
      </Card>

      {partner && (
        <Card variant={partnerTexted ? 'soft' : 'plain'}>
          <ListRow
            icon={partnerTexted ? 'checkmark-done-outline' : 'chatbubble-ellipses-outline'}
            title={partnerTexted ? tr('sos.partnerOpened', { name: partner.name }) : tr('sos.textPartner', { name: partner.name })}
            subtitle={partnerTexted ? tr('sos.partnerOpenedBody') : tr('sos.textPartnerBody')}
            onPress={sendPartnerAlert}
          />
          <ListRow icon="call-outline" title={tr('sos.callPartner', { name: partner.name })} onPress={() => callNumber(partner.phone)} />
        </Card>
      )}

      {data.profile.reasons.length > 0 && (
        <Card>
          <H2>{tr('sos.rememberWhy')}</H2>
          {data.profile.reasons.map((r) => (
            <View key={r} style={styles.row}>
              <Ionicons name="heart" size={16} color={t.danger} style={{ marginTop: 3 }} />
              <Body style={{ flex: 1 }}>{r}</Body>
            </View>
          ))}
        </Card>
      )}

      {data.profile.faith ? (
        <Card variant="soft">
          <View style={styles.row}>
            <Ionicons name="book-outline" size={18} color={t.primary} />
            <H2 style={{ flex: 1 }}>{tr('sos.scriptureTitle')}</H2>
          </View>
          {verses.map((v) => (
            <View key={v.ref} style={{ gap: 2 }}>
              <Body style={{ fontStyle: 'italic' }}>“{v.text}”</Body>
              <Muted>— {v.ref} (KJV)</Muted>
            </View>
          ))}
          <View style={[styles.prayer, { borderColor: t.primary }]}>
            <Muted style={{ color: t.primary }}>{tr('sos.prayerTitle')}</Muted>
            <Body>{tr('sos.prayer')}</Body>
          </View>
          <Button
            small
            variant="secondary"
            icon="leaf-outline"
            title={tr('sos.breathPrayer')}
            onPress={() => router.push('/session/breath-prayer')}
          />
        </Card>
      ) : (
        <Card variant="soft">
          <View style={styles.row}>
            <Ionicons name="sparkles-outline" size={18} color={t.primary} />
            <Muted style={{ color: t.primary }}>{tr('inspiration.thought')}</Muted>
          </View>
          <Body style={{ fontStyle: 'italic' }}>
            {affirmationOfTheDay(tr('affirmations', { returnObjects: true }) as string[])}
          </Body>
        </Card>
      )}

      <Card>
        <H2>{tr('sos.doNow')}</H2>
        <ListRow
          icon="flash-outline"
          title={tr('sessions.urge-burner.title')}
          subtitle={tr('sos.burnerBody')}
          onPress={() => router.push('/session/urge-burner')}
        />
        <ListRow
          icon="water-outline"
          title={tr('sessions.urge-surfing.title')}
          subtitle={tr('sos.surfingBody')}
          onPress={() => router.push('/session/urge-surfing')}
        />
        {quickMoves.map((m) => (
          <View key={m} style={styles.row}>
            <Ionicons name="checkmark" size={18} color={t.primary} style={{ marginTop: 2 }} />
            <Muted style={{ flex: 1 }}>{m}</Muted>
          </View>
        ))}
      </Card>

      <Button title={tr('sos.urgePassed')} icon="trophy-outline" onPress={urgePassed} />
      <Button title={tr('sos.slipped')} variant="ghost" onPress={() => router.replace('/relapse')} />

      <Card variant="danger">
        <Muted>{tr('sos.crisisNote')}</Muted>
        {region.helplines[0]?.phone && (
          <ListRow
            icon="call-outline"
            title={region.helplines[0].name}
            subtitle={region.helplines[0].phone}
            onPress={() => callNumber(region.helplines[0].phone!)}
          />
        )}
        <ListRow icon="list-outline" title={tr('helplines.allHelplines')} onPress={() => router.push('/helplines')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { textAlign: 'center', fontSize: 16, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  prayer: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
});

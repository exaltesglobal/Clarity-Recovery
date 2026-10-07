import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BreathingCircle } from '../components/BreathingCircle';
import { Inspiration } from '../components/Inspiration';
import { Body, Button, Card, H2, ListRow, Muted, ProgressBar, Screen } from '../components/ui';
import { VERSES } from '../content/verses';
import { textPartner } from '../lib/contact';
import { formatClock, useNow } from '../lib/date';
import { success } from '../lib/haptics';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const RIDE_OUT_SECONDS = 10 * 60;

const QUICK_MOVES = [
  'Leave the room you are in — go where other people are',
  'Put your phone in another room or hand it to someone',
  'Splash cold water on your face or take a cold shower',
  'Do 20 push-ups or squats right now',
  'Drink a full glass of water slowly',
];

export default function Sos() {
  const t = useTheme();
  const { data, actions } = useStore();
  const [startedAt] = useState(() => Date.now());
  const [verse] = useState(() => VERSES[Math.floor(Math.random() * VERSES.length)]);
  const now = useNow(1000);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = RIDE_OUT_SECONDS - elapsed;

  const urgePassed = () => {
    actions.logUrgeResisted();
    success();
    router.back();
  };

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <H2>You can get through this.</H2>
        <Body>
          Urges peak and fade, usually within 10–20 minutes. You don’t have to fight it — just don’t feed it.
          Breathe with the circle.
        </Body>
      </View>

      <Card style={{ alignItems: 'center', gap: 16 }}>
        <BreathingCircle size={190} />
        <View style={{ alignSelf: 'stretch', gap: 6 }}>
          <ProgressBar value={elapsed / RIDE_OUT_SECONDS} />
          <Text style={[styles.timer, { color: t.text }]}>
            {remaining > 0 ? `${formatClock(remaining)} to ride it out` : 'You made it through 10 minutes!'}
          </Text>
        </View>
      </Card>

      {data.profile.reasons.length > 0 && (
        <Card>
          <H2>Remember why</H2>
          {data.profile.reasons.map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Ionicons name="heart" size={16} color={t.danger} style={{ marginTop: 3 }} />
              <Body style={{ flex: 1 }}>{r}</Body>
            </View>
          ))}
        </Card>
      )}

      <Inspiration faith={data.profile.faith} verse={verse} />

      <Card>
        <H2>Do one of these now</H2>
        {data.partner && (
          <ListRow
            icon="chatbubble-ellipses-outline"
            title={`Text ${data.partner.name}`}
            subtitle="Send a pre-written message asking for support"
            onPress={() =>
              textPartner(
                data.partner!.phone,
                "Hey, I'm struggling with an urge right now. Can you check in on me?",
              )
            }
          />
        )}
        <ListRow
          icon="flash-outline"
          title="6-minute urge burner"
          subtitle="Burn off the energy with a quick workout"
          onPress={() => router.push('/session/urge-burner')}
        />
        <ListRow
          icon="water-outline"
          title="Urge surfing"
          subtitle="Guided: observe the craving until it fades"
          onPress={() => router.push('/session/urge-surfing')}
        />
        {QUICK_MOVES.map((m) => (
          <View key={m} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="checkmark" size={18} color={t.primary} style={{ marginTop: 2 }} />
            <Muted style={{ flex: 1 }}>{m}</Muted>
          </View>
        ))}
      </Card>

      <Button title="The urge passed — I won" icon="trophy-outline" onPress={urgePassed} />
      <Button title="I slipped" variant="ghost" onPress={() => router.replace('/relapse')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { textAlign: 'center', fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
});

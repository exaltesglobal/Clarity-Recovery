import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReasonsEditor } from '../components/ReasonsEditor';
import { Body, Button, Card, Chip, ChipRow, Field, H1, H2, Muted, Screen } from '../components/ui';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const GOALS = [30, 90, 365];

export default function Onboarding() {
  const t = useTheme();
  const { actions } = useStore();
  const [name, setName] = useState('');
  const [daysClean, setDaysClean] = useState('0');
  const [reasons, setReasons] = useState<string[]>([]);
  const [faith, setFaith] = useState(false);
  const [goalDays, setGoalDays] = useState(90);

  const start = () => {
    actions.completeOnboarding(
      { name: name.trim(), reasons, faith, goalDays },
      Number.parseInt(daysClean, 10) || 0,
    );
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Screen>
        <View style={{ gap: 8, marginTop: 12 }}>
          <H1>Welcome to Clarity Recovery</H1>
          <Body>
            A private companion for quitting porn and building a life you’re proud of. Everything you enter
            stays on this device.
          </Body>
        </View>

        <Card>
          <H2>What should we call you?</H2>
          <Field value={name} onChangeText={setName} placeholder="First name or nickname (optional)" />
        </Card>

        <Card>
          <H2>How many days clean are you already?</H2>
          <Muted>Starting fresh today? Leave it at 0.</Muted>
          <Field
            value={daysClean}
            onChangeText={(v) => setDaysClean(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
          />
        </Card>

        <Card>
          <H2>Your first goal</H2>
          <ChipRow>
            {GOALS.map((g) => (
              <Chip key={g} label={`${g} days`} selected={goalDays === g} onPress={() => setGoalDays(g)} />
            ))}
          </ChipRow>
        </Card>

        <Card>
          <H2>Why do you want to quit?</H2>
          <Muted>We’ll show you these when an urge hits.</Muted>
          <ReasonsEditor reasons={reasons} onChange={setReasons} />
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <H2>Include Bible verses & prayer</H2>
              <Muted>Optional faith-based encouragement. You can change this any time.</Muted>
            </View>
            <Switch value={faith} onValueChange={setFaith} trackColor={{ true: t.primary }} />
          </View>
        </Card>

        <Button title="Start my journey" icon="arrow-forward" onPress={start} />
      </Screen>
    </SafeAreaView>
  );
}

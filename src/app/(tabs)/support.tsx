import { useState } from 'react';
import { Share, View } from 'react-native';

import { Body, Button, Card, Field, H2, ListRow, Muted, Screen } from '../../components/ui';
import { callNumber, textPartner } from '../../lib/contact';
import { DAY, formatDays } from '../../lib/date';
import { bestStreakMs, currentStreakMs, useStore } from '../../lib/store';
import type { AppData } from '../../lib/types';

function weeklyReport(data: AppData) {
  const weekAgo = Date.now() - 7 * DAY;
  const inWeek = (iso: string) => new Date(iso).getTime() >= weekAgo;
  const checkins = data.checkins.filter((c) => inWeek(c.date));
  const slips = data.relapses.filter((r) => inWeek(r.date)).length;
  const urges = data.urges.filter((u) => inWeek(u.date)).length;
  const avgUrge = checkins.length
    ? (checkins.reduce((s, c) => s + c.urge, 0) / checkins.length).toFixed(1)
    : 'n/a';

  return [
    'My weekly recovery update:',
    `• Current streak: ${formatDays(currentStreakMs(data))}`,
    `• Best streak: ${formatDays(bestStreakMs(data))}`,
    `• Urges resisted this week: ${urges}`,
    `• Slips this week: ${slips}`,
    `• Check-ins this week: ${checkins.length} (avg urge ${avgUrge}/10)`,
    '',
    'Thanks for keeping me accountable.',
  ].join('\n');
}

export default function Support() {
  const { data, actions } = useStore();
  const [editing, setEditing] = useState(!data.partner);
  const [name, setName] = useState(data.partner?.name ?? '');
  const [phone, setPhone] = useState(data.partner?.phone ?? '');

  const savePartner = () => {
    actions.setPartner({ name: name.trim(), phone: phone.trim() });
    setEditing(false);
  };

  const removePartner = () => {
    actions.setPartner(null);
    setName('');
    setPhone('');
    setEditing(true);
  };

  return (
    <Screen>
      <Card>
        <H2>Accountability partner</H2>
        <Muted>
          Recovery is easier with someone in your corner — a trusted friend, mentor, pastor, or counsellor.
          Nothing is shared unless you choose to send it.
        </Muted>

        {editing ? (
          <View style={{ gap: 12 }}>
            <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Sam" />
            <Field
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 555 123 4567"
              keyboardType="phone-pad"
            />
            <Button title="Save partner" onPress={savePartner} disabled={!name.trim() || !phone.trim()} />
            {data.partner && <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} />}
          </View>
        ) : (
          data.partner && (
            <View style={{ gap: 4 }}>
              <ListRow
                icon="person-circle-outline"
                title={data.partner.name}
                subtitle={data.partner.phone}
                right={<Button title="Edit" variant="ghost" onPress={() => setEditing(true)} />}
              />
              <ListRow
                icon="chatbubble-ellipses-outline"
                title="I'm struggling"
                subtitle="Text a request for support"
                onPress={() =>
                  textPartner(data.partner!.phone, "Hey, I'm having a hard time right now. Could you check in on me?")
                }
              />
              <ListRow
                icon="call-outline"
                title={`Call ${data.partner.name}`}
                onPress={() => callNumber(data.partner!.phone)}
              />
              <ListRow
                icon="stats-chart-outline"
                title="Send weekly update"
                subtitle="Text your progress for the last 7 days"
                onPress={() => textPartner(data.partner!.phone, weeklyReport(data))}
              />
              <Button title="Remove partner" variant="ghost" onPress={removePartner} />
            </View>
          )
        )}
      </Card>

      <Card>
        <H2>Share your progress</H2>
        <Muted>Send your weekly summary through any app — email, WhatsApp, Signal, etc.</Muted>
        <Button
          title="Share weekly update"
          icon="share-outline"
          variant="secondary"
          onPress={() => Share.share({ message: weeklyReport(data) }).catch(() => {})}
        />
      </Card>

      <Card>
        <H2>More help</H2>
        <Body>
          Compulsive porn use is common and treatable. A therapist experienced in compulsive sexual behaviour,
          a support group, or your faith community can make a real difference.
        </Body>
        <Muted>
          If you’re in crisis or thinking about harming yourself, contact your local emergency number now. In
          the US you can call or text 988 (Suicide & Crisis Lifeline), any time.
        </Muted>
        <Button title="Call 988 (US)" icon="call-outline" variant="ghost" onPress={() => callNumber('988')} />
      </Card>
    </Screen>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, View } from 'react-native';

import { CrisisHelplines } from '../../components/Helplines';
import { Body, Button, Card, Field, H2, ListRow, Muted, Screen, SectionTitle, SwitchRow } from '../../components/ui';
import { callNumber, textPartner } from '../../lib/contact';
import { DAY, daysIn } from '../../lib/date';
import { bestStreakMs, currentStreakMs, useStore } from '../../lib/store';
import type { AppData } from '../../lib/types';
import type { TFunction } from 'i18next';

function weeklyReport(data: AppData, t: TFunction) {
  const weekAgo = Date.now() - 7 * DAY;
  const inWeek = (iso: string) => new Date(iso).getTime() >= weekAgo;
  const checkins = data.checkins.filter((c) => inWeek(c.date));
  const avgUrge = checkins.length ? (checkins.reduce((s, c) => s + c.urge, 0) / checkins.length).toFixed(1) : '—';
  return t('support.report', {
    streak: t('common.days', { count: daysIn(currentStreakMs(data)) }),
    best: t('common.days', { count: daysIn(bestStreakMs(data)) }),
    urges: data.urges.filter((u) => inWeek(u.date)).length,
    slips: data.relapses.filter((r) => inWeek(r.date)).length,
    checkins: checkins.length,
    avgUrge,
  });
}

export default function Support() {
  const { t } = useTranslation();
  const { data, actions } = useStore();
  const [editing, setEditing] = useState(!data.partner);
  const [name, setName] = useState(data.partner?.name ?? '');
  const [phone, setPhone] = useState(data.partner?.phone ?? '');
  const partner = data.partner;

  const savePartner = () => {
    actions.setPartner({ name: name.trim(), phone: phone.trim(), alertOnPanic: partner?.alertOnPanic ?? true });
    setEditing(false);
  };

  const removePartner = () => {
    actions.setPartner(null);
    setName('');
    setPhone('');
    setEditing(true);
  };

  return (
    <Screen tabs>
      <SectionTitle>{t('support.partnerSection')}</SectionTitle>
      <Card>
        <H2>{t('support.partnerTitle')}</H2>
        <Muted>{t('support.partnerBody')}</Muted>

        {editing || !partner ? (
          <View style={{ gap: 12 }}>
            <Field label={t('support.name')} value={name} onChangeText={setName} placeholder={t('support.namePlaceholder')} />
            <Field
              label={t('support.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
            />
            <Button title={t('support.savePartner')} onPress={savePartner} disabled={!name.trim() || !phone.trim()} />
            {partner && <Button title={t('common.cancel')} variant="ghost" onPress={() => setEditing(false)} />}
          </View>
        ) : (
          <View style={{ gap: 2 }}>
            <ListRow
              icon="person-circle-outline"
              title={partner.name}
              subtitle={partner.phone}
              right={<Button small title={t('common.edit')} variant="ghost" onPress={() => setEditing(true)} />}
            />
            <SwitchRow
              icon="shield-half-outline"
              title={t('support.alertOnPanic')}
              subtitle={t('support.alertOnPanicBody')}
              value={partner.alertOnPanic}
              onValueChange={(alertOnPanic) => actions.setPartner({ ...partner, alertOnPanic })}
            />
            <ListRow
              icon="chatbubble-ellipses-outline"
              title={t('support.struggling')}
              subtitle={t('support.strugglingBody')}
              onPress={() => textPartner(partner.phone, t('support.strugglingMessage'))}
            />
            <ListRow icon="call-outline" title={t('support.call', { name: partner.name })} onPress={() => callNumber(partner.phone)} />
            <ListRow
              icon="stats-chart-outline"
              title={t('support.weekly')}
              subtitle={t('support.weeklyBody')}
              onPress={() => textPartner(partner.phone, weeklyReport(data, t))}
            />
            <Button title={t('support.removePartner')} variant="ghost" onPress={removePartner} />
          </View>
        )}
      </Card>

      <Card>
        <H2>{t('support.shareTitle')}</H2>
        <Muted>{t('support.shareBody')}</Muted>
        <Button
          title={t('support.share')}
          icon="share-outline"
          variant="secondary"
          onPress={() => Share.share({ message: weeklyReport(data, t) }).catch(() => {})}
        />
      </Card>

      <SectionTitle>{t('support.toolsSection')}</SectionTitle>
      <Card>
        <ListRow icon="shield-checkmark-outline" title={t('protection.title')} subtitle={t('support.protectionBody')} onPress={() => router.push('/protection')} />
        <ListRow icon="ribbon-outline" title={t('stories.title')} subtitle={t('support.storiesBody')} onPress={() => router.push('/stories')} />
        <ListRow icon="flask-outline" title={t('facts.title')} subtitle={t('support.factsBody')} onPress={() => router.push('/facts')} />
      </Card>

      <SectionTitle>{t('support.helpSection')}</SectionTitle>
      <CrisisHelplines country={data.profile.country} compact />
      <Card>
        <Body>{t('support.professional')}</Body>
        <ListRow icon="list-outline" title={t('helplines.allHelplines')} onPress={() => router.push('/helplines')} />
      </Card>
    </Screen>
  );
}

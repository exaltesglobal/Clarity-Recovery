import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform } from 'react-native';

import { ReasonsEditor } from '../components/ReasonsEditor';
import { Button, Card, Chip, ChipRow, Field, H2, ListRow, Muted, Screen, SectionTitle, SwitchRow } from '../components/ui';
import { countryName, flag } from '../content/countries';
import { languageInfo } from '../i18n';
import { useBilling } from '../lib/billing';
import { formatDate, formatTimeOfDay } from '../lib/date';
import { cancelReminders } from '../lib/notifications';
import { useStore } from '../lib/store';

const GOALS = [30, 90, 180, 365];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { data, actions } = useStore();
  const billing = useBilling();
  const { profile, reminders, assessment } = data;
  const [name, setName] = useState(profile.name);

  const reset = () => {
    const doReset = async () => {
      await cancelReminders();
      actions.resetAll();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`${t('settings.eraseTitle')}\n\n${t('settings.eraseBody')}`)) doReset();
      return;
    }
    Alert.alert(t('settings.eraseTitle'), t('settings.eraseBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.erase'), style: 'destructive', onPress: doReset },
    ]);
  };

  const nudgeText = reminders.nudges.enabled
    ? t('settings.nudgesOn', {
        hours: reminders.nudges.everyHours,
        start: formatTimeOfDay(reminders.nudges.startHour, 0, i18n.language),
        end: formatTimeOfDay(reminders.nudges.endHour, 0, i18n.language),
      })
    : t('settings.nudgesOff');

  return (
    <Screen>
      <SectionTitle>{t('settings.account')}</SectionTitle>
      <Card>
        <ListRow
          icon="sparkles-outline"
          title={t('settings.subscription')}
          subtitle={
            !billing.available
              ? t('settings.subscriptionDev')
              : billing.premium
                ? billing.inTrial
                  ? billing.expiresAt
                    ? t('settings.subscriptionTrialEnds', { date: formatDate(billing.expiresAt, i18n.language) })
                    : t('settings.subscriptionTrial')
                  : t('settings.subscriptionActive')
                : t('settings.subscriptionFree')
          }
          // Subscribers manage their plan in RevenueCat's Customer Center.
          onPress={() => (billing.available && billing.premium ? billing.manage() : router.push('/paywall'))}
        />
      </Card>

      <SectionTitle>{t('settings.aboutYou')}</SectionTitle>
      <Card>
        <Field
          label={t('onboarding.nameLabel')}
          value={name}
          onChangeText={setName}
          onBlur={() => actions.updateProfile({ name: name.trim() })}
          onSubmitEditing={() => actions.updateProfile({ name: name.trim() })}
          placeholder={t('common.optional')}
        />
        <ListRow
          icon="person-outline"
          title={t('settings.profile')}
          subtitle={[
            t(`gender.${profile.gender}`),
            profile.ageRange,
            `${flag(profile.country)} ${countryName(profile.country, i18n.language)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
          onPress={() => router.push('/profile')}
        />
        <ListRow
          icon="language-outline"
          title={t('settings.language')}
          subtitle={languageInfo(i18n.language).native}
          onPress={() => router.push('/profile?section=language')}
        />
        <ListRow
          icon="pulse-outline"
          title={t('settings.assessment')}
          subtitle={assessment ? t(`assessment.severity.${assessment.severity}`) : t('settings.assessmentNone')}
          onPress={() => router.push('/assessment')}
        />
      </Card>

      <SectionTitle>{t('settings.recovery')}</SectionTitle>
      <Card>
        <H2>{t('settings.goal')}</H2>
        <ChipRow>
          {GOALS.map((g) => (
            <Chip key={g} label={t('common.days', { count: g })} selected={profile.goalDays === g} onPress={() => actions.updateProfile({ goalDays: g })} />
          ))}
        </ChipRow>
      </Card>
      <Card>
        <H2>{t('settings.reasons')}</H2>
        <ReasonsEditor reasons={profile.reasons} onChange={(reasons) => actions.updateProfile({ reasons })} />
      </Card>
      <Card>
        <SwitchRow
          icon="book-outline"
          title={t('settings.faith')}
          subtitle={t('settings.faithBody')}
          value={profile.faith}
          onValueChange={(faith) => actions.updateProfile({ faith })}
        />
      </Card>

      <SectionTitle>{t('settings.appSection')}</SectionTitle>
      <Card>
        <ListRow icon="notifications-outline" title={t('reminders.title')} subtitle={nudgeText} onPress={() => router.push('/reminders')} />
        <ListRow icon="color-palette-outline" title={t('appearance.title')} subtitle={t(`appearance.themes.${data.appearance.themeId}`)} onPress={() => router.push('/appearance')} />
        <ListRow icon="shield-checkmark-outline" title={t('protection.title')} onPress={() => router.push('/protection')} />
        <ListRow icon="watch-outline" title={t('health.title')} subtitle={data.health.connected ? t('health.isConnected') : undefined} onPress={() => router.push('/health')} />
        <ListRow icon="call-outline" title={t('helplines.title')} onPress={() => router.push('/helplines')} />
      </Card>

      <SectionTitle>{t('settings.privacy')}</SectionTitle>
      <Card>
        <Muted>{t('settings.privacyBody')}</Muted>
        <Button title={t('settings.erase')} variant="danger" icon="trash-outline" onPress={reset} />
      </Card>
      <Muted center>{t('settings.version', { version: '1.0.0' })}</Muted>
    </Screen>
  );
}

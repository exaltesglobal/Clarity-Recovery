import { useLocalSearchParams } from 'expo-router';
import { reloadAppAsync } from 'expo';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CountryPicker, LanguagePicker } from '../components/Pickers';
import { Body, Button, Card, Chip, ChipRow, H2, Screen } from '../components/ui';
import { languageInfo } from '../i18n';
import { useStore } from '../lib/store';
import type { AgeRange, Gender } from '../lib/types';

const GENDERS: Gender[] = ['male', 'female', 'nonbinary', 'unspecified'];
const AGES: AgeRange[] = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'];

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { data, actions } = useStore();
  const { profile } = data;
  const [needsRestart, setNeedsRestart] = useState(false);

  const setLanguage = (code: string) => {
    const wasRtl = !!languageInfo(i18n.language).rtl;
    actions.updateProfile({ language: code });
    if (wasRtl !== !!languageInfo(code).rtl) setNeedsRestart(true);
  };

  const language = (
    <Card>
      <H2>{t('settings.language')}</H2>
      {needsRestart && (
        <Card variant="gold">
          <Body>{t('onboarding.rtlRestart')}</Body>
          <Button small title={t('settings.restart')} onPress={() => reloadAppAsync().catch(() => {})} />
        </Card>
      )}
      <LanguagePicker value={i18n.language} onChange={setLanguage} />
    </Card>
  );

  if (section === 'language') return <Screen>{language}</Screen>;

  return (
    <Screen>
      <Card>
        <H2>{t('onboarding.genderLabel')}</H2>
        <ChipRow>
          {GENDERS.map((g) => (
            <Chip key={g} label={t(`gender.${g}`)} selected={profile.gender === g} onPress={() => actions.updateProfile({ gender: g })} />
          ))}
        </ChipRow>
      </Card>
      <Card>
        <H2>{t('onboarding.ageLabel')}</H2>
        <ChipRow>
          {AGES.map((a) => (
            <Chip key={a} label={a} selected={profile.ageRange === a} onPress={() => actions.updateProfile({ ageRange: a })} />
          ))}
        </ChipRow>
      </Card>
      <Card>
        <H2>{t('onboarding.countryTitle')}</H2>
        <CountryPicker value={profile.country} onChange={(country) => actions.updateProfile({ country })} />
      </Card>
      {language}
    </Screen>
  );
}

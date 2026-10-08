import Ionicons from '@expo/vector-icons/Ionicons';
import { reloadAppAsync } from 'expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AssessmentFlow } from '../components/AssessmentFlow';
import { AssessmentResult } from '../components/AssessmentResult';
import { Logo } from '../components/Logo';
import { CountryPicker, LanguagePicker } from '../components/Pickers';
import { ReasonsEditor } from '../components/ReasonsEditor';
import {
  Body,
  Button,
  Card,
  Chip,
  ChipRow,
  Field,
  H1,
  H2,
  Muted,
  ProgressBar,
  SwitchRow,
  Title,
} from '../components/ui';
import { countryName, flag } from '../content/countries';
import { regionFor } from '../content/regions';
import { languageInfo } from '../i18n';
import { planFor } from '../lib/assessment';
import { useBilling } from '../lib/billing';
import { useStore } from '../lib/store';
import type { AgeRange, Assessment, Gender } from '../lib/types';
import { useTheme } from '../theme';

const STEPS = ['welcome', 'language', 'about', 'country', 'assessment', 'result', 'reasons', 'start'] as const;
type Step = (typeof STEPS)[number];

const GENDERS: Gender[] = ['male', 'female', 'nonbinary', 'unspecified'];
const AGES: AgeRange[] = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'];
const GOALS = [30, 90, 180, 365];

export default function Onboarding() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { data, actions } = useStore();
  const billing = useBilling();

  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState(data.profile.name);
  const [gender, setGender] = useState<Gender>(data.profile.gender);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(data.profile.ageRange);
  const [country, setCountry] = useState(data.profile.country);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [reasons, setReasons] = useState<string[]>(data.profile.reasons);
  const [faith, setFaith] = useState(data.profile.faith);
  const [daysClean, setDaysClean] = useState('0');
  const [goalDays, setGoalDays] = useState<number | null>(null);
  const [rtlNotice, setRtlNotice] = useState(false);

  const index = STEPS.indexOf(step);
  const go = (s: Step) => setStep(s);
  const next = () => setStep(STEPS[Math.min(index + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(index - 1, 0)]);

  const setLanguage = (code: string) => {
    const wasRtl = !!languageInfo(i18n.language).rtl;
    actions.updateProfile({ language: code });
    setRtlNotice(wasRtl !== !!languageInfo(code).rtl);
  };

  const plan = assessment ? planFor(assessment.severity) : null;
  const regionLanguage = regionFor(country).language;
  const suggestedLanguage = regionLanguage !== i18n.language ? regionLanguage : null;

  const finish = () => {
    const p = plan ?? planFor('moderate');
    actions.completeOnboarding({
      profile: {
        ...data.profile,
        name: name.trim(),
        gender,
        ageRange,
        country,
        reasons,
        faith,
        goalDays: goalDays ?? p.goalDays,
      },
      assessment,
      reminders: p.reminders,
      protection: { dnsFilter: false, mindfulPause: false },
      daysClean: Number.parseInt(daysClean, 10) || 0,
    });
    router.replace('/');
    if (billing.available && !billing.premium) setTimeout(() => router.push('/paywall?onboarding=1'), 300);
  };

  let content: React.ReactNode;
  let primary: { title: string; onPress: () => void; disabled?: boolean } | null = null;

  switch (step) {
    case 'welcome':
      content = (
        <View style={styles.welcome}>
          <Logo size={112} />
          <View style={{ gap: 10 }}>
            <Title center>{tr('appName')}</Title>
            <Body center style={{ color: t.muted }}>
              {tr('onboarding.tagline')}
            </Body>
          </View>
          <Card variant="soft" style={{ alignSelf: 'stretch' }}>
            {(['private', 'personal', 'support'] as const).map((k, i) => (
              <View key={k} style={styles.bullet}>
                <Ionicons
                  name={(['lock-closed-outline', 'options-outline', 'heart-outline'] as const)[i]}
                  size={20}
                  color={t.primary}
                />
                <Body style={{ flex: 1 }}>{tr(`onboarding.promise.${k}`)}</Body>
              </View>
            ))}
          </Card>
          <Pressable onPress={() => go('language')} accessibilityRole="button" hitSlop={8}>
            <Muted style={{ color: t.primary }}>
              🌐 {languageInfo(i18n.language).native} · {tr('onboarding.changeLanguage')}
            </Muted>
          </Pressable>
        </View>
      );
      primary = { title: tr('onboarding.getStarted'), onPress: () => go('about') };
      break;

    case 'language':
      content = (
        <>
          <H1>{tr('onboarding.languageTitle')}</H1>
          {rtlNotice && (
            <Card variant="gold">
              <Body>{tr('onboarding.rtlRestart')}</Body>
              <Button small title={tr('settings.restart')} onPress={() => reloadAppAsync().catch(() => {})} />
            </Card>
          )}
          <LanguagePicker value={i18n.language} onChange={setLanguage} />
        </>
      );
      primary = { title: tr('common.continue'), onPress: () => go('about') };
      break;

    case 'about':
      content = (
        <>
          <H1>{tr('onboarding.aboutTitle')}</H1>
          <Muted>{tr('onboarding.aboutBody')}</Muted>
          <Card>
            <H2>{tr('onboarding.nameLabel')}</H2>
            <Field value={name} onChangeText={setName} placeholder={tr('onboarding.namePlaceholder')} />
          </Card>
          <Card>
            <H2>{tr('onboarding.genderLabel')}</H2>
            <ChipRow>
              {GENDERS.map((g) => (
                <Chip key={g} label={tr(`gender.${g}`)} selected={gender === g} onPress={() => setGender(g)} />
              ))}
            </ChipRow>
          </Card>
          <Card>
            <H2>{tr('onboarding.ageLabel')}</H2>
            <ChipRow>
              {AGES.map((a) => (
                <Chip key={a} label={a} selected={ageRange === a} onPress={() => setAgeRange(a)} />
              ))}
            </ChipRow>
            {ageRange === '13-17' && <Muted>{tr('onboarding.teenNote')}</Muted>}
          </Card>
        </>
      );
      primary = { title: tr('common.continue'), onPress: next, disabled: !ageRange };
      break;

    case 'country':
      content = (
        <>
          <H1>{tr('onboarding.countryTitle')}</H1>
          <Muted>{tr('onboarding.countryBody')}</Muted>
          {suggestedLanguage && (
            <Card variant="soft">
              <Body>{tr('onboarding.languageSuggestion', { language: languageInfo(suggestedLanguage).native })}</Body>
              <Button small variant="secondary" title={languageInfo(suggestedLanguage).native} onPress={() => setLanguage(suggestedLanguage)} />
            </Card>
          )}
          <CountryPicker value={country} onChange={setCountry} />
        </>
      );
      primary = {
        title: `${tr('common.continue')} · ${flag(country)} ${countryName(country, i18n.language)}`,
        onPress: next,
      };
      break;

    case 'assessment':
      content = (
        <AssessmentFlow
          country={country}
          onBack={back}
          onComplete={(a) => {
            setAssessment(a);
            setGoalDays(planFor(a.severity).goalDays);
            go('result');
          }}
        />
      );
      break;

    case 'result':
      content = assessment && (
        <>
          <H1>{tr('assessment.resultTitle')}</H1>
          <AssessmentResult assessment={assessment} />
        </>
      );
      primary = { title: tr('onboarding.usePlan'), onPress: next };
      break;

    case 'reasons':
      content = (
        <>
          <H1>{tr('onboarding.reasonsTitle')}</H1>
          <Muted>{tr('onboarding.reasonsBody')}</Muted>
          <Card>
            <ReasonsEditor reasons={reasons} onChange={setReasons} />
          </Card>
          <Card>
            <SwitchRow
              icon="book-outline"
              title={tr('onboarding.faithTitle')}
              subtitle={tr('onboarding.faithBody')}
              value={faith}
              onValueChange={setFaith}
            />
          </Card>
        </>
      );
      primary = { title: tr('common.continue'), onPress: next };
      break;

    case 'start':
      content = (
        <>
          <H1>{tr('onboarding.startTitle')}</H1>
          <Card>
            <H2>{tr('onboarding.daysCleanLabel')}</H2>
            <Muted>{tr('onboarding.daysCleanHint')}</Muted>
            <Field
              value={daysClean}
              onChangeText={(v) => setDaysClean(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={4}
              accessibilityLabel={tr('onboarding.daysCleanLabel')}
            />
          </Card>
          <Card>
            <H2>{tr('onboarding.goalLabel')}</H2>
            <ChipRow>
              {GOALS.map((g) => (
                <Chip
                  key={g}
                  label={tr('common.days', { count: g })}
                  selected={(goalDays ?? 90) === g}
                  onPress={() => setGoalDays(g)}
                />
              ))}
            </ChipRow>
          </Card>
          <Card variant="soft">
            <Body>{tr('onboarding.partnerLater')}</Body>
          </Card>
        </>
      );
      primary = { title: tr('onboarding.finish'), onPress: finish };
      break;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      {step !== 'welcome' && (
        <View style={styles.topBar}>
          <Pressable
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel={tr('common.back')}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={t.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ProgressBar value={index / (STEPS.length - 1)} />
          </View>
          <Muted style={{ minWidth: 36, textAlign: 'right' }}>
            {index}/{STEPS.length - 1}
          </Muted>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {content}
      </ScrollView>
      {primary && (
        <View style={[styles.footer, { borderTopColor: t.border, backgroundColor: t.bg }]}>
          <Button title={primary.title} onPress={primary.onPress} disabled={primary.disabled} icon="arrow-forward" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcome: { alignItems: 'center', gap: 24, paddingTop: 32 },
  bullet: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});

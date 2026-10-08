import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ANSWER_KEYS, FREQUENCY_KEYS, QUESTION_KEYS, scoreAssessment } from '../lib/assessment';
import type { Assessment } from '../lib/types';
import { CrisisHelplines } from './Helplines';
import { Body, Button, H1, Muted, Option, ProgressBar } from './ui';

const TOTAL = QUESTION_KEYS.length + 2;

/**
 * Self-reflection questions about porn use, current frequency and a safety
 * check. Answers never leave the device.
 */
export function AssessmentFlow({
  country,
  onComplete,
  onBack,
}: {
  country: string;
  onComplete: (assessment: Assessment) => void;
  onBack?: () => void;
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [safety, setSafety] = useState<boolean | null>(null);
  const [showCrisis, setShowCrisis] = useState(false);

  const back = () => (index === 0 ? onBack?.() : setIndex(index - 1));

  const finish = (safetyFlag: boolean) => onComplete(scoreAssessment(answers, frequency ?? 0, safetyFlag));

  if (showCrisis) {
    return (
      <View style={{ gap: 16 }}>
        <H1>{t('assessment.crisisTitle')}</H1>
        <Body>{t('assessment.crisisBody')}</Body>
        <CrisisHelplines country={country} />
        <Button title={t('common.continue')} onPress={() => finish(true)} />
      </View>
    );
  }

  let title: string;
  let options: { label: string; selected: boolean; onPress: () => void }[];

  if (index < QUESTION_KEYS.length) {
    title = t(`assessment.questions.${QUESTION_KEYS[index]}`);
    options = ANSWER_KEYS.map((key, value) => ({
      label: t(`assessment.answers.${key}`),
      selected: answers[index] === value,
      onPress: () => {
        const next = [...answers];
        next[index] = value;
        setAnswers(next);
        setIndex(index + 1);
      },
    }));
  } else if (index === QUESTION_KEYS.length) {
    title = t('assessment.frequencyQuestion');
    options = FREQUENCY_KEYS.map((key, value) => ({
      label: t(`assessment.frequency.${key}`),
      selected: frequency === value,
      onPress: () => {
        setFrequency(value);
        setIndex(index + 1);
      },
    }));
  } else {
    title = t('assessment.safetyQuestion');
    options = [
      {
        label: t('common.no'),
        selected: safety === false,
        onPress: () => {
          setSafety(false);
          finish(false);
        },
      },
      {
        label: t('common.yes'),
        selected: safety === true,
        onPress: () => {
          setSafety(true);
          setShowCrisis(true);
        },
      },
    ];
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Muted>{t('assessment.progress', { current: index + 1, total: TOTAL })}</Muted>
        <ProgressBar value={(index + 1) / TOTAL} />
      </View>
      {index === 0 && <Muted>{t('assessment.intro')}</Muted>}
      <H1>{title}</H1>
      {index === TOTAL - 1 && <Muted>{t('assessment.safetyNote')}</Muted>}
      <View style={{ gap: 10 }}>
        {options.map((o) => (
          <Option key={o.label} label={o.label} selected={o.selected} onPress={o.onPress} />
        ))}
      </View>
      {(index > 0 || onBack) && <Button title={t('common.back')} variant="ghost" icon="arrow-back" onPress={back} />}
    </View>
  );
}

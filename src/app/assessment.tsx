import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AssessmentFlow } from '../components/AssessmentFlow';
import { AssessmentResult } from '../components/AssessmentResult';
import { Body, Button, Card, Muted, Screen } from '../components/ui';
import { planFor } from '../lib/assessment';
import { useStore } from '../lib/store';
import type { Assessment } from '../lib/types';

export default function AssessmentScreen() {
  const { t, i18n } = useTranslation();
  const { data, actions } = useStore();
  const [retaking, setRetaking] = useState(!data.assessment);
  const [fresh, setFresh] = useState<Assessment | null>(null);
  const shown = fresh ?? data.assessment;

  const applyPlan = () => {
    if (!shown) return;
    const plan = planFor(shown.severity);
    actions.setReminders(plan.reminders);
    actions.updateProfile({ goalDays: plan.goalDays });
    router.back();
  };

  if (retaking) {
    return (
      <Screen>
        <AssessmentFlow
          country={data.profile.country}
          onComplete={(a) => {
            actions.setAssessment(a);
            setFresh(a);
            setRetaking(false);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {shown && (
        <>
          <Muted>{t('assessment.takenOn', { date: new Date(shown.date).toLocaleDateString(i18n.language) })}</Muted>
          <AssessmentResult assessment={shown} />
          <Button title={t('assessment.applyPlan')} icon="checkmark-done-outline" onPress={applyPlan} />
        </>
      )}
      <Card>
        <Body>{t('assessment.retakeBody')}</Body>
        <Button title={t('assessment.retake')} variant="secondary" icon="refresh" onPress={() => setRetaking(true)} />
      </Card>
    </Screen>
  );
}

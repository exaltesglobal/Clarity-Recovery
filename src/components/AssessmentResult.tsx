import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { formatTimeOfDay } from '../lib/date';
import { MAX_SCORE, planFor } from '../lib/assessment';
import type { Assessment } from '../lib/types';
import { useTheme } from '../theme';
import { Body, Card, H1, H2, Muted, ProgressBar } from './ui';

export function AssessmentResult({ assessment }: { assessment: Assessment }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const plan = planFor(assessment.severity);
  const color = { low: t.primary, moderate: t.gold, high: t.danger }[assessment.severity];
  const { nudges, checkIn } = plan.reminders;

  const items: string[] = [
    tr('assessment.plan.goal', { days: plan.goalDays }),
    tr('assessment.plan.nudges', {
      hours: nudges.everyHours,
      start: formatTimeOfDay(nudges.startHour, 0),
      end: formatTimeOfDay(nudges.endHour, 0),
    }),
    tr('assessment.plan.checkIn', { time: formatTimeOfDay(checkIn.hour, checkIn.minute) }),
    tr('assessment.plan.dns'),
  ];
  if (plan.protection.mindfulPause) items.push(tr('assessment.plan.pause'));
  if (plan.recommendPartner) items.push(tr('assessment.plan.partner'));
  if (plan.recommendProfessional) items.push(tr('assessment.plan.professional'));

  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Muted>{tr('assessment.resultLabel')}</Muted>
        <H1 style={{ color }}>{tr(`assessment.severity.${assessment.severity}`)}</H1>
        <ProgressBar value={assessment.score / MAX_SCORE} color={color} />
        <Body>{tr(`assessment.severityText.${assessment.severity}`)}</Body>
        <Muted>{tr('assessment.disclaimer')}</Muted>
      </Card>
      <Card variant="soft">
        <H2>{tr('assessment.planTitle')}</H2>
        {items.map((item) => (
          <View key={item} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="checkmark-circle" size={20} color={t.primary} style={{ marginTop: 1 }} />
            <Body style={{ flex: 1 }}>{item}</Body>
          </View>
        ))}
        <Muted>{tr('assessment.planNote')}</Muted>
      </Card>
    </View>
  );
}

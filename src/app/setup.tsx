import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Body, Button, Card, H2, Muted, ProgressBar, Screen, SectionTitle } from '../components/ui';
import { openUrl } from '../lib/contact';
import { type SetupGroup, type SetupStep, useSetupSteps } from '../lib/setup';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';

const GUIDE_URL: string | undefined = Constants.expoConfig?.extra?.guideUrl || undefined;
const GROUPS: SetupGroup[] = ['essentials', 'protection', 'running', 'extras'];

/** One-time steps that keep protection working, with live status where Android can report it. */
export default function SetupChecklist() {
  const { t: tr } = useTranslation();
  const { steps, total, completed } = useSetupSteps();

  return (
    <Screen>
      <Card>
        <H2>{completed === total ? tr('setup.allDone') : tr('setup.progress', { done: completed, total })}</H2>
        <ProgressBar value={total ? completed / total : 1} />
        <Muted>{tr('setup.intro')}</Muted>
        {GUIDE_URL && <Button small variant="ghost" icon="book-outline" title={tr('setup.fullGuide')} onPress={() => openUrl(GUIDE_URL)} />}
      </Card>

      {GROUPS.map((group) => {
        const inGroup = steps.filter((s) => s.group === group);
        if (inGroup.length === 0) return null;
        return (
          <View key={group} style={{ gap: 10 }}>
            <SectionTitle>{tr(`setup.groups.${group}`)}</SectionTitle>
            {inGroup.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

function StepCard({ step }: { step: SetupStep }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { actions } = useStore();
  const key = `setup.steps.${step.id}`;

  return (
    <Card variant={step.done ? 'soft' : 'plain'}>
      <View style={styles.header}>
        <Ionicons
          name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={step.done ? t.primary : t.muted}
          accessibilityLabel={step.done ? tr('setup.done') : undefined}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <H2>{tr(`${key}.title`, step.vars)}</H2>
          {step.optional && <Muted style={{ color: t.primary }}>{tr('setup.optional')}</Muted>}
          <Body style={{ color: t.muted }}>{tr(`${key}.body`, step.vars)}</Body>
        </View>
      </View>
      {!step.done && step.action && <Button small title={tr(`${key}.button`, step.vars)} onPress={step.action} />}
      {step.manual && (
        <Button
          small
          variant="ghost"
          icon={step.done ? 'arrow-undo-outline' : 'checkmark'}
          title={step.done ? tr('setup.undo') : tr('setup.markDone')}
          onPress={() => actions.toggleSetupStep(step.id)}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
});

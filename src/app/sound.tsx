import Ionicons from '@expo/vector-icons/Ionicons';
import type { Voice } from 'expo-speech';
import { VoiceQuality } from 'expo-speech';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Button, Card, Chip, ChipRow, H2, ListRow, Muted, Screen, SwitchRow } from '../components/ui';
import { useSoundEffects } from '../lib/sounds';
import { chooseVoice, isNetworkVoice, speechLanguage, useNarrator, voiceGender, voicesFor } from '../lib/speech';
import { useStore } from '../lib/store';
import type { VoiceGender } from '../lib/types';
import { useTheme } from '../theme';

const GENDERS: VoiceGender[] = ['female', 'male'];
const RATES = [
  { id: 'slow', rate: 0.75 },
  { id: 'calm', rate: 0.9 },
  { id: 'normal', rate: 1 },
] as const;

/** Android names voices by identifier ("en-us-x-sfg-local"); those read better as "Voice 3". */
function looksLikeIdentifier(name: string) {
  return !name.includes(' ') && /[-_#.]/.test(name);
}

export default function SoundScreen() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { data, actions } = useStore();
  const { sound } = data;
  const narrator = useNarrator(i18n.language, sound);
  const playEffect = useSoundEffects(true);
  const [voices, setVoices] = useState<Voice[] | null>(null);

  useEffect(() => {
    let live = true;
    voicesFor(speechLanguage(i18n.language), true).then((v) => live && setVoices(v));
    return () => {
      live = false;
    };
  }, [i18n.language]);

  const current = voices ? chooseVoice(voices, sound) : undefined;
  const genderMissing = voices !== null && voices.length > 0 && !sound.voiceId && !voices.some((v) => voiceGender(v) === sound.voiceGender);

  // Settings reach the narrator after a render, so wait a moment before previewing a change.
  const preview = () => setTimeout(() => narrator.say(tr('sound.sample')), 100);

  return (
    <Screen>
      <Card>
        <SwitchRow
          icon="volume-high-outline"
          title={tr('sound.voiceGuide')}
          subtitle={tr('sound.voiceGuideBody')}
          value={sound.voice}
          onValueChange={(voice) => actions.setSound({ voice })}
        />
        <SwitchRow
          icon="notifications-outline"
          title={tr('sound.bells')}
          subtitle={tr('sound.bellsBody')}
          value={sound.effects}
          onValueChange={(effects) => {
            actions.setSound({ effects });
            if (effects) playEffect('chime');
          }}
        />
      </Card>

      <Card>
        <H2>{tr('sound.voice')}</H2>
        <ChipRow>
          {GENDERS.map((g) => (
            <Chip
              key={g}
              label={tr(`sound.genders.${g}`)}
              selected={!sound.voiceId && sound.voiceGender === g}
              onPress={() => {
                actions.setSound({ voiceGender: g, voiceId: null });
                preview();
              }}
            />
          ))}
        </ChipRow>
        {genderMissing && <Muted>{tr('sound.genderMissing')}</Muted>}

        <H2>{tr('sound.speed')}</H2>
        <ChipRow>
          {RATES.map((r) => (
            <Chip
              key={r.id}
              label={tr(`sound.rates.${r.id}`)}
              selected={sound.rate === r.rate}
              onPress={() => {
                actions.setSound({ rate: r.rate });
                preview();
              }}
            />
          ))}
        </ChipRow>

        <Button
          variant="secondary"
          icon={narrator.speaking ? 'stop' : 'play'}
          title={narrator.speaking ? tr('sound.stop') : tr('sound.preview')}
          onPress={() => (narrator.speaking ? narrator.stop() : narrator.say(tr('sound.sample')))}
        />
      </Card>

      <Card>
        <H2>{tr('sound.deviceVoices')}</H2>
        {voices === null ? null : voices.length === 0 ? (
          <Muted>{tr('sound.noVoices')}</Muted>
        ) : (
          voices.map((v, i) => {
            const gender = voiceGender(v);
            const selected = current?.identifier === v.identifier;
            return (
              <ListRow
                key={v.identifier}
                title={looksLikeIdentifier(v.name) ? tr('sound.voiceNumber', { n: i + 1 }) : v.name}
                subtitle={[
                  gender && tr(`sound.genders.${gender}`),
                  v.quality === VoiceQuality.Enhanced && tr('sound.enhanced'),
                  isNetworkVoice(v) && tr('sound.needsInternet'),
                ]
                  .filter(Boolean)
                  .join(' · ')}
                right={selected ? <Ionicons name="checkmark-circle" size={22} color={t.primary} /> : <Ionicons name="play-circle-outline" size={22} color={t.muted} />}
                onPress={() => {
                  actions.setSound({ voiceId: v.identifier });
                  preview();
                }}
              />
            );
          })
        )}
        {Platform.OS === 'ios' && <Muted>{tr('sound.moreVoicesIos')}</Muted>}
        {Platform.OS === 'android' && <Muted>{tr('sound.moreVoicesAndroid')}</Muted>}
      </Card>

      {Platform.OS === 'ios' && <Muted center>{tr('sound.silentSwitch')}</Muted>}
    </Screen>
  );
}

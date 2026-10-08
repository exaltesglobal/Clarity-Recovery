import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

import { configureAudio } from './sounds';
import type { Sound, VoiceGender } from './types';

/** Locale tag to ask the speech engine for, given an app language code. */
export function speechLanguage(code: string) {
  // Plain "zh" can resolve to a Cantonese voice; the app's Chinese is Simplified (Mandarin).
  return code === 'zh' ? 'zh-CN' : code;
}

function normalize(tag: string) {
  return tag.replace('_', '-').toLowerCase();
}

function matchesLanguage(voice: Speech.Voice, language: string) {
  const v = normalize(voice.language);
  const want = normalize(language);
  return want.includes('-') ? v === want : v === want || v.startsWith(want + '-');
}

// Speech engines don't report a voice's gender. Android's legacy Google voices carry it in the
// identifier ("en-us-x-sfg#female_1-local"); Apple voices are known by name.
const FEMALE_NAMES =
  'samantha|karen|moira|tessa|fiona|victoria|allison|ava|susan|zoe|nicky|serena|kate|amelie|anna|paulina|monica|' +
  'luciana|joana|alice|milena|kyoko|ting-ting|tingting|mei-jia|sin-ji|lekha|damayanti|sara|ellen|yuna|zuzana|ioana|laura|' +
  'mariska|melina|nora|satu|carmit|lana|marie|helena|petra|catherine|martha|veena|kanya|alva|lesya|isha|shelley|sandy|flo|' +
  'grandma|marisol|soledad|francisca|audrey|aurelie|kiyara|amira|lin-lin|meijia|yu-shu|piya|nicole|haruka';
const MALE_NAMES =
  'daniel|alex|fred|tom|aaron|arthur|gordon|rishi|oliver|thomas|jorge|diego|juan|luca|yuri|maged|xander|otoya|li-mu|reed|' +
  'rocko|eddy|grandpa|albert|ralph|junior|evan|nathan|noah|jacques|martin|markus|hattori|majed|tarik|carlos|' +
  'felipe|eduardo|mikhail|milan|tomas|ichiro|yannick';
const FEMALE_RE = new RegExp(`\\b(${FEMALE_NAMES})\\b`, 'i');
const MALE_RE = new RegExp(`\\b(${MALE_NAMES})\\b`, 'i');

export function voiceGender(voice: Speech.Voice): VoiceGender | undefined {
  const text = `${voice.identifier} ${voice.name}`;
  if (/female/i.test(text)) return 'female';
  if (/(^|[^e])male/i.test(text)) return 'male';
  if (FEMALE_RE.test(voice.name)) return 'female';
  if (MALE_RE.test(voice.name)) return 'male';
  return undefined;
}

/** Android voices that stream from Google's servers and won't work offline. */
export function isNetworkVoice(voice: Speech.Voice) {
  return /network/i.test(voice.identifier);
}

let cache: Promise<Speech.Voice[]> | null = null;

/** Some engines (browsers in particular) never answer when they have no voices. */
function getVoices() {
  return Promise.race([
    Speech.getAvailableVoicesAsync(),
    new Promise<Speech.Voice[]>((resolve) => setTimeout(() => resolve([]), 3000)),
  ]);
}

async function loadVoices() {
  let voices = await getVoices();
  // Android's speech engine can report no voices until it has finished starting up.
  if (voices.length === 0) {
    await new Promise((r) => setTimeout(r, 800));
    voices = await getVoices();
  }
  if (voices.length === 0) cache = null;
  return voices;
}

/** Device voices for a language, best first: enhanced quality, then ones that work offline. */
export async function voicesFor(language: string, refresh = false): Promise<Speech.Voice[]> {
  if (!cache || refresh) cache = loadVoices().catch(() => ((cache = null), []));
  const all = await cache;
  const seen = new Set<string>();
  return all
    .filter((v) => matchesLanguage(v, language) && !seen.has(v.identifier) && seen.add(v.identifier))
    .sort(
      (a, b) =>
        Number(b.quality === Speech.VoiceQuality.Enhanced) - Number(a.quality === Speech.VoiceQuality.Enhanced) ||
        Number(isNetworkVoice(a)) - Number(isNetworkVoice(b)),
    );
}

/** The voice to read with: the one the user picked, else the best voice of their preferred gender. */
export function chooseVoice(voices: Speech.Voice[], sound: Pick<Sound, 'voiceId' | 'voiceGender'>) {
  return (
    voices.find((v) => v.identifier === sound.voiceId) ??
    voices.find((v) => voiceGender(v) === sound.voiceGender) ??
    voices[0]
  );
}

export function speak(text: string, options: { language: string; voice?: string; rate: number; onDone?: () => void }) {
  configureAudio();
  Speech.stop();
  Speech.speak(text, {
    language: options.language,
    voice: options.voice,
    rate: options.rate,
    pitch: 1,
    onDone: options.onDone,
    onStopped: options.onDone,
    onError: options.onDone,
  });
}

export function stopSpeaking() {
  Speech.stop();
}

/**
 * Reads text aloud in a language with the user's voice settings. `say` and `stop` keep the same
 * identity across renders. Speech stops when the component unmounts.
 */
export function useNarrator(language: string, sound: Sound) {
  const tag = speechLanguage(language);
  const [speaking, setSpeaking] = useState(false);
  const config = useRef({ tag, rate: sound.rate, voice: undefined as string | undefined });
  // Only the latest say() may clear the speaking flag; stopping speech fires its onStopped.
  const turn = useRef(0);

  useEffect(() => {
    config.current.tag = tag;
    config.current.rate = sound.rate;
  }, [tag, sound.rate]);

  useEffect(() => {
    let live = true;
    voicesFor(tag).then((voices) => {
      if (live) config.current.voice = chooseVoice(voices, sound)?.identifier;
    });
    return () => {
      live = false;
    };
  }, [tag, sound.voiceId, sound.voiceGender]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopSpeaking(), []);

  const say = useCallback((text: string) => {
    const mine = ++turn.current;
    const { tag: language, voice, rate } = config.current;
    setSpeaking(true);
    speak(text, {
      language,
      voice,
      rate,
      onDone: () => {
        if (turn.current === mine) setSpeaking(false);
      },
    });
  }, []);

  const stop = useCallback(() => {
    turn.current++;
    setSpeaking(false);
    stopSpeaking();
  }, []);

  return { say, stop, speaking };
}

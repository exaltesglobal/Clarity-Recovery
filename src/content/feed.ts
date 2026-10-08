import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';

/**
 * Wellness facts and recovery stories. A small set of facts ships with the app
 * (text in the locale files under facts.<id>), and a JSON feed can add or
 * replace items without an app update. The feed URL is `extra.contentFeedUrl`
 * in app.json; see content/feed.json in the repo for the format.
 */

export interface Fact {
  id: string;
  /** Text for bundled facts comes from i18n; feed facts carry their own text */
  title?: string;
  body?: string;
  /** Per-language overrides from the feed: { hi: { title, body } } */
  i18n?: Record<string, { title: string; body: string }>;
  source: string;
  url?: string;
  category: 'science' | 'habits' | 'body' | 'mind' | 'connection';
}

export interface Testimonial {
  id: string;
  /** First name or initials, as approved by the person */
  name: string;
  country?: string;
  /** e.g. "2 years free" */
  milestone?: string;
  quote: string;
  lang?: string;
}

export const BUNDLED_FACTS: Fact[] = [
  {
    id: 'prevalence',
    category: 'science',
    source: 'Dickenson et al., JAMA Network Open, 2018',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6324590/',
  },
  {
    id: 'icd11',
    category: 'science',
    source: 'World Health Organization, ICD-11 (6C72)',
    url: 'https://icd.who.int/browse/2024-01/mms/en',
  },
  {
    id: 'cueReactivity',
    category: 'science',
    source: 'Gola et al., Neuropsychopharmacology, 2017',
    url: 'https://doi.org/10.1038/npp.2017.78',
  },
  {
    id: 'moralIncongruence',
    category: 'mind',
    source: 'Grubbs et al., Archives of Sexual Behavior, 2019',
    url: 'https://doi.org/10.1007/s10508-018-1248-x',
  },
  {
    id: 'habits66',
    category: 'habits',
    source: 'Lally et al., European Journal of Social Psychology, 2010',
    url: 'https://doi.org/10.1002/ejsp.674',
  },
  {
    id: 'exerciseCravings',
    category: 'body',
    source: 'Haasova et al., Addiction, 2013',
    url: 'https://doi.org/10.1111/j.1360-0443.2012.04034.x',
  },
  {
    id: 'urgeSurfing',
    category: 'mind',
    source: 'Bowen & Marlatt, Psychology of Addictive Behaviors, 2009',
    url: 'https://doi.org/10.1037/a0017127',
  },
  {
    id: 'mbrp',
    category: 'mind',
    source: 'Bowen et al., JAMA Psychiatry, 2014',
    url: 'https://doi.org/10.1001/jamapsychiatry.2013.4546',
  },
  {
    id: 'sleepEmotion',
    category: 'body',
    source: 'Yoo et al., Current Biology, 2007',
    url: 'https://doi.org/10.1016/j.cub.2007.08.007',
  },
  {
    id: 'slowBreathing',
    category: 'body',
    source: 'Zaccaro et al., Frontiers in Human Neuroscience, 2018',
    url: 'https://doi.org/10.3389/fnhum.2018.00353',
  },
  {
    id: 'ifThenPlans',
    category: 'habits',
    source: 'Gollwitzer & Sheeran, Advances in Experimental Social Psychology, 2006',
    url: 'https://doi.org/10.1016/S0065-2601(06)38002-1',
  },
  {
    id: 'lapseNotRelapse',
    category: 'mind',
    source: 'Marlatt & Gordon, Relapse Prevention, 1985',
  },
  {
    id: 'socialConnection',
    category: 'connection',
    source: 'Holt-Lunstad et al., PLoS Medicine, 2010',
    url: 'https://doi.org/10.1371/journal.pmed.1000316',
  },
  {
    id: 'peerSupport',
    category: 'connection',
    source: 'Kelly et al., Cochrane Review, 2020',
    url: 'https://doi.org/10.1002/14651858.CD012880.pub2',
  },
  {
    id: 'gratitude',
    category: 'mind',
    source: 'Emmons & McCullough, J. Personality and Social Psychology, 2003',
    url: 'https://doi.org/10.1037/0022-3514.84.2.377',
  },
  {
    id: 'act',
    category: 'science',
    source: 'Crosby & Twohig, Behavior Therapy, 2016',
    url: 'https://doi.org/10.1016/j.beth.2016.02.001',
  },
];

interface Feed {
  facts: Fact[];
  testimonials: Testimonial[];
}

const CACHE_KEY = 'clarity:feed:v1';
const FEED_URL: string | undefined = Constants.expoConfig?.extra?.contentFeedUrl;

let memory: Feed | null = null;

async function loadFeed(): Promise<Feed> {
  if (memory) return memory;
  let cached: Feed = { facts: [], testimonials: [] };
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {}
  if (!FEED_URL) return (memory = cached);
  try {
    const res = await fetch(FEED_URL, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as Partial<Feed>;
    const fresh: Feed = {
      facts: Array.isArray(json.facts) ? json.facts : [],
      testimonials: Array.isArray(json.testimonials) ? json.testimonials : [],
    };
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
    return (memory = fresh);
  } catch {
    return (memory = cached);
  }
}

/** Bundled facts merged with the remote feed (feed items with the same id win). */
export function useFeed() {
  const [feed, setFeed] = useState<Feed>({ facts: BUNDLED_FACTS, testimonials: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    loadFeed().then((remote) => {
      if (!alive) return;
      const ids = new Set(remote.facts.map((f) => f.id));
      setFeed({
        facts: [...remote.facts, ...BUNDLED_FACTS.filter((f) => !ids.has(f.id))],
        testimonials: remote.testimonials,
      });
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);
  return { ...feed, loading };
}

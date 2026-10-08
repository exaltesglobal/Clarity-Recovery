import { strFromU8, unzipSync } from 'fflate';

/**
 * Finds accounts in an Instagram "Download your information" export that look
 * like adult-content creators. Instagram has no API for a user's following
 * list, so the user exports their own data and the file is analyzed on the
 * device. Only usernames are available, so this is a heuristic.
 */

export type Confidence = 'likely' | 'possible';

export interface FlaggedAccount {
  username: string;
  confidence: Confidence;
  reason: string;
}

export interface AnalysisResult {
  total: number;
  flagged: FlaggedAccount[];
}

/** Distinctive terms that are matched anywhere in a username. */
const STRONG_SUBSTRINGS = [
  'onlyfans', 'fansly', 'nsfw', 'xxx', 'porn', 'nude', 'naked', 'lewd', 'hotwife', 'camgirl', 'camboy',
  'escort', 'sugarbaby', 'fetish', 'onlyf', 'fanvue', 'manyvids', 'chaturbate', 'stripchat', 'thirsttrap',
];
const MEDIUM_SUBSTRINGS = ['lingerie', 'boudoir', 'spicy', 'sexy', 'seduct', 'naughty', 'kinky', 'busty', 'booty', 'twerk'];
/** Short terms that only count as a whole token (to avoid matching inside normal words). */
const STRONG_TOKENS = ['of', 'xxx', '18plus', 'nsfw', 'kink'];
const MEDIUM_TOKENS = ['hot', 'babe', 'thicc', 'cam', 'bikini', 'model', 'baddie', 'thot'];

export function classify(username: string): FlaggedAccount | null {
  const u = username.toLowerCase();
  const tokens = u.split(/[._\d-]+/).filter(Boolean);
  const strong = STRONG_SUBSTRINGS.find((k) => u.includes(k)) ?? STRONG_TOKENS.find((k) => tokens.includes(k));
  if (strong) return { username, confidence: 'likely', reason: strong };
  const medium = MEDIUM_SUBSTRINGS.find((k) => u.includes(k)) ?? MEDIUM_TOKENS.find((k) => tokens.includes(k));
  if (medium) return { username, confidence: 'possible', reason: medium };
  return null;
}

const PROFILE_RE = /instagram\.com\/(?:_u\/)?([A-Za-z0-9._]{1,30})/g;

function usernamesFromJson(json: unknown): string[] {
  const names = new Set<string>();
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    const entry = node as { title?: unknown; string_list_data?: { value?: string; href?: string }[] };
    if (Array.isArray(entry.string_list_data)) {
      for (const item of entry.string_list_data) {
        if (item.value) names.add(item.value);
        else if (item.href) for (const m of item.href.matchAll(PROFILE_RE)) names.add(m[1]);
      }
      if (typeof entry.title === 'string' && entry.title && !entry.string_list_data.some((i) => i.value)) {
        names.add(entry.title);
      }
      return;
    }
    Object.values(node).forEach(visit);
  };
  visit(json);
  return [...names];
}

function usernamesFromHtml(html: string): string[] {
  return [...new Set([...html.matchAll(PROFILE_RE)].map((m) => m[1]))].filter((u) => !['accounts', 'p', 'reel', 'stories'].includes(u));
}

/** Accepts the export .zip, or the following.json / following.html file from inside it. */
export function extractFollowing(bytes: Uint8Array, fileName: string): string[] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.zip') || (bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    const files = unzipSync(bytes, { filter: (f) => /following[^/]*\.(json|html)$/i.test(f.name) });
    const names = new Set<string>();
    for (const [name, data] of Object.entries(files)) {
      const text = strFromU8(data);
      const found = name.endsWith('.json') ? usernamesFromJson(JSON.parse(text)) : usernamesFromHtml(text);
      found.forEach((n) => names.add(n));
    }
    return [...names];
  }
  const text = strFromU8(bytes);
  if (lower.endsWith('.json') || text.trimStart().startsWith('{') || text.trimStart().startsWith('[')) {
    return usernamesFromJson(JSON.parse(text));
  }
  return usernamesFromHtml(text);
}

export function analyze(usernames: string[]): AnalysisResult {
  const flagged = usernames
    .map(classify)
    .filter((f): f is FlaggedAccount => !!f)
    .sort((a, b) => (a.confidence === b.confidence ? a.username.localeCompare(b.username) : a.confidence === 'likely' ? -1 : 1));
  return { total: usernames.length, flagged };
}

import { Platform } from 'react-native';

import ClarityGuard from '../../modules/clarity-guard';

/**
 * Device protection features backed by the local `clarity-guard` Android module:
 * a DNS-only VPN that sends lookups to CleanBrowsing's Family Filter, and an
 * accessibility service that shows a mindful pause when chosen apps open.
 */
export const guard = ClarityGuard;

/** True when the native module is present (an Android build of this app, not Expo Go). */
export const guardAvailable = Platform.OS === 'android' && !!ClarityGuard;

/**
 * Android skins that kill background apps or block background pop-ups by default, which can
 * stop the mindful pause. Maps Build.MANUFACTURER (lower-case) to a display name.
 */
const BACKGROUND_KILLERS: Record<string, string> = {
  xiaomi: 'Xiaomi',
  redmi: 'Redmi',
  poco: 'POCO',
  oppo: 'OPPO',
  realme: 'realme',
  vivo: 'vivo',
  iqoo: 'iQOO',
  oneplus: 'OnePlus',
  huawei: 'Huawei',
  honor: 'HONOR',
};

/** Display name of the phone maker when it needs extra steps for the pause, otherwise null. */
export function backgroundKillerMaker(): string | null {
  if (!guardAvailable || !guard) return null;
  return BACKGROUND_KILLERS[guard.deviceMaker()] ?? null;
}

/** Stands in for the other app's name in the pause overlay's texts; the service fills it in. */
export const PAUSE_APP_TOKEN = '%APP%';

/** Hostname for Android's built-in Private DNS setting, as a manual alternative. */
export const PRIVATE_DNS_HOST = 'family-filter-dns.cleanbrowsing.org';

/** Generates CleanBrowsing's Family Filter configuration profile (.mobileconfig) for iPhone. */
export const IOS_DNS_PROFILE_URL = 'https://cleanbrowsing.org/apple-dns?filter=family';

export const SOCIAL_APPS: { id: string; name: string }[] = [
  { id: 'com.instagram.android', name: 'Instagram' },
  { id: 'com.zhiliaoapp.musically', name: 'TikTok' },
  { id: 'com.ss.android.ugc.trill', name: 'TikTok' },
  { id: 'com.twitter.android', name: 'X (Twitter)' },
  { id: 'com.reddit.frontpage', name: 'Reddit' },
  { id: 'com.snapchat.android', name: 'Snapchat' },
  { id: 'com.facebook.katana', name: 'Facebook' },
  { id: 'org.telegram.messenger', name: 'Telegram' },
  { id: 'com.tumblr', name: 'Tumblr' },
  { id: 'com.google.android.youtube', name: 'YouTube' },
  { id: 'com.discord', name: 'Discord' },
];

export function appName(id: string) {
  return SOCIAL_APPS.find((a) => a.id === id)?.name ?? guard?.appLabel(id) ?? id;
}

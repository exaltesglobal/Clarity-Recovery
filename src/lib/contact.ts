import * as SMS from 'expo-sms';
import { Linking, Platform } from 'react-native';

export function smsUrl(phone: string, body: string) {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${phone}${sep}body=${encodeURIComponent(body)}`;
}

/**
 * Opens the phone's SMS composer with the recipient and message filled in, so
 * sending takes one tap. Apps cannot send SMS silently on iOS, and Google Play
 * restricts the SEND_SMS permission, so this is the reliable cross-platform path.
 */
export async function textPartner(phone: string, body: string) {
  try {
    if (Platform.OS !== 'web' && (await SMS.isAvailableAsync())) {
      await SMS.sendSMSAsync([phone], body);
      return;
    }
  } catch {}
  await Linking.openURL(smsUrl(phone, body)).catch(() => {});
}

export function callNumber(phone: string) {
  return Linking.openURL(`tel:${phone.replace(/[^0-9+*#]/g, '')}`).catch(() => {});
}

export function openUrl(url: string) {
  return Linking.openURL(url).catch(() => {});
}

import { Linking, Platform } from 'react-native';

export function smsUrl(phone: string, body: string) {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${phone}${sep}body=${encodeURIComponent(body)}`;
}

export function textPartner(phone: string, body: string) {
  return Linking.openURL(smsUrl(phone, body)).catch(() => {});
}

export function callNumber(phone: string) {
  return Linking.openURL(`tel:${phone}`).catch(() => {});
}

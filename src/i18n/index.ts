import './polyfills';

import i18n from 'i18next';
import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';
import bn from './locales/bn.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import id from './locales/id.json';
import ja from './locales/ja.json';
import mr from './locales/mr.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import ur from './locales/ur.json';
import zh from './locales/zh.json';

export interface Language {
  code: string;
  /** Name in the language itself */
  native: string;
  english: string;
  rtl?: boolean;
  /** Script uses Latin letters, so the brand font can render it */
  latin?: boolean;
}

export const LANGUAGES: Language[] = [
  { code: 'en', native: 'English', english: 'English', latin: true },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { code: 'mr', native: 'मराठी', english: 'Marathi' },
  { code: 'es', native: 'Español', english: 'Spanish', latin: true },
  { code: 'ar', native: 'العربية', english: 'Arabic', rtl: true },
  { code: 'pt', native: 'Português', english: 'Portuguese', latin: true },
  { code: 'zh', native: '中文（简体）', english: 'Chinese (Simplified)' },
  { code: 'fr', native: 'Français', english: 'French', latin: true },
  { code: 'bn', native: 'বাংলা', english: 'Bengali' },
  { code: 'ru', native: 'Русский', english: 'Russian' },
  { code: 'ur', native: 'اردو', english: 'Urdu', rtl: true },
  { code: 'id', native: 'Bahasa Indonesia', english: 'Indonesian', latin: true },
  { code: 'de', native: 'Deutsch', english: 'German', latin: true },
  { code: 'ja', native: '日本語', english: 'Japanese' },
];

export function supportedLanguage(code: string | null | undefined): string {
  return LANGUAGES.some((l) => l.code === code) ? (code as string) : 'en';
}

export function languageInfo(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
    es: { translation: es },
    ar: { translation: ar },
    pt: { translation: pt },
    zh: { translation: zh },
    fr: { translation: fr },
    bn: { translation: bn },
    ru: { translation: ru },
    ur: { translation: ur },
    id: { translation: id },
    de: { translation: de },
    ja: { translation: ja },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/**
 * Switches the UI language. Returns true when the layout direction changed,
 * which only takes full effect after the app restarts.
 */
export function applyLanguage(code: string): boolean {
  const lang = supportedLanguage(code);
  // eslint-disable-next-line import/no-named-as-default-member
  if (i18n.language !== lang) i18n.changeLanguage(lang);
  const rtl = !!languageInfo(lang).rtl;
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    return true;
  }
  return false;
}

export default i18n;

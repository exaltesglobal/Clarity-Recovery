/**
 * Country-specific support data. Numbers were checked against national
 * services and the international directory at findahelpline.com (Oct 2026).
 * Re-verify before each release: helplines change.
 */

export interface Helpline {
  name: string;
  phone?: string;
  url?: string;
  /** Short note such as hours or "text" */
  note?: string;
}

export interface Region {
  /** Emergency number for police/ambulance */
  emergency: string;
  /** Suggested app language */
  language: string;
  helplines: Helpline[];
}

export const REGIONS: Record<string, Region> = {
  IN: {
    emergency: '112',
    language: 'hi',
    helplines: [
      { name: 'Tele-MANAS (Govt. of India)', phone: '14416', url: 'https://telemanas.mohfw.gov.in', note: '24/7, many Indian languages' },
    ],
  },
  US: {
    emergency: '911',
    language: 'en',
    helplines: [
      { name: '988 Suicide & Crisis Lifeline', phone: '988', url: 'https://988lifeline.org', note: '24/7, call or text' },
      { name: 'SAMHSA National Helpline', phone: '1-800-662-4357', url: 'https://www.samhsa.gov/find-help/helplines/national-helpline', note: '24/7, treatment referral' },
    ],
  },
  CA: {
    emergency: '911',
    language: 'en',
    helplines: [{ name: '9-8-8 Suicide Crisis Helpline', phone: '988', url: 'https://988.ca', note: '24/7, call or text' }],
  },
  GB: {
    emergency: '999',
    language: 'en',
    helplines: [
      { name: 'Samaritans', phone: '116 123', url: 'https://www.samaritans.org', note: '24/7, free' },
      { name: 'NHS 111 (mental health option)', phone: '111', url: 'https://111.nhs.uk' },
    ],
  },
  IE: {
    emergency: '112',
    language: 'en',
    helplines: [{ name: 'Samaritans Ireland', phone: '116 123', url: 'https://www.samaritans.org/ireland', note: '24/7, free' }],
  },
  AU: {
    emergency: '000',
    language: 'en',
    helplines: [{ name: 'Lifeline Australia', phone: '13 11 14', url: 'https://www.lifeline.org.au', note: '24/7' }],
  },
  NZ: {
    emergency: '111',
    language: 'en',
    helplines: [{ name: 'Need to Talk? 1737', phone: '1737', url: 'https://1737.org.nz', note: '24/7, call or text' }],
  },
  DE: {
    emergency: '112',
    language: 'de',
    helplines: [{ name: 'TelefonSeelsorge', phone: '0800 111 0 111', url: 'https://www.telefonseelsorge.de', note: '24/7, kostenlos' }],
  },
  FR: {
    emergency: '112',
    language: 'fr',
    helplines: [{ name: '3114 – Numéro national de prévention du suicide', phone: '3114', url: 'https://3114.fr', note: '24/7' }],
  },
  ES: {
    emergency: '112',
    language: 'es',
    helplines: [{ name: 'Línea 024 de atención a la conducta suicida', phone: '024', url: 'https://www.sanidad.gob.es/linea024/home.htm', note: '24/7' }],
  },
  PT: {
    emergency: '112',
    language: 'pt',
    helplines: [
      { name: 'Linha 1411', phone: '1411' },
      { name: 'SNS 24 – Aconselhamento psicológico', phone: '808 24 24 24', url: 'https://www.sns24.gov.pt', note: '24/7' },
    ],
  },
  BR: {
    emergency: '192',
    language: 'pt',
    helplines: [{ name: 'CVV – Centro de Valorização da Vida', phone: '188', url: 'https://cvv.org.br', note: '24/7, gratuito' }],
  },
  MX: {
    emergency: '911',
    language: 'es',
    helplines: [{ name: 'SAPTEL', phone: '55 5259 8121', url: 'https://www.saptel.org.mx', note: '24/7' }],
  },
  AR: {
    emergency: '911',
    language: 'es',
    helplines: [{ name: 'Salud Mental Responde (Ministerio de Salud)', phone: '0800 999 0091', url: 'https://www.argentina.gob.ar/salud/mental-y-adicciones' }],
  },
  CO: {
    emergency: '123',
    language: 'es',
    helplines: [{ name: 'Línea 106 Nacional de Salud Mental', phone: '106', url: 'https://www.minsalud.gov.co' }],
  },
  CL: {
    emergency: '131',
    language: 'es',
    helplines: [{ name: 'Línea *4141 Prevención del Suicidio', phone: '*4141', url: 'https://www.gob.cl', note: '24/7' }],
  },
  PH: {
    emergency: '911',
    language: 'en',
    helplines: [{ name: 'NCMH Crisis Hotline', phone: '1553', url: 'https://ncmh.gov.ph', note: '24/7' }],
  },
  ID: {
    emergency: '112',
    language: 'id',
    helplines: [{ name: 'SEJIWA (Kemenkes)', phone: '119', url: 'https://www.kemkes.go.id', note: 'tekan 8' }],
  },
  MY: {
    emergency: '999',
    language: 'en',
    helplines: [{ name: 'Talian HEAL', phone: '15555', url: 'https://www.moh.gov.my' }],
  },
  SG: {
    emergency: '995',
    language: 'en',
    helplines: [{ name: 'Samaritans of Singapore', phone: '1767', url: 'https://www.sos.org.sg', note: '24/7' }],
  },
  PK: {
    emergency: '1122',
    language: 'ur',
    helplines: [{ name: 'Umang Pakistan', phone: '0304 111 1741', url: 'https://www.umang.com.pk' }],
  },
  BD: {
    emergency: '999',
    language: 'bn',
    helplines: [{ name: 'Kaan Pete Roi', phone: '09638 881 888', url: 'https://www.kaanpeteroi.org' }],
  },
  NG: {
    emergency: '112',
    language: 'en',
    helplines: [{ name: 'SURPIN (Lifeline Nigeria)', phone: '0800 078 7746', url: 'https://lifeline-international.com/member/nigeria-surpin/' }],
  },
  KE: {
    emergency: '999',
    language: 'en',
    helplines: [{ name: 'Befrienders Kenya', phone: '0722 178 177', url: 'https://www.befrienders.org' }],
  },
  ZA: {
    emergency: '112',
    language: 'en',
    helplines: [{ name: 'SADAG Suicide Crisis Line', phone: '0800 567 567', url: 'https://www.sadag.org', note: '24/7' }],
  },
  EG: {
    emergency: '123',
    language: 'ar',
    helplines: [{ name: 'General Secretariat of Mental Health hotline', phone: '16328' }],
  },
  SA: {
    emergency: '911',
    language: 'ar',
    helplines: [{ name: 'Psychological Counseling Contact Center', phone: '920033360' }],
  },
  AE: {
    emergency: '999',
    language: 'ar',
    helplines: [{ name: 'National Mental Support Line (Hope)', phone: '800 4673', url: 'https://mohap.gov.ae' }],
  },
  JP: {
    emergency: '119',
    language: 'ja',
    helplines: [{ name: '#いのちSOS', phone: '0120-061-338', url: 'https://www.lifelink.or.jp/inochisos/', note: '24/7' }],
  },
  CN: {
    emergency: '120',
    language: 'zh',
    helplines: [{ name: '12355 青少年服务台', phone: '12355' }],
  },
  RU: {
    emergency: '112',
    language: 'ru',
    helplines: [{ name: 'Телефон доверия', phone: '8 495 989-50-50' }],
  },
  IT: {
    emergency: '112',
    language: 'en',
    helplines: [{ name: 'Telefono Amico Italia', url: 'https://www.telefonoamico.it' }],
  },
  NL: {
    emergency: '112',
    language: 'en',
    helplines: [{ name: '113 Zelfmoordpreventie', phone: '0800 0113', url: 'https://www.113.nl', note: '24/7, gratis' }],
  },
};

/** Recovery communities that run meetings worldwide, online and in person. */
export const GLOBAL_RESOURCES: Helpline[] = [
  { name: 'Find A Helpline (every country)', url: 'https://findahelpline.com' },
  { name: 'Sex Addicts Anonymous (SAA)', url: 'https://saa-recovery.org' },
  { name: 'Sex and Love Addicts Anonymous (SLAA)', url: 'https://slaafws.org' },
  { name: 'Sexaholics Anonymous (SA)', url: 'https://www.sa.org' },
  { name: 'Fight the New Drug', url: 'https://fightthenewdrug.org' },
];

export const DEFAULT_REGION: Region = { emergency: '112', language: 'en', helplines: [] };

export function regionFor(country: string): Region {
  return REGIONS[country] ?? DEFAULT_REGION;
}

/** findahelpline.com lists verified services for every country. */
export function findAHelplineUrl(country: string) {
  return `https://findahelpline.com/countries/${country.toLowerCase()}`;
}

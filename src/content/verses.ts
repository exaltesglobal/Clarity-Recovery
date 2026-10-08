import { dayOfYear } from '../lib/date';

export interface Verse {
  text: string;
  ref: string;
}

// King James Version (public domain).
export const VERSES: Verse[] = [
  {
    ref: '1 Corinthians 10:13',
    text: 'There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it.',
  },
  { ref: 'Philippians 4:13', text: 'I can do all things through Christ which strengtheneth me.' },
  { ref: 'Psalm 51:10', text: 'Create in me a clean heart, O God; and renew a right spirit within me.' },
  { ref: 'Galatians 5:16', text: 'This I say then, Walk in the Spirit, and ye shall not fulfil the lust of the flesh.' },
  {
    ref: '2 Timothy 2:22',
    text: 'Flee also youthful lusts: but follow righteousness, faith, charity, peace, with them that call on the Lord out of a pure heart.',
  },
  {
    ref: 'Romans 12:2',
    text: 'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
  },
  { ref: 'Matthew 5:8', text: 'Blessed are the pure in heart: for they shall see God.' },
  {
    ref: 'Isaiah 40:31',
    text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
  },
  { ref: 'James 4:7', text: 'Submit yourselves therefore to God. Resist the devil, and he will flee from you.' },
  {
    ref: '2 Corinthians 5:17',
    text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
  },
  {
    ref: 'Psalm 34:18',
    text: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
  },
  { ref: 'Proverbs 4:23', text: 'Keep thy heart with all diligence; for out of it are the issues of life.' },
  { ref: 'Psalm 119:37', text: 'Turn away mine eyes from beholding vanity; and quicken thou me in thy way.' },
  {
    ref: 'Psalm 119:9',
    text: 'Wherewithal shall a young man cleanse his way? by taking heed thereto according to thy word.',
  },
];

/** Verses offering grace after a relapse. */
export const GRACE_VERSES: Verse[] = [
  {
    ref: '1 John 1:9',
    text: 'If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.',
  },
  {
    ref: 'Lamentations 3:22-23',
    text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
  },
];

export function verseOfTheDay(date = new Date()): Verse {
  return VERSES[dayOfYear(date) % VERSES.length];
}

/** A verse as it should be read aloud: reference first, then the text. */
export function verseSpeech(verse: Verse) {
  return `${verse.ref}. ${verse.text}`;
}

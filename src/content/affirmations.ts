import { dayOfYear } from '../lib/date';

export const AFFIRMATIONS = [
  'An urge is a wave. It rises, peaks, and passes — you do not have to act on it.',
  'Every day you choose differently, your brain rewires a little more.',
  'You are not your urges. You are the one who notices them.',
  'Progress, not perfection. One honest day at a time.',
  'The discomfort you feel right now is your brain healing.',
  'You are building a life you will not want to escape from.',
  'Real connection beats a screen every single time.',
  'Boredom, stress and loneliness are signals — not commands.',
  'You have survived every hard moment so far. This one too.',
  'Small choices, repeated daily, become who you are.',
  'Rest, move, eat well, reach out. Take care of the body your mind lives in.',
  'Shame keeps you stuck. Compassion helps you move forward.',
];

export const RELAPSE_MESSAGE =
  'A slip does not erase your progress. The days you stayed strong still rewired your brain. ' +
  'Be honest about what happened, learn from it, and begin again — right now.';

export function affirmationOfTheDay(date = new Date()): string {
  return AFFIRMATIONS[dayOfYear(date) % AFFIRMATIONS.length];
}

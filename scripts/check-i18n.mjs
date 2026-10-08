#!/usr/bin/env node
/**
 * Checks translations:
 *  - every t('key') used in src/ exists in en.json (templates must match at least one key)
 *  - every guided session has one text entry per timed step
 *  - every other locale has the same keys and {{placeholders}} as English
 * Usage: node scripts/check-i18n.mjs [--strict]   (--strict fails on missing translations)
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const localesDir = path.join(root, 'src/i18n/locales');
const strict = process.argv.includes('--strict');
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
let errors = 0;
const fail = (msg) => {
  errors++;
  console.error('✗ ' + msg);
};

/** Flattens nested objects to dotted keys; arrays are leaves. */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const enFlat = flatten(en);
const enKeys = Object.keys(enFlat);
const PLURAL = /_(zero|one|two|few|many|other)$/;
const baseKeys = new Set(enKeys.map((k) => k.replace(PLURAL, '')));
// Arrays and objects requested with returnObjects are valid prefixes too.
const prefixes = new Set(enKeys.flatMap((k) => k.split('.').map((_, i, parts) => parts.slice(0, i + 1).join('.'))));

// 1. Keys used in code
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : /\.(tsx?|jsx?)$/.test(d.name) ? [path.join(dir, d.name)] : [],
  );
}
const used = new Map();
for (const file of walk(path.join(root, 'src'))) {
  const src = fs.readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\b(?:t|tr)\(\s*(['`])([^'`]+)\1/g)) used.set(m[2], path.relative(root, file));
}
for (const [key, file] of used) {
  if (key.includes('${')) {
    const re = new RegExp('^' + key.replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\$\{[^}]+\}/g, '[^.]+') + '$');
    if (![...prefixes].some((k) => re.test(k))) fail(`${file}: no key matches template "${key}"`);
  } else if (!baseKeys.has(key) && !prefixes.has(key)) {
    fail(`${file}: missing key "${key}" in en.json`);
  }
}

// 2. Session steps match their timings
const wellness = fs.readFileSync(path.join(root, 'src/content/wellness.ts'), 'utf8');
for (const m of wellness.matchAll(/id: '([^']+)',\s*category:[\s\S]*?steps: \[([^\]]*)\]/g)) {
  const [, id, steps] = m;
  const count = steps.split(',').filter((s) => s.trim()).length;
  const text = en.sessions?.[id]?.steps;
  if (!text) fail(`en.json: sessions.${id} is missing`);
  else if (text.length !== count) fail(`en.json: sessions.${id} has ${text.length} step texts but ${count} timed steps`);
}

// 3. Other locales
const placeholders = (s) => [...String(s).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort().join(',');
// Plural forms may spell out the number ("one day"), so {{count}} is optional.
const withoutCount = (s) => placeholders(s).split(',').filter((p) => p && p !== 'count').join(',');
for (const file of fs.readdirSync(localesDir).filter((f) => f.endsWith('.json') && f !== 'en.json')) {
  const lang = file.replace('.json', '');
  const flat = flatten(JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8')));
  const flatBase = new Set(Object.keys(flat).map((k) => k.replace(PLURAL, '')));
  const missing = [...baseKeys].filter((k) => !flatBase.has(k));
  const extra = Object.keys(flat).filter((k) => !baseKeys.has(k.replace(PLURAL, '')));
  for (const k of extra) fail(`${file}: unknown key "${k}"`);
  for (const [k, v] of Object.entries(flat)) {
    const enValue = enFlat[k] ?? enFlat[k.replace(PLURAL, '_other')];
    if (enValue === undefined) continue;
    if (Array.isArray(enValue)) {
      if (!Array.isArray(v) || v.length !== enValue.length) fail(`${file}: "${k}" should have ${enValue.length} items`);
      else
        v.forEach((item, i) => {
          if (typeof item === 'string' && placeholders(item) !== placeholders(enValue[i]))
            fail(`${file}: placeholders differ in "${k}[${i}]"`);
          if (item && typeof item === 'object')
            for (const f of Object.keys(enValue[i])) if (!(f in item)) fail(`${file}: "${k}[${i}].${f}" missing`);
        });
    } else if (typeof v === 'string' && withoutCount(v) !== withoutCount(enValue)) {
      fail(`${file}: placeholders differ in "${k}" (${placeholders(v)} vs ${placeholders(enValue)})`);
    }
  }
  const pct = Math.round(((baseKeys.size - missing.length) / baseKeys.size) * 100);
  console.log(`${lang}: ${pct}% translated${missing.length ? ` (${missing.length} keys fall back to English)` : ''}`);
  if (strict && missing.length) fail(`${file}: ${missing.length} missing keys, e.g. ${missing.slice(0, 5).join(', ')}`);
}

console.log(`${used.size} keys used in code, ${baseKeys.size} keys in en.json`);
if (errors) {
  console.error(`\n${errors} problem(s) found`);
  process.exit(1);
}
console.log('✓ translations OK');

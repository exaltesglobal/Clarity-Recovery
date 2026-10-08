import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { COUNTRY_CODES, countryName, flag } from '../content/countries';
import { LANGUAGES } from '../i18n';
import { Field, Option } from './ui';

export function LanguagePicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      {LANGUAGES.map((l) => (
        <Option
          key={l.code}
          label={l.native}
          description={l.native === l.english ? undefined : l.english}
          selected={value === l.code}
          onPress={() => onChange(l.code)}
        />
      ))}
    </View>
  );
}

export function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const lang = i18n.language;

  const items = useMemo(() => {
    const all = COUNTRY_CODES.map((code) => ({
      code,
      name: countryName(code, lang),
      english: countryName(code, 'en'),
    })).sort((a, b) => a.name.localeCompare(b.name, lang));
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter((c) => c.name.toLowerCase().includes(q) || c.english.toLowerCase().includes(q) || c.code.toLowerCase() === q)
      : all;
    // Keep the current selection at the top so it is always visible.
    const selected = filtered.find((c) => c.code === value);
    return selected ? [selected, ...filtered.filter((c) => c.code !== value)] : filtered;
  }, [query, lang, value]);

  return (
    <View style={{ gap: 8 }}>
      <Field
        value={query}
        onChangeText={setQuery}
        placeholder={t('onboarding.countrySearch')}
        autoCorrect={false}
        accessibilityLabel={t('onboarding.countrySearch')}
      />
      {items.slice(0, query ? 60 : 30).map((c) => (
        <Option
          key={c.code}
          label={`${flag(c.code)}  ${c.name}`}
          selected={value === c.code}
          onPress={() => onChange(c.code)}
        />
      ))}
    </View>
  );
}

import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { PremiumGate } from '../components/Premium';
import { Body, Button, Card, Chip, ChipRow, H2, IconBadge, ListRow, Muted, Screen } from '../components/ui';
import { openUrl } from '../lib/contact';
import { type AnalysisResult, analyze, type Confidence, extractFollowing } from '../lib/instagram';
import { useTheme } from '../theme';

async function readBytes(asset: DocumentPicker.DocumentPickerAsset): Promise<Uint8Array> {
  if (asset.file) return new Uint8Array(await asset.file.arrayBuffer());
  return new File(asset.uri).bytes();
}

export default function InstagramAnalyzer() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [filter, setFilter] = useState<Confidence | 'all'>('all');

  const pick = async () => {
    setError(null);
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/zip', 'application/json', 'text/html', 'application/octet-stream'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets[0]) return;
    setBusy(true);
    try {
      const asset = picked.assets[0];
      const usernames = extractFollowing(await readBytes(asset), asset.name);
      if (usernames.length === 0) throw new Error('empty');
      setResult(analyze(usernames));
    } catch {
      setResult(null);
      setError(tr('instagram.error'));
    } finally {
      setBusy(false);
    }
  };

  const shown = result?.flagged.filter((f) => filter === 'all' || f.confidence === filter) ?? [];
  const likely = result?.flagged.filter((f) => f.confidence === 'likely').length ?? 0;

  return (
    <Screen>
      <PremiumGate feature={tr('instagram.title')}>
        <Card style={{ alignItems: 'center' }}>
          <IconBadge icon="logo-instagram" size={56} />
          <H2 center>{tr('instagram.heading')}</H2>
          <Body center>{tr('instagram.body')}</Body>
        </Card>

        {!result && (
          <Card>
            <H2>{tr('instagram.howTitle')}</H2>
            {(tr('instagram.steps', { returnObjects: true }) as string[]).map((s, i) => (
              <View key={s} style={{ flexDirection: 'row', gap: 10 }}>
                <Muted style={{ color: t.primary, minWidth: 18 }}>{i + 1}.</Muted>
                <Body style={{ flex: 1 }}>{s}</Body>
              </View>
            ))}
            <Button small variant="ghost" icon="open-outline" title={tr('instagram.openAccountsCenter')} onPress={() => openUrl('https://accountscenter.instagram.com/info_and_permissions/dyi/')} />
          </Card>
        )}

        <Button title={result ? tr('instagram.chooseAnother') : tr('instagram.choose')} icon="document-attach-outline" onPress={pick} disabled={busy} />
        {busy && <ActivityIndicator color={t.primary} />}
        {error && (
          <Card variant="danger">
            <Body>{error}</Body>
          </Card>
        )}

        {result && (
          <>
            <Card variant={likely > 0 ? 'gold' : 'soft'}>
              <H2>{tr('instagram.summary', { total: result.total, count: result.flagged.length })}</H2>
              <Body>{result.flagged.length > 0 ? tr('instagram.summaryAdvice') : tr('instagram.summaryClean')}</Body>
              <Muted>{tr('instagram.heuristicNote')}</Muted>
            </Card>
            {result.flagged.length > 0 && (
              <ChipRow>
                {(['all', 'likely', 'possible'] as const).map((f) => (
                  <Chip key={f} label={tr(`instagram.filter.${f}`)} selected={filter === f} onPress={() => setFilter(f)} />
                ))}
              </ChipRow>
            )}
            {shown.length > 0 && (
              <Card>
                {shown.map((f) => (
                  <ListRow
                    key={f.username}
                    icon={f.confidence === 'likely' ? 'alert-circle-outline' : 'help-circle-outline'}
                    iconColor={f.confidence === 'likely' ? t.danger : t.gold}
                    title={`@${f.username}`}
                    subtitle={tr(`instagram.confidence.${f.confidence}`, { keyword: f.reason })}
                    onPress={() => openUrl(`https://www.instagram.com/${f.username}/`)}
                  />
                ))}
              </Card>
            )}
          </>
        )}

        <Muted center>{tr('instagram.privacy')}</Muted>
      </PremiumGate>
    </Screen>
  );
}

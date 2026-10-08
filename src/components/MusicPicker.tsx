import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { isDownloaded, trackSource, trackTitle, useMusicLibrary, type Track } from '../lib/music';
import { useBackgroundMusic } from '../lib/sounds';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';
import { Button, Card, Chip, ChipRow, H2, ListRow, Muted } from './ui';

const VOLUMES = [
  { id: 'soft', volume: 0.3 },
  { id: 'medium', volume: 0.5 },
  { id: 'loud', volume: 0.8 },
] as const;

/** Background music: pick a track (downloading it first), set its volume and preview it. */
export function MusicPicker() {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const { data, actions } = useStore();
  const { sound } = data;
  const library = useMusicLibrary();
  const [previewing, setPreviewing] = useState(false);

  const selected = library.tracks.find((m) => m.id === sound.music);
  useBackgroundMusic(trackSource(selected), previewing, sound.musicVolume);

  const megabytes = (bytes: number) => (bytes / 1e6).toLocaleString(i18n.language, { maximumFractionDigits: 1 });

  const choose = async (track: Track) => {
    const ok = await library.download(track);
    if (!ok) return;
    actions.setSound({ music: track.id, musicOn: true });
    setPreviewing(true);
  };

  const status = (track: Track) => {
    const d = library.downloads[track.id];
    if (d?.status === 'downloading') return tr('sound.downloading', { percent: Math.round(d.progress * 100) });
    if (d?.status === 'failed') return tr('sound.downloadFailed');
    if (library.streamOnly) return undefined;
    return isDownloaded(track) ? tr('sound.downloaded') : tr('sound.size', { size: megabytes(track.bytes) });
  };

  const icon = (track: Track) => {
    if (library.downloads[track.id]?.status === 'downloading') return <ActivityIndicator color={t.primary} />;
    if (track.id === sound.music && isDownloaded(track)) return <Ionicons name="checkmark-circle" size={22} color={t.primary} />;
    if (isDownloaded(track)) return <Ionicons name="play-circle-outline" size={22} color={t.muted} />;
    return <Ionicons name="cloud-download-outline" size={22} color={t.muted} />;
  };

  return (
    <Card>
      <H2>{tr('sound.music')}</H2>
      <Muted>{library.streamOnly ? tr('sound.musicBodyWeb') : tr('sound.musicBody')}</Muted>
      <ListRow
        icon="volume-mute-outline"
        title={tr('sound.none')}
        right={!selected ? <Ionicons name="checkmark-circle" size={22} color={t.primary} /> : <></>}
        onPress={() => {
          setPreviewing(false);
          actions.setSound({ music: null });
        }}
      />
      {library.tracks.map((track) => (
        <ListRow
          key={track.id}
          icon="musical-notes-outline"
          title={trackTitle(track, i18n.language)}
          subtitle={status(track)}
          right={icon(track)}
          onPress={() => choose(track)}
        />
      ))}

      {selected && (
        <>
          <H2>{tr('sound.volume')}</H2>
          <ChipRow>
            {VOLUMES.map((v) => (
              <Chip
                key={v.id}
                label={tr(`sound.volumes.${v.id}`)}
                selected={sound.musicVolume === v.volume}
                onPress={() => actions.setSound({ musicVolume: v.volume })}
              />
            ))}
          </ChipRow>
          {isDownloaded(selected) && (
            <Button
              variant="secondary"
              icon={previewing ? 'stop' : 'play'}
              title={previewing ? tr('sound.stop') : tr('sound.previewMusic')}
              onPress={() => setPreviewing(!previewing)}
            />
          )}
        </>
      )}

      {library.downloadedBytes > 0 && (
        <Button
          variant="ghost"
          small
          icon="trash-outline"
          title={tr('sound.removeDownloads', { size: megabytes(library.downloadedBytes) })}
          onPress={() => {
            setPreviewing(false);
            library.removeAll();
          }}
        />
      )}
    </Card>
  );
}

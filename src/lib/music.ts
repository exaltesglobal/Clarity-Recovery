import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import bundledCatalogue from '../../content/music.json';

/**
 * Background music for guided sessions. Tracks aren't shipped in the app: the catalogue
 * (`extra.musicCatalogUrl`, content/music.json in the repo) lists them, and each one downloads
 * when the user picks it. Tracks can be added or replaced by editing the catalogue, without an
 * app update. See content/README.md for the format.
 */

export interface Track {
  id: string;
  /** English name */
  title: string;
  /** Names by app language code */
  i18n?: Record<string, string>;
  /** URL of the audio, absolute or relative to the catalogue */
  file: string;
  bytes: number;
  seconds: number;
  /** Bump to make apps download the file again after it changes */
  version: number;
  license?: string;
}

const CATALOGUE_URL: string | undefined = Constants.expoConfig?.extra?.musicCatalogUrl;
const CACHE_KEY = 'clarity:music:v1';
// Browsers can't save files, so on web the tracks stream instead.
const STREAM_ONLY = Platform.OS === 'web';

export function trackTitle(track: Track, language: string) {
  return track.i18n?.[language] ?? track.title;
}

export function trackUrl(track: Track) {
  return CATALOGUE_URL ? new URL(track.file, CATALOGUE_URL).toString() : track.file;
}

function folder() {
  return new Directory(Paths.document, 'music');
}

function localFile(track: Track) {
  return new File(folder(), `${track.id}-v${track.version}.m4a`);
}

export function isDownloaded(track: Track) {
  if (STREAM_ONLY) return true;
  try {
    return localFile(track).exists;
  } catch {
    return false;
  }
}

/** What to hand the audio player: the downloaded file, or on web the stream URL. */
export function trackSource(track: Track | undefined) {
  if (!track) return null;
  if (STREAM_ONLY) return trackUrl(track);
  return isDownloaded(track) ? localFile(track).uri : null;
}

function validTracks(json: unknown): Track[] {
  const tracks = (json as { tracks?: unknown })?.tracks;
  if (!Array.isArray(tracks)) return [];
  return tracks.filter((t): t is Track => typeof t?.id === 'string' && typeof t?.file === 'string' && typeof t?.title === 'string');
}

let memory: Track[] | null = null;

async function loadCatalogue(): Promise<Track[]> {
  if (memory) return memory;
  let cached = validTracks(bundledCatalogue);
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const saved = raw ? validTracks(JSON.parse(raw)) : [];
    if (saved.length) cached = saved;
  } catch {}
  if (!CATALOGUE_URL) return (memory = cached);
  try {
    // No custom headers: on web they trigger a CORS preflight that GitHub's raw file server rejects.
    const res = await fetch(CATALOGUE_URL);
    if (!res.ok) throw new Error(String(res.status));
    const fresh = validTracks(await res.json());
    if (fresh.length === 0) throw new Error('empty catalogue');
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ tracks: fresh })).catch(() => {});
    return (memory = fresh);
  } catch {
    return (memory = cached);
  }
}

/** Removes files for tracks that are no longer in the catalogue or have a newer version. */
function pruneDownloads(tracks: Track[]) {
  if (STREAM_ONLY) return;
  try {
    const dir = folder();
    if (!dir.exists) return;
    const keep = new Set(tracks.map((t) => localFile(t).name));
    for (const item of dir.list()) {
      if (item instanceof File && !keep.has(item.name)) item.delete();
    }
  } catch {}
}

export type DownloadState = { status: 'idle' } | { status: 'downloading'; progress: number } | { status: 'failed' };

/** The catalogue plus what's downloaded on this phone, with download and remove actions. */
export function useMusicLibrary() {
  const [tracks, setTracks] = useState<Track[]>(() => memory ?? validTracks(bundledCatalogue));
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});
  // Bumped after a download or removal so isDownloaded() is read again.
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let live = true;
    loadCatalogue().then((list) => {
      if (!live) return;
      setTracks(list);
      pruneDownloads(list);
    });
    return () => {
      live = false;
    };
  }, []);

  const download = useCallback(async (track: Track) => {
    if (STREAM_ONLY || isDownloaded(track)) return true;
    setDownloads((d) => ({ ...d, [track.id]: { status: 'downloading', progress: 0 } }));
    // Download under a temporary name so a broken download never looks finished.
    const partial = new File(folder(), `${track.id}.part`);
    try {
      folder().create({ idempotent: true, intermediates: true });
      await File.downloadFileAsync(trackUrl(track), partial, {
        idempotent: true,
        onProgress: ({ bytesWritten, totalBytes }) => {
          const total = totalBytes > 0 ? totalBytes : track.bytes;
          setDownloads((d) => ({ ...d, [track.id]: { status: 'downloading', progress: Math.min(1, bytesWritten / total) } }));
        },
      });
      partial.move(localFile(track));
      setDownloads((d) => ({ ...d, [track.id]: { status: 'idle' } }));
      setRevision((r) => r + 1);
      return true;
    } catch {
      try {
        if (partial.exists) partial.delete();
      } catch {}
      setDownloads((d) => ({ ...d, [track.id]: { status: 'failed' } }));
      return false;
    }
  }, []);

  const removeAll = useCallback(() => {
    try {
      const dir = folder();
      if (dir.exists) dir.delete();
    } catch {}
    setRevision((r) => r + 1);
  }, []);

  const downloadedBytes = STREAM_ONLY ? 0 : tracks.filter(isDownloaded).reduce((sum, t) => sum + t.bytes, 0);

  return { tracks, downloads, download, removeAll, downloadedBytes, revision, streamOnly: STREAM_ONLY };
}

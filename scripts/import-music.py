#!/usr/bin/env python3
"""Prepares a music file for the app and adds it to content/music.json.

    python3 scripts/import-music.py <source audio> <id> "<English title>" [--license "..."]

The source can be any format ffmpeg reads (MP3, WAV, FLAC...). The script:
  - trims silence from the start and end, so the loop restarts without a gap,
  - fades in and out, so the track flows back into itself when it loops,
  - levels it to the same loudness as the other tracks (-21 LUFS),
  - encodes it as AAC (.m4a, 128 kbps stereo), which plays on every platform,
  - writes content/music/<id>.m4a and adds or updates its entry in content/music.json.
Re-importing an existing id keeps its title and translations and bumps its version, so phones
download the new file. Add translated names under "i18n" in music.json by hand.

Needs numpy and ffmpeg.
"""

import argparse
import json
import os
import subprocess
import tempfile
import wave

import numpy as np

RATE = 44100
TARGET_LUFS = -21
SILENCE_DB = -55
FADE_IN = 1.5
FADE_OUT = 3.0
ROOT = os.path.join(os.path.dirname(__file__), '..', 'content')


def decode(path):
    raw = subprocess.run(
        ['ffmpeg', '-nostdin', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(RATE), '-f', 'f32le', '-'],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)


def write_wav(x, path):
    with wave.open(path, 'wb') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def loudness(path):
    out = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(out.rsplit('I:', 1)[1].split('LUFS')[0])


def prepare(x):
    level = np.abs(x).max(axis=1)
    audible = np.nonzero(level > 10 ** (SILENCE_DB / 20))[0]
    x = x[audible[0] : audible[-1] + 1].copy()
    fade_in = int(FADE_IN * RATE)
    fade_out = int(FADE_OUT * RATE)
    x[:fade_in] *= np.linspace(0, 1, fade_in)[:, None] ** 2
    x[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None] ** 2
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        write_wav(x, tmp.name)
        x *= 10 ** ((TARGET_LUFS - loudness(tmp.name)) / 20)
    peak = np.abs(x).max()
    if peak > 0.89:  # keep peaks under -1 dBFS
        x *= 0.89 / peak
    return x


def encode(x, path):
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        write_wav(x, tmp.name)
        subprocess.run(
            ['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', tmp.name, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-map_metadata', '-1', path],
            check=True,
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('id')
    parser.add_argument('title')
    parser.add_argument('--license', default=None)
    args = parser.parse_args()

    os.makedirs(os.path.join(ROOT, 'music'), exist_ok=True)
    out = os.path.join(ROOT, 'music', f'{args.id}.m4a')
    x = prepare(decode(args.source))
    encode(x, out)

    catalogue_path = os.path.join(ROOT, 'music.json')
    with open(catalogue_path) as f:
        catalogue = json.load(f)
    tracks = catalogue['tracks']
    entry = next((t for t in tracks if t['id'] == args.id), None)
    if entry is None:
        entry = {'id': args.id, 'title': args.title, 'i18n': {}, 'version': 0}
        tracks.append(entry)
    entry.update({
        'file': f'music/{args.id}.m4a',
        'bytes': os.path.getsize(out),
        'seconds': round(len(x) / RATE),
        'version': entry.get('version', 0) + 1,
    })
    if args.license:
        entry['license'] = args.license
    with open(catalogue_path, 'w') as f:
        json.dump(catalogue, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f'{args.id}: {len(x) / RATE / 60:.1f} min, {os.path.getsize(out) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()

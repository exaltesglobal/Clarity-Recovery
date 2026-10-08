#!/usr/bin/env python3
"""Composes the background music loops into content/music/ and writes content/music.json.

Every track is synthesized here, so the app owns it outright: there is nothing to license.
Each loop is built to repeat exactly (noise is shaped in the frequency domain, tones use whole
numbers of cycles per loop, and events that run past the end wrap round to the start), so the
seam is inaudible when the player loops.

Needs numpy and ffmpeg (with the built-in AAC encoder). Run from the repo root:
    python3 scripts/make-music.py
"""

import json
import os
import subprocess
import tempfile
import wave

import numpy as np

RATE = 44100
# About three minutes, rounded to whole 1024-sample AAC frames. The encoder pads the last frame
# otherwise, and that padding would click at the loop point.
N = 1024 * round(180 * RATE / 1024)
SECONDS = N / RATE
TARGET_LUFS = -21
ROOT = os.path.join(os.path.dirname(__file__), '..', 'content')
OUT = os.path.join(ROOT, 'music')
rng = np.random.default_rng(7)
t = np.arange(N) / RATE


def loop_freq(f):
    """Nearest frequency with a whole number of cycles per loop, so the waveform joins up."""
    return round(f * SECONDS) / SECONDS


def shaped_noise(slope, low=20.0, high=20000.0):
    """Loopable noise with a 1/f^slope spectrum between low and high Hz (FFT noise is circular)."""
    spectrum = np.fft.rfft(rng.standard_normal(N))
    f = np.fft.rfftfreq(N, 1 / RATE)
    gain = np.zeros_like(f)
    band = (f >= low) & (f <= high)
    gain[band] = 1 / np.power(f[band], slope / 2)
    # Soft edges on the band avoid ringing.
    gain *= 1 / (1 + (low / np.maximum(f, 1e-6)) ** 4) / (1 + (f / high) ** 4)
    x = np.fft.irfft(spectrum * gain, N)
    return x / np.max(np.abs(x))


def slow_lfo(cycles, depth, phase=0.0):
    """1 +/- depth, completing a whole number of cycles per loop."""
    return 1 + depth * np.sin(2 * np.pi * cycles * t / SECONDS + phase)


def add_event(buf, start, sig):
    """Adds sig at sample `start`, wrapping whatever runs past the end back to the beginning."""
    start %= N
    end = start + len(sig)
    if end <= N:
        buf[start:end] += sig
    else:
        cut = N - start
        buf[start:] += sig[:cut]
        buf[: end - N] += sig[cut:]


def tone(partials, seconds, attack=0.005):
    """partials: (frequency, amplitude, decay seconds)."""
    n = int(seconds * RATE)
    tt = np.arange(n) / RATE
    sig = sum(a * np.exp(-tt / d) * np.sin(2 * np.pi * f * tt + rng.uniform(0, 2 * np.pi)) for f, a, d in partials)
    sig *= np.minimum(1, tt / attack)
    sig *= np.minimum(1, (n - np.arange(n)) / (0.05 * RATE))
    return sig


def pan(sig, p):
    """Equal-power pan, p from -1 (left) to 1 (right)."""
    a = (p + 1) * np.pi / 4
    return np.cos(a) * sig, np.sin(a) * sig


def pad(freqs, gain=1.0, seed_phase=0.0):
    """Slowly breathing chord: each note is two detuned sines with its own swell."""
    left = np.zeros(N)
    right = np.zeros(N)
    for i, f in enumerate(freqs):
        swell = slow_lfo(rng.integers(3, 8), 0.35, rng.uniform(0, 6.3))
        amp = gain / (1 + i * 0.35)
        for ch, detune in ((left, -0.07), (right, 0.07)):
            for d in (detune, -detune / 2):
                ch += amp * swell * np.sin(2 * np.pi * loop_freq(f + d) * t + rng.uniform(0, 6.3) + seed_phase)
            # A quiet octave adds warmth.
            ch += 0.12 * amp * swell * np.sin(2 * np.pi * loop_freq(2 * f + detune) * t)
    return left, right


def rain():
    base_l = shaped_noise(1.0, 300, 9000)
    base_r = 0.6 * base_l + 0.4 * shaped_noise(1.0, 300, 9000)
    intensity = slow_lfo(4, 0.15) * slow_lfo(9, 0.06, 1.0)
    left, right = 0.35 * base_l * intensity, 0.35 * base_r * intensity
    # Close droplets: tiny bright plinks scattered across the stereo field.
    drops = np.zeros((2, N))
    for _ in range(int(SECONDS * 14)):
        f = rng.uniform(1800, 5200)
        sig = tone([(f, 1.0, rng.uniform(0.004, 0.012)), (f * 1.5, 0.3, 0.004)], 0.06, attack=0.0008)
        sig *= rng.uniform(0.04, 0.16)
        l, r = pan(sig, rng.uniform(-0.9, 0.9))
        start = int(rng.uniform(0, N))
        add_event(drops[0], start, l)
        add_event(drops[1], start, r)
    # Heavier drops on a gutter or leaf now and then.
    for _ in range(int(SECONDS // 2)):
        f = rng.uniform(500, 1100)
        sig = tone([(f, 1.0, 0.03), (f * 2.3, 0.3, 0.015)], 0.15, attack=0.001) * rng.uniform(0.08, 0.2)
        l, r = pan(sig, rng.uniform(-0.6, 0.6))
        start = int(rng.uniform(0, N))
        add_event(drops[0], start, l)
        add_event(drops[1], start, r)
    return left + drops[0], right + drops[1]


def ocean():
    rumble = shaped_noise(2.0, 30, 1200)
    hiss_l = shaped_noise(0.5, 900, 7000)
    hiss_r = 0.5 * hiss_l + 0.5 * shaped_noise(0.5, 900, 7000)
    # One envelope per breaking wave: a slow build, then a long wash back out.
    env_l = np.zeros(N)
    env_r = np.zeros(N)
    pos = 0
    while pos < N:
        rise, fall = rng.uniform(2.5, 4.0), rng.uniform(5.0, 7.5)
        n = int((rise + fall) * RATE)
        tt = np.arange(n) / RATE
        shape = np.where(tt < rise, np.sin(np.pi / 2 * tt / rise) ** 2, np.exp(-(tt - rise) / (fall / 3)))
        size = rng.uniform(0.6, 1.0)
        lag = int(rng.uniform(0.05, 0.35) * RATE)
        add_event(env_l, pos, shape * size)
        add_event(env_r, pos + lag, shape * size)
        pos += int(rng.uniform(7.0, 11.0) * RATE)
    left = 0.55 * rumble * (0.35 + 0.65 * env_l) + 0.3 * hiss_l * env_l**2
    right = 0.55 * rumble * (0.35 + 0.65 * env_r) + 0.3 * hiss_r * env_r**2
    return left, right


def drone():
    # D: root, fifth, octave, major third, fifth and a ninth on top.
    left, right = pad([73.42, 110.0, 146.83, 185.0, 220.0, 329.63], gain=0.5)
    air = shaped_noise(1.5, 200, 3000) * slow_lfo(5, 0.4) * 0.05
    left += air
    right += np.roll(air, RATE // 3)
    # A singing bowl every so often, far away.
    pos = int(rng.uniform(2, 8) * RATE)
    while pos < N:
        f = rng.choice([146.83, 220.0, 293.66])
        sig = tone([(f, 1.0, 3.5), (f * 1.008, 0.5, 3.5), (f * 2.76, 0.35, 1.8), (f * 5.4, 0.1, 0.8)], 9.0, attack=0.02)
        l, r = pan(sig * 0.18, rng.uniform(-0.5, 0.5))
        add_event(left, pos, l)
        add_event(right, pos, r)
        pos += int(rng.uniform(18, 30) * RATE)
    return left, right


def chimes():
    left, right = pad([130.81, 196.0, 329.63], gain=0.1)
    # C major pentatonic, the chime tubes of a wind chime.
    notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66]
    pos = int(rng.uniform(1, 4) * RATE)
    while pos < N:
        # A gust: a handful of tubes struck close together.
        for _ in range(rng.integers(2, 7)):
            f = rng.choice(notes)
            sig = tone([(f, 1.0, rng.uniform(2.5, 4.5)), (f * 2.76, 0.25, 1.2), (f * 5.4, 0.06, 0.4)], 6.0, attack=0.002)
            l, r = pan(sig * rng.uniform(0.1, 0.25), rng.uniform(-0.8, 0.8))
            start = pos + int(rng.uniform(0, 1.8) * RATE)
            add_event(left, start, l)
            add_event(right, start, r)
        pos += int(rng.uniform(6, 14) * RATE)
    return left, right


# Names shown in the app: English title plus translations by app language code.
TRACKS = [
    ('rain', rain, 'Soft rain', {
        'hi': 'हल्की बारिश', 'mr': 'हलका पाऊस', 'es': 'Lluvia suave', 'ar': 'مطر خفيف', 'pt': 'Chuva suave', 'zh': '细雨',
        'fr': 'Pluie douce', 'bn': 'মৃদু বৃষ্টি', 'ru': 'Тихий дождь', 'ur': 'ہلکی بارش', 'id': 'Hujan lembut', 'de': 'Sanfter Regen',
        'ja': 'やさしい雨',
    }),
    ('ocean', ocean, 'Ocean waves', {
        'hi': 'समुद्र की लहरें', 'mr': 'समुद्राच्या लाटा', 'es': 'Olas del mar', 'ar': 'أمواج البحر', 'pt': 'Ondas do mar', 'zh': '海浪',
        'fr': "Vagues de l'océan", 'bn': 'সমুদ্রের ঢেউ', 'ru': 'Морские волны', 'ur': 'سمندر کی لہریں', 'id': 'Ombak laut',
        'de': 'Meereswellen', 'ja': '波の音',
    }),
    ('drone', drone, 'Deep calm', {
        'hi': 'गहरी शांति', 'mr': 'खोल शांतता', 'es': 'Calma profunda', 'ar': 'هدوء عميق', 'pt': 'Calma profunda', 'zh': '深度宁静',
        'fr': 'Calme profond', 'bn': 'গভীর প্রশান্তি', 'ru': 'Глубокий покой', 'ur': 'گہرا سکون', 'id': 'Ketenangan dalam',
        'de': 'Tiefe Ruhe', 'ja': '深い静けさ',
    }),
    ('chimes', chimes, 'Wind chimes', {
        'hi': 'पवन घंटियाँ', 'mr': 'वाऱ्याच्या घंटा', 'es': 'Campanas de viento', 'ar': 'أجراس الرياح', 'pt': 'Sinos de vento',
        'zh': '风铃', 'fr': 'Carillons à vent', 'bn': 'উইন্ড চাইম', 'ru': 'Музыка ветра', 'ur': 'ہوا کی گھنٹیاں', 'id': 'Lonceng angin',
        'de': 'Windspiel', 'ja': 'ウィンドチャイム',
    }),
]


def write_wav(stereo, path):
    with wave.open(path, 'wb') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes((np.clip(stereo, -1, 1).T * 32767).astype('<i2').tobytes())


def loudness(path):
    """Integrated loudness in LUFS, measured by ffmpeg's EBU R128 filter."""
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(out.rsplit('I:', 1)[1].split('LUFS')[0])


def master(left, right):
    """Levels every track to the same perceived loudness, keeping peaks well below clipping."""
    stereo = np.stack([left, right])
    stereo -= stereo.mean(axis=1, keepdims=True)
    stereo *= 0.25 / np.max(np.abs(stereo))
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        write_wav(stereo, tmp.name)
        stereo *= 10 ** ((TARGET_LUFS - loudness(tmp.name)) / 20)
    peak = np.max(np.abs(stereo))
    if peak > 0.7:
        stereo *= 0.7 / peak
    return stereo


def encode(stereo, path):
    with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
        write_wav(stereo, tmp.name)
        subprocess.run(
            ['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', path],
            check=True,
        )


def main():
    os.makedirs(OUT, exist_ok=True)
    catalogue = []
    for track_id, compose, title, names in TRACKS:
        path = os.path.join(OUT, f'{track_id}.m4a')
        encode(master(*compose()), path)
        catalogue.append({
            'id': track_id,
            'title': title,
            'i18n': names,
            'file': f'music/{track_id}.m4a',
            'bytes': os.path.getsize(path),
            'seconds': round(SECONDS),
            'version': 1,
            'license': 'Original composition for Clarity Recovery',
        })
        print(f'{track_id}: {os.path.getsize(path) / 1e6:.1f} MB')
    with open(os.path.join(ROOT, 'music.json'), 'w') as f:
        json.dump({'tracks': catalogue}, f, indent=2, ensure_ascii=False)
        f.write('\n')


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Synthesizes the app's sound effects into assets/sounds/.

The sounds are generated rather than downloaded so there is nothing to license.
Standard library only. Run from the repo root: python3 scripts/make-sounds.py
"""

import math
import os
import struct
import wave

RATE = 22050
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def render(seconds, partials, attack=0.01, gain=0.5):
    """partials: (frequency Hz, amplitude, decay time constant in seconds, glide Hz/s)."""
    n = int(seconds * RATE)
    samples = []
    for i in range(n):
        t = i / RATE
        v = 0.0
        for freq, amp, decay, glide in partials:
            # Phase of a linear glide: integral of (freq + glide * t).
            phase = 2 * math.pi * (freq * t + glide * t * t / 2)
            v += amp * math.exp(-t / decay) * math.sin(phase)
        env = min(1.0, t / attack)
        # Short fade at the end so the file never clicks.
        tail = min(1.0, (n - i) / (0.05 * RATE))
        samples.append(v * env * tail)
    peak = max(abs(s) for s in samples) or 1.0
    return [s / peak * gain for s in samples]


def save(name, samples):
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(b''.join(struct.pack('<h', int(s * 32767)) for s in samples))


# Singing bowl: inharmonic partials with long, staggered decays. Marks the start and end of a session.
save('bell.wav', render(4.5, [
    (196.0, 1.0, 1.8, 0),
    (198.5, 0.5, 1.8, 0),  # slight detune gives the bowl its slow beat
    (541.0, 0.45, 1.1, 0),
    (1058.0, 0.18, 0.6, 0),
    (1750.0, 0.07, 0.35, 0),
], attack=0.005, gain=0.55))

# Soft chime between steps: quieter and shorter than the bell.
save('chime.wav', render(1.6, [
    (784.0, 1.0, 0.45, 0),
    (1568.0, 0.25, 0.25, 0),
    (2352.0, 0.08, 0.15, 0),
], attack=0.004, gain=0.35))

# Breath cues: a gentle rising tone to breathe in, a falling one to breathe out.
save('inhale.wav', render(0.9, [(330.0, 1.0, 0.6, 90), (660.0, 0.2, 0.4, 180)], attack=0.12, gain=0.28))
save('exhale.wav', render(1.1, [(392.0, 1.0, 0.7, -80), (784.0, 0.2, 0.4, -160)], attack=0.12, gain=0.28))

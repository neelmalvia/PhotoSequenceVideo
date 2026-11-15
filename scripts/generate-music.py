"""Synthesize an original, license-free ambient track for the app.

Output: 16-bit mono WAV at 44.1 kHz. Usage: python3 make_music.py out.wav
"""
import math
import struct
import sys
import wave

SR = 44100
CHORD_SECONDS = 4.0
# C, G, Am, F twice: a warm, familiar progression.
PROGRESSION = [
    [48, 55, 60, 64, 67],  # C
    [43, 55, 59, 62, 67],  # G
    [45, 57, 60, 64, 69],  # Am
    [41, 53, 57, 60, 65],  # F
] * 2
DURATION = CHORD_SECONDS * len(PROGRESSION)
N = int(SR * DURATION)


def freq(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


buf = [0.0] * N


def add_tone(start, length, f, amp, attack, release, harmonics):
    s0 = int(start * SR)
    n = int(length * SR)
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    w = 2 * math.pi * f / SR
    for i in range(n):
        idx = s0 + i
        if idx >= N:
            break
        env = min(1.0, i / a) * min(1.0, (n - i) / r)
        v = 0.0
        for h, ha in harmonics:
            v += ha * math.sin(w * h * i)
        buf[idx] += amp * env * v


def add_pluck(start, f, amp):
    s0 = int(start * SR)
    n = int(1.6 * SR)
    w = 2 * math.pi * f / SR
    for i in range(n):
        idx = s0 + i
        if idx >= N:
            break
        env = math.exp(-i / (0.35 * SR)) * min(1.0, i / 200)
        v = math.sin(w * i) + 0.35 * math.sin(2 * w * i) + 0.1 * math.sin(3 * w * i)
        buf[idx] += amp * env * v


for c, chord in enumerate(PROGRESSION):
    t = c * CHORD_SECONDS
    # Soft pad: chord tones without the bass, long attack and release.
    for m in chord[1:]:
        add_tone(t, CHORD_SECONDS + 0.6, freq(m), 0.07, 0.8, 1.2, [(1, 1.0), (2, 0.15)])
    # Bass note.
    add_tone(t, CHORD_SECONDS, freq(chord[0]), 0.16, 0.05, 0.8, [(1, 1.0), (2, 0.3)])
    # Arpeggio in eighth notes at 120 BPM (0.25 s each).
    pattern = [1, 2, 3, 4, 3, 2, 3, 4]
    for k in range(16):
        note = chord[pattern[k % len(pattern)]] + 12
        add_pluck(t + k * 0.25, freq(note), 0.09 if k % 4 else 0.12)

peak = max(abs(x) for x in buf) or 1.0
fade_in, fade_out = int(1.0 * SR), int(2.5 * SR)
frames = bytearray()
for i, x in enumerate(buf):
    g = 0.85 / peak
    if i < fade_in:
        g *= i / fade_in
    if i > N - fade_out:
        g *= (N - i) / fade_out
    frames += struct.pack('<h', int(max(-1.0, min(1.0, x * g)) * 32767))

with wave.open(sys.argv[1], 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(bytes(frames))
print(f'wrote {sys.argv[1]} ({DURATION:.0f}s)')

"""Generate an original CC0 cheer-pop loop for the game."""
import numpy as np
import wave, struct, os, subprocess

SR = 44100
BPM = 124
BEAT = 60.0 / BPM
BAR = 4 * BEAT
BARS = 32
DUR = BARS * BAR
N = int(SR * DUR) + SR  # +1s tail room
rng = np.random.default_rng(20261111)

def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)

def hz_env(n, a, d, s_level, r, sr=SR):
    """ADSR over n samples."""
    a_n = max(1, int(a * sr)); d_n = max(1, int(d * sr)); r_n = max(1, int(r * sr))
    s_n = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([
        np.linspace(0, 1, a_n, endpoint=False),
        np.linspace(1, s_level, d_n, endpoint=False),
        np.full(s_n, s_level),
        np.linspace(s_level, 0, r_n),
    ])
    if len(env) < n:
        env = np.pad(env, (0, n - len(env)))
    return env[:n]

def place(buf, start_s, sig, gain=1.0, pan=0.0):
    i = int(start_s * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig))
    seg = sig[:j - i] * gain
    # simple constant-power pan
    buf[i:j, 0] += seg * np.sqrt(0.5 * (1 - pan))
    buf[i:j, 1] += seg * np.sqrt(0.5 * (1 + pan))

def saw(freq, n, detune=0.0):
    t = np.arange(n) / SR
    return 2 * ((t * (freq + detune)) % 1.0) - 1

def square(freq, n, duty=0.5):
    t = np.arange(n) / SR
    return np.where((t * freq) % 1.0 < duty, 1.0, -1.0)

def sine(freq, n):
    return np.sin(2 * np.pi * np.arange(n) / SR * freq)

def kick(dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 125 * np.exp(-t * 26) + 42
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12)
    click = rng.normal(0, 1, n) * np.exp(-t * 160) * 0.35
    return np.tanh((sig + click) * 1.4)

def snare(dur=0.18):
    n = int(dur * SR); t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    # cheap high-pass
    noise = noise - np.concatenate([[0], noise[:-1]]) * 0.85
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30) * 0.5
    return (noise * np.exp(-t * 20) * 0.55 + body)

def hat(dur=0.045, open_=False):
    n = int(dur * SR); t = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = noise - np.concatenate([[0], noise[:-1]])
    return noise * np.exp(-t * (18 if open_ else 70))

def bell(freq, dur=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = (np.sin(2*np.pi*freq*t) * 0.6 + np.sin(2*np.pi*freq*2.01*t) * 0.25 +
         np.sin(2*np.pi*freq*3.02*t) * 0.12)
    return s * np.exp(-t * 4.5)

def pluck(freq, dur=0.28):
    n = int(dur * SR); t = np.arange(n) / SR
    s = saw(freq, n) * 0.45 + square(freq, n, 0.35) * 0.25 + sine(freq, n) * 0.3
    return s * np.exp(-t * 6.5)

def lowpass(sig, cutoff):
    # one-pole lowpass
    a = np.exp(-2 * np.pi * cutoff / SR)
    out = np.empty_like(sig)
    prev = 0.0
    for i, v in enumerate(sig):
        prev = (1 - a) * v + a * prev
        out[i] = prev
    return out

# ---------------- arrangement ----------------
bus = np.zeros((N, 2))
lead_bus = np.zeros((N, 2))
bell_bus = np.zeros((N, 2))

chords = [
    ('C',  [60, 64, 67], 36,  [72, 76, 79, 84]),
    ('G',  [59, 62, 67], 43,  [71, 74, 79, 83]),
    ('Am', [57, 60, 64], 45,  [69, 72, 76, 81]),
    ('F',  [57, 60, 65], 41,  [69, 72, 77, 81]),
]

# melody: (beat_in_4bar, midi, length_beats)
motif = [
    (0.0, 76, .5), (0.5, 79, .5), (1.0, 81, .5), (1.5, 79, .5),
    (2.0, 76, .5), (2.5, 74, .5), (3.0, 72, 1.0),
    (4.0, 74, .5), (4.5, 79, .5), (5.0, 83, .5), (5.5, 81, .5),
    (6.0, 79, 1.0), (7.0, 74, 1.0),
    (8.0, 76, .5), (8.5, 81, .5), (9.0, 84, .5), (9.5, 83, .5),
    (10.0, 81, .5), (10.5, 79, .5), (11.0, 76, 1.0),
    (12.0, 77, .5), (12.5, 81, .5), (13.0, 79, .5), (13.5, 76, .5),
    (14.0, 74, .5), (14.5, 72, .5), (15.0, 72, 1.0),
]

for bar in range(BARS):
    t0 = bar * BAR
    name, notes, root, arp = chords[bar % 4]

    # pad
    for k, m in enumerate(notes):
        n = int(BAR * SR)
        sig = (saw(midi(m), n, -2.0) * .3 + saw(midi(m), n, 2.0) * .3 +
               sine(midi(m - 12), n) * .18)
        sig = lowpass(sig, 1800)
        env = hz_env(n, .10, .18, .62, .35)
        pan = (-0.45, 0.15, 0.45)[k]
        place(bus, t0, sig * env, gain=.16, pan=pan)

    # bass: 8th pulse pattern
    for b, m in [(0, root), (0.75, root), (1.5, root + 7), (2, root), (2.75, root), (3.5, root + 12)]:
        n = int(.42 * SR)
        sig = saw(midi(m), n) * .5 + sine(midi(m), n) * .8
        env = hz_env(n, .005, .08, .55, .18)
        place(bus, t0 + b * BEAT, sig * env, gain=.30, pan=0.0)

    # drums
    if bar % 32 < 30:  # leave a 2-bar breakdown for loop interest
        for b in (0, 2):
            place(bus, t0 + b * BEAT, kick(), gain=.85)
        for b in (1, 3):
            place(bus, t0 + b * BEAT, snare(), gain=.38, pan=.05)
        for i in range(8):
            bb = i * 0.5
            place(bus, t0 + bb * BEAT, hat(open_=(i % 2 == 1)), gain=.22 if i % 2 else .16,
                  pan=(.3 if i % 2 else -.3))
        # little snare fill at the end of each 8-bar phrase
        if bar % 8 == 7:
            for i, bb in enumerate([3.25, 3.5, 3.75]):
                place(bus, t0 + bb * BEAT, snare(0.12), gain=.26 + i * .04, pan=.1)

    # bell arpeggio on off-beats
    for i, m in enumerate(arp * 2):
        if bar % 32 >= 30 and i % 2:
            continue
        bb = i * 0.5
        place(bell_bus, t0 + bb * BEAT, bell(midi(m), .55),
              gain=.13, pan=(-.5 if i % 2 else .5))

# melody on second, fourth, sixth, eighth 4-bar phrase (bars 4-7, 12-15, 20-23, 28-31)
for phrase_start in (4, 12, 20, 28):
    for (b, m, ln) in motif:
        t = (phrase_start * BAR) + b * BEAT
        dur = ln * BEAT * .9
        n = int(dur * SR)
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * np.arange(n) / SR)
        sig = square(midi(m), n, .42) * .45 + saw(midi(m), n) * .2
        sig = sig * vib
        env = hz_env(n, .012, .09, .62, .16)
        place(lead_bus, t, sig * env, gain=.30, pan=.0)
        # echo
        place(lead_bus, t + .32, sig * env, gain=.10, pan=.35)
        place(lead_bus, t + .64, sig * env, gain=.045, pan=-.35)

# ---------------- mix + fx ----------------
def delay_fx(sig, time_s, fb, mix):
    d = int(time_s * SR)
    out = sig.copy()
    buf = np.zeros_like(sig)
    for ch in range(2):
        x = sig[:, ch].copy()
        y = np.zeros_like(x)
        for i in range(d, len(x)):
            y[i] = x[i - d] + fb * y[i - d]
        out[:, ch] += y * mix
    return out

# duck bass/pad bus on each kick
duck = np.ones(N)
for bar in range(BARS):
    if bar % 32 < 30:
        for b in (0, 2):
            i = int((bar * BAR + b * BEAT) * SR)
            ln = int(.28 * SR)
            if i + ln < N:
                duck[i:i+ln] = np.minimum(duck[i:i+ln], np.linspace(.55, 1.0, ln))
bus *= duck[:, None]

lead_bus = delay_fx(lead_bus, .48, .28, .5)
bell_bus = delay_fx(bell_bus, .375, .25, .5)

mix = bus + lead_bus + bell_bus

# gentle stereo widening on the pad-ish bus
mix[:, 0] = np.tanh(mix[:, 0] * 1.05)
mix[:, 1] = np.tanh(mix[:, 1] * 1.05)

# ---------------- seamless loop: fold tail into head ----------------
loop_n = int(DUR * SR)
tail = mix[loop_n:]
head = mix[:loop_n].copy()
xf = min(len(tail), int(.6 * SR))
if xf > 0:
    w = np.linspace(0, 1, xf)[:, None]
    head[-xf:] = head[-xf:] * (1 - w) + tail[:xf] * w
mix = head

# normalize
peak = np.max(np.abs(mix))
mix = mix / peak * 0.92
# 5ms fade edges to kill any click
f = int(.005 * SR)
mix[:f] *= np.linspace(0, 1, f)[:, None]
mix[-f:] *= np.linspace(1, 0, f)[:, None]

out_wav = os.path.join('dist', 'bgm-master.wav')
with wave.open(out_wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    pcm = (mix * 32767).clip(-32768, 32767).astype(np.int16)
    w.writeframes(pcm.tobytes())

os.makedirs('bgm', exist_ok=True)
out_mp3 = os.path.join('bgm', 'school-idol.mp3')
subprocess.run([
    'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
    '-i', out_wav, '-codec:a', 'libmp3lame', '-b:a', '160k',
    '-metadata', 'title=学园偶像进行曲', '-metadata', 'artist=Yizhong Idols',
    out_mp3
], check=True)
print('wrote', out_mp3, f'{os.path.getsize(out_mp3)/1024/1024:.2f} MB, {DUR:.1f}s')

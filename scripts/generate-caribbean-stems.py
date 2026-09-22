import os
import wave
import math
import struct
import random

SAMPLE_RATE = 44100

def note_to_freq(note_name):
    notes = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
             'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
             'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}
    letter = note_name[:-1]
    octave = int(note_name[-1])
    semitone = notes[letter] + (octave - 4) * 12 - 9  # Distance from A4
    return 440.0 * (2.0 ** (semitone / 12.0))

def create_wav_file(filename, duration_s, generator_fn):
    n_samples = int(SAMPLE_RATE * duration_s)
    with wave.open(filename, 'w') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        
        # Buffer in chunks of 4096 samples for speed and low memory
        chunk_size = 4096
        chunk = bytearray()
        
        for i in range(n_samples):
            t = i / SAMPLE_RATE
            left, right = generator_fn(t, i)
            
            # Clamp to [-1.0, 1.0]
            left = max(-1.0, min(1.0, left))
            right = max(-1.0, min(1.0, right))
            
            # 16-bit PCM conversion
            s_left = int(left * 32767)
            s_right = int(right * 32767)
            chunk.extend(struct.pack('<hh', s_left, s_right))
            
            if len(chunk) >= chunk_size * 4:
                wav.writeframes(chunk)
                chunk.clear()
                
        if chunk:
            wav.writeframes(chunk)

# 1. Steelpan: Bright metallic harmonics with percussive envelope
def gen_steelpan(t, i):
    bpm = 160
    beat_dur = 60.0 / bpm
    bar_time = t % (beat_dur * 4)
    melody = ['D5', 'F#5', 'A5', 'B5', 'A5', 'F#5', 'D5', 'E5']
    note_idx = int((t % (beat_dur * 8)) / (beat_dur / 2)) % len(melody)
    freq = note_to_freq(melody[note_idx])
    note_t = t % (beat_dur / 2)
    
    # Metallic tone: fundamental + prominent 2nd & 3rd harmonics + inharmonic shimmer
    harmonic = (0.5 * math.sin(2 * math.pi * freq * note_t) +
                0.3 * math.sin(4 * math.pi * freq * note_t) +
                0.15 * math.sin(6 * math.pi * freq * note_t) +
                0.05 * math.sin(2 * math.pi * (freq * 2.76) * note_t))
    env = math.exp(-8.0 * note_t)
    pan = harmonic * env * 0.6
    
    # Iron percussion (chac-chac / brake drum) on 16th notes
    iron_t = t % (beat_dur / 4)
    iron_noise = (random.random() * 2.0 - 1.0) * math.exp(-35.0 * iron_t) * 0.18
    
    return pan + iron_noise, pan * 0.9 + iron_noise * 1.1

# 2. Dancehall Dubplate: Heavy sub bass + offbeat skanks
def gen_dancehall(t, i):
    bpm = 102
    beat_dur = 60.0 / bpm
    beat_in_bar = (t % (beat_dur * 4)) / beat_dur
    
    # Deep sub-bass (G1 / G2)
    bass_freq = 49.0 if (t % (beat_dur * 8) < beat_dur * 4) else 43.65
    bass_t = t % beat_dur
    bass = math.sin(2 * math.pi * bass_freq * t) * math.exp(-1.5 * bass_t) * 0.7
    
    # Offbeat skank chords (on the '&' of each beat)
    skank_env = 0.0
    sub_beat = (t / (beat_dur / 2)) % 2
    if sub_beat >= 1.0:
        skank_t = t % (beat_dur / 2)
        skank_env = math.exp(-12.0 * skank_t) * 0.35
    skank = (math.sin(2 * math.pi * 392.0 * t) + math.sin(2 * math.pi * 466.16 * t) + math.sin(2 * math.pi * 587.33 * t)) * skank_env
    
    # Dub snare with tape delay on beat 3
    snare = 0.0
    if 2.0 <= beat_in_bar < 3.0:
        snare_t = t % beat_dur
        snare = (random.random() * 2.0 - 1.0) * math.exp(-9.0 * snare_t) * 0.4
        
    return bass + skank + snare, bass + skank * 0.8 + snare * 1.1

# 3. Kompa Gouyad: Melodic syncopated clean guitar
def gen_kompa(t, i):
    bpm = 96
    beat_dur = 60.0 / bpm
    guitar_notes = ['A4', 'C5', 'E5', 'G5', 'E5', 'C5', 'B4', 'D5']
    note_idx = int((t % (beat_dur * 4)) / (beat_dur / 2)) % len(guitar_notes)
    freq = note_to_freq(guitar_notes[note_idx])
    note_t = t % (beat_dur / 2)
    
    # Plucked string physical synthesis
    string = (math.sin(2 * math.pi * freq * note_t) +
              0.4 * math.sin(4 * math.pi * freq * note_t) +
              0.1 * math.sin(6 * math.pi * freq * note_t))
    env = math.exp(-4.5 * note_t)
    guitar = string * env * 0.5
    
    # Smooth gouyad kick & high-hat
    kick_t = t % beat_dur
    kick = math.sin(2 * math.pi * 55.0 * kick_t) * math.exp(-15.0 * kick_t) * 0.4
    
    return guitar + kick, guitar * 0.85 + kick

# 4. Bachata: Fast requinto nylon lead arpeggios + bongo martillo
def gen_bachata(t, i):
    bpm = 128
    beat_dur = 60.0 / bpm
    pattern = ['E5', 'B4', 'G4', 'E5', 'G5', 'E5', 'B4', 'G4']
    note_idx = int((t % (beat_dur * 2)) / (beat_dur / 4)) % len(pattern)
    freq = note_to_freq(pattern[note_idx])
    note_t = t % (beat_dur / 4)
    
    requinto = (math.sin(2 * math.pi * freq * note_t) + 0.3 * math.sin(4 * math.pi * freq * note_t)) * math.exp(-14.0 * note_t) * 0.5
    bongo_t = t % (beat_dur / 2)
    bongo = (random.random() * 2.0 - 1.0) * math.exp(-25.0 * bongo_t) * 0.15
    return requinto + bongo, requinto * 0.9 + bongo * 1.1

# 5. Reggae: One Drop Drum Kit
def gen_reggae(t, i):
    bpm = 78
    beat_dur = 60.0 / bpm
    bar_pos = (t % (beat_dur * 4)) / beat_dur
    
    # Heavy one drop rimshot + kick strictly on beat 3 (index 2)
    one_drop = 0.0
    if 2.0 <= bar_pos < 3.0:
        hit_t = (t % (beat_dur * 4)) - (2.0 * beat_dur)
        kick_sound = math.sin(2 * math.pi * 60.0 * hit_t) * math.exp(-10.0 * hit_t) * 0.6
        rim_sound = (random.random() * 2.0 - 1.0) * math.exp(-30.0 * hit_t) * 0.4
        one_drop = kick_sound + rim_sound
        
    # High-hat on 8th notes
    hh_t = t % (beat_dur / 2)
    hihat = (random.random() * 2.0 - 1.0) * math.exp(-40.0 * hh_t) * 0.12
    return one_drop + hihat, one_drop * 0.95 + hihat * 1.05

# 6. Calypso: Port of Spain Brass Fanfare
def gen_calypso(t, i):
    bpm = 115
    beat_dur = 60.0 / bpm
    chords = [['F4', 'A4', 'C5'], ['G4', 'Bb4', 'D5'], ['C5', 'E5', 'G5'], ['F4', 'A4', 'C5']]
    chord_idx = int((t % (beat_dur * 4)) / beat_dur) % 4
    brass = 0.0
    chord_t = t % beat_dur
    env = math.exp(-3.0 * chord_t)
    for n in chords[chord_idx]:
        f = note_to_freq(n)
        brass += (math.sin(2 * math.pi * f * chord_t) + 0.5 * math.sin(4 * math.pi * f * chord_t)) * 0.18 * env
    cowbell_t = t % (beat_dur / 2)
    cowbell = math.sin(2 * math.pi * 820.0 * cowbell_t) * math.exp(-20.0 * cowbell_t) * 0.15
    return brass + cowbell, brass + cowbell

# 7. Zouk: Martinique 80s DX7 Synth Cadence
def gen_zouk(t, i):
    bpm = 98
    beat_dur = 60.0 / bpm
    notes = ['Bb4', 'D5', 'F5', 'G5', 'F5', 'D5']
    note_idx = int((t % (beat_dur * 3)) / (beat_dur / 2)) % len(notes)
    freq = note_to_freq(notes[note_idx])
    note_t = t % (beat_dur / 2)
    # FM Synthesis simulation
    modulator = math.sin(2 * math.pi * freq * 2.0 * note_t) * 2.5
    carrier = math.sin(2 * math.pi * freq * note_t + modulator) * math.exp(-6.0 * note_t) * 0.45
    bass_t = t % beat_dur
    bass = math.sin(2 * math.pi * 58.27 * bass_t) * math.exp(-8.0 * bass_t) * 0.4
    return carrier + bass, carrier * 0.9 + bass

# 8. Bouyon: Dominica Fast Drum Machine Jump-Up
def gen_bouyon(t, i):
    bpm = 155
    beat_dur = 60.0 / bpm
    kick_t = t % (beat_dur / 2)
    kick = math.sin(2 * math.pi * 80.0 * kick_t) * math.exp(-18.0 * kick_t) * 0.65
    synth_t = t % beat_dur
    synth = math.sin(2 * math.pi * 155.56 * synth_t) * math.exp(-5.0 * synth_t) * 0.3
    return kick + synth, kick + synth

# 9. Punta: Garifuna Ancestral Primera Drum
def gen_punta(t, i):
    bpm = 140
    beat_dur = 60.0 / bpm
    drum_t = t % (beat_dur / 3)
    drum = math.sin(2 * math.pi * 110.0 * drum_t) * math.exp(-12.0 * drum_t) * 0.6
    shaker_t = t % (beat_dur / 6)
    shaker = (random.random() * 2.0 - 1.0) * math.exp(-45.0 * shaker_t) * 0.15
    return drum + shaker, drum * 0.85 + shaker * 1.15

# 10. Chutney: Dholak & Dantal
def gen_chutney(t, i):
    bpm = 148
    beat_dur = 60.0 / bpm
    dholak_t = t % (beat_dur / 2)
    dholak = math.sin(2 * math.pi * 175.0 * dholak_t) * math.exp(-14.0 * dholak_t) * 0.55
    dantal_t = t % beat_dur
    dantal = math.sin(2 * math.pi * 2400.0 * dantal_t) * math.exp(-22.0 * dantal_t) * 0.25
    return dholak + dantal, dholak + dantal

# 11. Parang: Lopinot Cuatro & Maracas
def gen_parang(t, i):
    bpm = 130
    beat_dur = 60.0 / bpm
    cuatro_notes = ['A4', 'C#5', 'E5', 'A5']
    note_idx = int((t % (beat_dur * 2)) / (beat_dur / 4)) % len(cuatro_notes)
    freq = note_to_freq(cuatro_notes[note_idx])
    note_t = t % (beat_dur / 4)
    cuatro = math.sin(2 * math.pi * freq * note_t) * math.exp(-10.0 * note_t) * 0.45
    maraca_t = t % (beat_dur / 2)
    maraca = (random.random() * 2.0 - 1.0) * math.exp(-35.0 * maraca_t) * 0.15
    return cuatro + maraca, cuatro * 0.9 + maraca * 1.1

# 12. Soca: Willemstad Tambú & Chapi Groove
def gen_tambu(t, i):
    bpm = 135
    beat_dur = 60.0 / bpm
    tambu_t = t % (beat_dur / 2)
    tambu = math.sin(2 * math.pi * 95.0 * tambu_t) * math.exp(-11.0 * tambu_t) * 0.65
    chapi_t = t % (beat_dur / 4)
    chapi = math.sin(2 * math.pi * 1800.0 * chapi_t) * math.exp(-28.0 * chapi_t) * 0.2
    return tambu + chapi, tambu + chapi

STEMS = [
    ('sound-soca-01', gen_steelpan, 15.0),
    ('sound-dancehall-02', gen_dancehall, 15.0),
    ('sound-kompa-03', gen_kompa, 15.0),
    ('sound-bachata-04', gen_bachata, 15.0),
    ('sound-reggae-05', gen_reggae, 15.0),
    ('sound-calypso-06', gen_calypso, 15.0),
    ('sound-zouk-07', gen_zouk, 15.0),
    ('sound-bouyon-08', gen_bouyon, 15.0),
    ('sound-punta-09', gen_punta, 15.0),
    ('sound-chutney-10', gen_chutney, 15.0),
    ('sound-parang-11', gen_parang, 15.0),
    ('sound-soca-12', gen_tambu, 15.0),
]

def main():
    out_dir = os.path.join(os.path.dirname(__file__), 'generated_audio')
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"Generating 12 Caribbean rhythm stems into {out_dir}...")
    for sound_id, gen_fn, dur in STEMS:
        wav_path = os.path.join(out_dir, f"{sound_id}.wav")
        create_wav_file(wav_path, dur, gen_fn)
        file_size = os.path.getsize(wav_path)
        print(f"  [OK] {sound_id}.wav ({dur}s, {file_size} bytes)")
        
    print("All 12 stems generated successfully!")

if __name__ == '__main__':
    main()

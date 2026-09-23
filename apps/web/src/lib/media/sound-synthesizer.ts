/**
 * TUKUBI Caribbean Sound Synthesizer (Web Audio API)
 *
 * Provides resilient, zero-failure client-side Caribbean audio synthesis.
 * If a remote audio stem from storage is temporarily unreachable, offline,
 * or delayed, this synthesizer generates authentic harmonic musical patterns
 * (Steelpan resonant harmonics, Reggae/Dub sub-bass pulses, Soca 160bpm chords)
 * so audio controls always work seamlessly.
 */

export type SynthGenre =
  | 'Steelpan'
  | 'Soca'
  | 'Dancehall'
  | 'Reggae'
  | 'Calypso'
  | 'IronBell'
  | 'AfroPercussion'
  | 'Default';

class CaribbeanSoundSynthesizer {
  private static instance: CaribbeanSoundSynthesizer | null = null;
  private audioCtx: AudioContext | null = null;
  private isSynthesizing = false;
  private timerId: number | null = null;
  private gainNode: GainNode | null = null;

  public static getInstance(): CaribbeanSoundSynthesizer {
    if (!CaribbeanSoundSynthesizer.instance) {
      CaribbeanSoundSynthesizer.instance = new CaribbeanSoundSynthesizer();
    }
    return CaribbeanSoundSynthesizer.instance;
  }

  private initContext(): AudioContext {
    if (typeof window === 'undefined') {
      throw new Error('AudioContext is only available in browser environments');
    }
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('AudioContext is not supported on this browser');
      }
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Plays a synthesized Caribbean rhythm loop based on genre.
   */
  public playRhythm(genre: string, onEnded?: () => void): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      this.stop();
      const ctx = this.initContext();
      this.isSynthesizing = true;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.gainNode = masterGain;

      const normalizedGenre = (genre || '').toLowerCase();

      if (normalizedGenre.includes('steelpan') || normalizedGenre.includes('pan')) {
        this.playSteelpanPattern(ctx, masterGain);
      } else if (normalizedGenre.includes('iron') || normalizedGenre.includes('bell')) {
        this.playIronBellPattern(ctx, masterGain);
      } else if (
        normalizedGenre.includes('drum') ||
        normalizedGenre.includes('percussion') ||
        normalizedGenre.includes('djembe')
      ) {
        this.playAfroCaribbeanDrumPattern(ctx, masterGain);
      } else if (normalizedGenre.includes('reggae') || normalizedGenre.includes('dub')) {
        this.playDubBassPattern(ctx, masterGain);
      } else if (normalizedGenre.includes('soca') || normalizedGenre.includes('calypso')) {
        this.playSocaChords(ctx, masterGain);
      } else {
        this.playCaribbeanHarmonics(ctx, masterGain);
      }

      return true;
    } catch (err) {
      console.warn('[SoundSynthesizer] AudioContext playback warning:', err);
      return false;
    }
  }

  /**
   * Explicit preset trigger for user-selected presets.
   */
  public playPreset(
    preset: 'steelpan' | 'soca' | 'dub' | 'iron_bell' | 'afro_drums' | 'harmonics'
  ): boolean {
    return this.playRhythm(preset);
  }

  /**
   * Plays steelpan resonant pentatonic harmonics.
   */
  private playSteelpanPattern(ctx: AudioContext, destination: AudioNode) {
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0]; // C5, D5, E5, G5, A5
    let step = 0;

    const intervalMs = 280;
    const playNote = () => {
      if (!this.isSynthesizing) return;

      const freq = notes[step % notes.length];
      const now = ctx.currentTime;

      // Primary tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Steelpan overtone
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2.01, now);

      // Envelope
      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      overtoneGain.gain.setValueAtTime(0.2, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(oscGain);
      overtone.connect(overtoneGain);
      oscGain.connect(destination);
      overtoneGain.connect(destination);

      osc.start(now);
      overtone.start(now);
      osc.stop(now + 0.55);
      overtone.stop(now + 0.35);

      step++;
      this.timerId = window.setTimeout(playNote, intervalMs);
    };

    playNote();
  }

  /**
   * Plays deep dub reggae sub-bass pattern.
   */
  private playDubBassPattern(ctx: AudioContext, destination: AudioNode) {
    const bassline = [65.41, 65.41, 73.42, 82.41, 98.0, 82.41]; // C2, C2, D2, E2, G2, E2
    let step = 0;

    const intervalMs = 450;
    const playNote = () => {
      if (!this.isSynthesizing) return;

      const freq = bassline[step % bassline.length];
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      oscGain.gain.setValueAtTime(0.5, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(destination);

      osc.start(now);
      osc.stop(now + 0.65);

      step++;
      this.timerId = window.setTimeout(playNote, intervalMs);
    };

    playNote();
  }

  /**
   * Plays soca syncopated rhythm.
   */
  private playSocaChords(ctx: AudioContext, destination: AudioNode) {
    const chords = [
      [261.63, 329.63, 392.0], // C major
      [293.66, 369.99, 440.0], // D major
      [329.63, 392.0, 493.88], // E minor
      [349.23, 440.0, 523.25], // F major
    ];
    let step = 0;

    const intervalMs = 220; // Fast 140-160 BPM feel
    const playChord = () => {
      if (!this.isSynthesizing) return;

      const chord = chords[step % chords.length];
      const now = ctx.currentTime;

      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);

        oscGain.gain.setValueAtTime(0.12, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(destination);

        osc.start(now);
        osc.stop(now + 0.28);
      });

      step++;
      this.timerId = window.setTimeout(playChord, intervalMs);
    };

    playChord();
  }

  /**
   * Plays warm ambient Caribbean harmonics.
   */
  private playCaribbeanHarmonics(ctx: AudioContext, destination: AudioNode) {
    const freqs = [392.0, 440.0, 523.25, 587.33];
    let step = 0;

    const intervalMs = 500;
    const playHarmonic = () => {
      if (!this.isSynthesizing) return;

      const freq = freqs[step % freqs.length];
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(oscGain);
      oscGain.connect(destination);

      osc.start(now);
      osc.stop(now + 0.85);

      step++;
      this.timerId = window.setTimeout(playHarmonic, intervalMs);
    };

    playHarmonic();
  }

  /**
   * Plays authentic Trinidadian "engine room" iron bell metallic syncopated rhythm.
   */
  private playIronBellPattern(ctx: AudioContext, destination: AudioNode) {
    // 16th-note syncopated bell pattern (clave accents: 1, 0, 1, 1, 0, 1, 0, 1)
    const accents = [1.0, 0.2, 0.8, 0.9, 0.2, 0.85, 0.2, 0.7];
    const bellFrequencies = [2480, 3120]; // Dual high metallic partials
    let step = 0;
    const intervalMs = 150; // High tempo carnival engine room pace

    const playStrike = () => {
      if (!this.isSynthesizing) return;

      const accent = accents[step % accents.length];
      const now = ctx.currentTime;

      bellFrequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const bandpass = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(freq, now);
        bandpass.Q.setValueAtTime(18, now);

        const peakGain = 0.22 * accent;
        gain.gain.setValueAtTime(peakGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (accent > 0.5 ? 0.18 : 0.08));

        osc.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(destination);

        osc.start(now);
        osc.stop(now + 0.2);
      });

      step++;
      this.timerId = window.setTimeout(playStrike, intervalMs);
    };

    playStrike();
  }

  /**
   * Plays Afro-Caribbean percussion rhythm (djembe/bongo bass and rim slap).
   */
  private playAfroCaribbeanDrumPattern(ctx: AudioContext, destination: AudioNode) {
    // Alternates between deep resonant bass thump and bright slap
    const pattern = [
      { type: 'bass', velocity: 1.0 },
      { type: 'slap', velocity: 0.5 },
      { type: 'bass', velocity: 0.7 },
      { type: 'slap', velocity: 0.9 },
      { type: 'bass', velocity: 0.6 },
      { type: 'slap', velocity: 0.8 },
    ];
    let step = 0;
    const intervalMs = 240;

    const playBeat = () => {
      if (!this.isSynthesizing) return;

      const current = pattern[step % pattern.length];
      const now = ctx.currentTime;

      if (current.type === 'bass') {
        // Resonant membrane pitch drop (140Hz -> 50Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

        gain.gain.setValueAtTime(0.45 * current.velocity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(destination);

        osc.start(now);
        osc.stop(now + 0.38);
      } else {
        // High rim slap: filtered white noise impulse + triangle transient
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(350, now);

        gain.gain.setValueAtTime(0.3 * current.velocity, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);

        osc.start(now);
        osc.stop(now + 0.15);
      }

      step++;
      this.timerId = window.setTimeout(playBeat, intervalMs);
    };

    playBeat();
  }

  /**
   * Stops any currently active synthesis loop.
   */
  public stop() {
    this.isSynthesizing = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      } catch {
        // Ignore
      }
    }
  }

  public isPlaying(): boolean {
    return this.isSynthesizing;
  }
}

export default CaribbeanSoundSynthesizer;

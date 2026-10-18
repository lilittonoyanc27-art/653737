// Web Audio API & Speech Synthesis engine for Piano Español

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientInterval: number | null = null;
  private isAmbientPlaying: boolean = false;
  private speechRate: number = 0.9;
  private isSpeaking: boolean = false;
  private listeners: Set<(isSpeaking: boolean) => void> = new Set();

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isAmbientPlaying) {
      this.stopAmbientMusic();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSpeechRate(rate: number) {
    this.speechRate = Math.max(0.5, Math.min(1.5, rate));
  }

  public getSpeechRate(): number {
    return this.speechRate;
  }

  public subscribeSpeaking(callback: (isSpeaking: boolean) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifySpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
    this.listeners.forEach((cb) => cb(speaking));
  }

  // Play realistic acoustic piano tone with physical harmonics & envelope
  public playPianoNote(frequency: number, duration: number = 1.8, velocity: number = 0.8) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Master note gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      // Quick attack (hammer strike)
      masterGain.gain.linearRampToValueAtTime(velocity * 0.4, now + 0.008);
      // Natural piano decay
      masterGain.gain.exponentialRampToValueAtTime(velocity * 0.15, now + 0.35);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Lowpass filter simulates soundboard & hammer damping
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(frequency * 5, 12000), now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(frequency * 1.5, 300), now + duration);

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Harmonics weights (fundamental + overtones for warm acoustic grand piano sound)
      const harmonics = [
        { mult: 1, gain: 1.0 },
        { mult: 2, gain: 0.55 },
        { mult: 3, gain: 0.28 },
        { mult: 4, gain: 0.14 },
        { mult: 5, gain: 0.08 },
        { mult: 6, gain: 0.04 },
      ];

      harmonics.forEach(({ mult, gain: hGain }) => {
        const osc = ctx.createOscillator();
        // Slight detune for acoustic richness (chorus effect of triple-string piano)
        const detune = (Math.random() - 0.5) * 4;
        osc.frequency.setValueAtTime(frequency * mult, now);
        osc.detune.setValueAtTime(detune, now);
        osc.type = mult === 1 ? 'triangle' : 'sine';

        const g = ctx.createGain();
        g.gain.setValueAtTime(hGain, now);
        osc.connect(g);
        g.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    } catch {
      // AudioContext safe fail
    }
  }

  // Play musical chords for feedback
  public playChord(type: 'success' | 'fanfare' | 'error' | 'tick') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (type === 'success') {
        // C major arpeggio: C4, E4, G4, C5
        const notes = [261.63, 329.63, 392.0, 523.25];
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            this.playPianoNote(freq, 1.2, 0.7);
          }, idx * 70);
        });
      } else if (type === 'fanfare') {
        // Triumphant G major to C major
        const sequence = [
          { f: 392.0, t: 0 },
          { f: 493.88, t: 90 },
          { f: 523.25, t: 180 },
          { f: 659.25, t: 270 },
          { f: 783.99, t: 380 },
          { f: 1046.5, t: 500 },
        ];
        sequence.forEach(({ f, t }) => {
          setTimeout(() => this.playPianoNote(f, 2.0, 0.85), t);
        });
      } else if (type === 'error') {
        // Soft, gentle diminished chord (non-punishing, encouraging)
        const notes = [311.13, 369.99, 440.0];
        notes.forEach((freq) => {
          this.playPianoNote(freq, 0.8, 0.4);
        });
      } else if (type === 'tick') {
        // Soft clock mechanical tick
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
      }
    } catch {
      // AudioContext fail safe
    }
  }

  // Toggle ambient background piano loop (soothing classical progression)
  public toggleAmbientMusic(): boolean {
    if (this.isAmbientPlaying) {
      this.stopAmbientMusic();
      return false;
    } else {
      this.startAmbientMusic();
      return true;
    }
  }

  public isAmbientActive(): boolean {
    return this.isAmbientPlaying;
  }

  private startAmbientMusic() {
    if (this.isMuted) return;
    this.isAmbientPlaying = true;
    // Gentle Gymnopedie / Prelude-like progression:
    // Chords: Cmaj7, Am7, Fmaj7, G6
    const arpeggioProgression = [
      [261.63, 329.63, 392.0, 493.88], // C E G B
      [220.0, 261.63, 329.63, 392.0],  // A C E G
      [174.61, 220.0, 261.63, 329.63], // F A C E
      [196.0, 246.94, 293.66, 392.0],  // G B D G
    ];

    let chordIdx = 0;
    let noteIdx = 0;

    const playNextAmbientNote = () => {
      if (!this.isAmbientPlaying || this.isMuted) return;
      const currentChord = arpeggioProgression[chordIdx];
      const freq = currentChord[noteIdx];
      this.playPianoNote(freq, 2.2, 0.22); // very soft & lingering

      noteIdx++;
      if (noteIdx >= currentChord.length) {
        noteIdx = 0;
        chordIdx = (chordIdx + 1) % arpeggioProgression.length;
      }
    };

    playNextAmbientNote();
    this.ambientInterval = window.setInterval(playNextAmbientNote, 1400);
  }

  public stopAmbientMusic() {
    this.isAmbientPlaying = false;
    if (this.ambientInterval !== null) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  // Speech synthesis for Spanish (es-ES / es-MX / es)
  public speakSpanish(text: string, overrideRate?: number): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = overrideRate ?? this.speechRate;
        utterance.pitch = 1.0;
        utterance.lang = 'es-ES';

        // Find native Spanish voice if available
        const voices = window.speechSynthesis.getVoices();
        const esVoice =
          voices.find((v) => v.lang === 'es-ES') ||
          voices.find((v) => v.lang.startsWith('es-')) ||
          voices.find((v) => v.lang.startsWith('es'));

        if (esVoice) {
          utterance.voice = esVoice;
        }

        utterance.onstart = () => {
          this.notifySpeaking(true);
        };

        utterance.onend = () => {
          this.notifySpeaking(false);
          resolve();
        };

        utterance.onerror = () => {
          this.notifySpeaking(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch {
        this.notifySpeaking(false);
        resolve();
      }
    });
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.notifySpeaking(false);
  }
}

export const soundEngine = new SoundEngine();

// Piano keys mapping for 2 octaves (C3 to C5)
export interface PianoKey {
  note: string;
  octave: number;
  freq: number;
  isBlack: boolean;
  nameEs: string;
  nameRu: string;
  shortcut: string;
}

export const PIANO_KEYS: PianoKey[] = [
  { note: 'C', octave: 3, freq: 130.81, isBlack: false, nameEs: 'Do', nameRu: 'До', shortcut: 'Z' },
  { note: 'C#', octave: 3, freq: 138.59, isBlack: true, nameEs: 'Do sostenido', nameRu: 'До-диез', shortcut: 'S' },
  { note: 'D', octave: 3, freq: 146.83, isBlack: false, nameEs: 'Re', nameRu: 'Ре', shortcut: 'X' },
  { note: 'D#', octave: 3, freq: 155.56, isBlack: true, nameEs: 'Re sostenido', nameRu: 'Ре-диез', shortcut: 'D' },
  { note: 'E', octave: 3, freq: 164.81, isBlack: false, nameEs: 'Mi', nameRu: 'Ми', shortcut: 'C' },
  { note: 'F', octave: 3, freq: 174.61, isBlack: false, nameEs: 'Fa', nameRu: 'Фа', shortcut: 'V' },
  { note: 'F#', octave: 3, freq: 185.00, isBlack: true, nameEs: 'Fa sostenido', nameRu: 'Фа-диез', shortcut: 'G' },
  { note: 'G', octave: 3, freq: 196.00, isBlack: false, nameEs: 'Sol', nameRu: 'Соль', shortcut: 'B' },
  { note: 'G#', octave: 3, freq: 207.65, isBlack: true, nameEs: 'Sol sostenido', nameRu: 'Соль-диез', shortcut: 'H' },
  { note: 'A', octave: 3, freq: 220.00, isBlack: false, nameEs: 'La', nameRu: 'Ля', shortcut: 'N' },
  { note: 'A#', octave: 3, freq: 233.08, isBlack: true, nameEs: 'La sostenido', nameRu: 'Ля-диез', shortcut: 'J' },
  { note: 'B', octave: 3, freq: 246.94, isBlack: false, nameEs: 'Si', nameRu: 'Си', shortcut: 'M' },

  { note: 'C', octave: 4, freq: 261.63, isBlack: false, nameEs: 'Do', nameRu: 'До', shortcut: 'Q' },
  { note: 'C#', octave: 4, freq: 277.18, isBlack: true, nameEs: 'Do sostenido', nameRu: 'До-диез', shortcut: '2' },
  { note: 'D', octave: 4, freq: 293.66, isBlack: false, nameEs: 'Re', nameRu: 'Ре', shortcut: 'W' },
  { note: 'D#', octave: 4, freq: 311.13, isBlack: true, nameEs: 'Re sostenido', nameRu: 'Ре-диез', shortcut: '3' },
  { note: 'E', octave: 4, freq: 329.63, isBlack: false, nameEs: 'Mi', nameRu: 'Ми', shortcut: 'E' },
  { note: 'F', octave: 4, freq: 349.23, isBlack: false, nameEs: 'Fa', nameRu: 'Фа', shortcut: 'R' },
  { note: 'F#', octave: 4, freq: 369.99, isBlack: true, nameEs: 'Fa sostenido', nameRu: 'Фа-диез', shortcut: '5' },
  { note: 'G', octave: 4, freq: 392.00, isBlack: false, nameEs: 'Sol', nameRu: 'Соль', shortcut: 'T' },
  { note: 'G#', octave: 4, freq: 415.30, isBlack: true, nameEs: 'Sol sostenido', nameRu: 'Соль-диез', shortcut: '6' },
  { note: 'A', octave: 4, freq: 440.00, isBlack: false, nameEs: 'La', nameRu: 'Ля', shortcut: 'Y' },
  { note: 'A#', octave: 4, freq: 466.16, isBlack: true, nameEs: 'La sostenido', nameRu: 'Ля-диез', shortcut: '7' },
  { note: 'B', octave: 4, freq: 493.88, isBlack: false, nameEs: 'Si', nameRu: 'Си', shortcut: 'U' },

  { note: 'C', octave: 5, freq: 523.25, isBlack: false, nameEs: 'Do', nameRu: 'До', shortcut: 'I' },
];

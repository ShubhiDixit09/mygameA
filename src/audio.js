// ============================================================================
// AUDIO SYSTEM FOR "ME VS ME" - SMOOTH SYNTHWAVE MUSIC & CLEAN ARCADE SFX
// Seamless Background Music Loop with instant ON/OFF toggle, NO harsh robot voices
// ============================================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.step = 0;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMusic() {
    this.init();
    this.resume();
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  // --- MELODIC CHILL/UPBEAT SYNTHWAVE BACKGROUND MUSIC ---
  startMusic() {
    if (!this.musicEnabled) return;
    this.init();
    this.resume();
    if (this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.step = 0;

    // Harmonious Synth Chords Progression (Am - F - C - G)
    const chordFrequencies = [
      [220, 261.6, 329.6],  // A minor (A, C, E)
      [174.6, 220, 261.6],  // F major (F, A, C)
      [261.6, 329.6, 392],  // C major (C, E, G)
      [196, 246.9, 293.7]   // G major (G, B, D)
    ];

    const bassNotes = [110, 87.3, 130.8, 98.0]; // A, F, C, G

    const bpm = 120;
    const stepDuration = 60 / bpm / 2; // 8th note rhythm

    const playStep = () => {
      if (!this.isPlayingMusic || !this.musicEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const measure = Math.floor(this.step / 8) % 4;
      const beatInMeasure = this.step % 8;

      // Smooth warm bass pulse on beats 0, 2, 4, 6
      if (beatInMeasure % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNotes[measure], t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(320, t);
        bassFilter.frequency.exponentialRampToValueAtTime(100, t + 0.22);

        bassGain.gain.setValueAtTime(0.25, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.25);
      }

      // Atmospheric Pad Chords on beat 0 of each chord
      if (beatInMeasure === 0) {
        chordFrequencies[measure].forEach(freq => {
          const padOsc = this.ctx.createOscillator();
          const padGain = this.ctx.createGain();
          const padFilter = this.ctx.createBiquadFilter();

          padOsc.type = 'sine';
          padOsc.frequency.setValueAtTime(freq, t);

          padFilter.type = 'lowpass';
          padFilter.frequency.setValueAtTime(600, t);

          padGain.gain.setValueAtTime(0.08, t);
          padGain.gain.linearRampToValueAtTime(0.14, t + 0.4);
          padGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 7.5);

          padOsc.connect(padFilter);
          padFilter.connect(padGain);
          padGain.connect(this.musicGain);

          padOsc.start(t);
          padOsc.stop(t + stepDuration * 7.6);
        });
      }

      // Soft rhythmic percussion hi-hat click
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      hatOsc.type = 'triangle';
      hatOsc.frequency.setValueAtTime(beatInMeasure % 4 === 0 ? 1200 : 800, t);
      hatGain.gain.setValueAtTime(0.05, t);
      hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      hatOsc.connect(hatGain);
      hatGain.connect(this.musicGain);
      hatOsc.start(t);
      hatOsc.stop(t + 0.04);

      this.step++;
      this.musicTimer = setTimeout(playStep, stepDuration * 1000);
    };

    playStep();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  // --- CLEAN, ZERO-LATENCY SOUND FX ---

  playPaddleHit(speedRatio = 1.0) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  playWallBounce() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  playGoal() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Sub kick celebration
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.4);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  playButtonClick() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playButtonHover() {
    // Subtle, unobtrusive hover tick
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // No-op for removed speech synthesis so existing calls don't crash
  speak() {}
  setTempo() {}
  playSuperSmash() { this.playPaddleHit(2.0); }
  playPerfectDeflect() { this.playPaddleHit(1.5); }
  playMineHit() { this.playWallBounce(); }
  playMineAttach() { this.playWallBounce(); }
}

export const sound = new SoundManager();

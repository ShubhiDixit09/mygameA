// ============================================================================
// AUDIO SYSTEM FOR "ME VS ME" - SMOOTH SYNTHWAVE MUSIC & CLEAN ARCADE SFX
// Reliable Auto-start on First Interaction + Instant ON/OFF Toggle
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
    if (this.ctx) return this.ctx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
    return this.ctx;
  }

  async resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('Audio resume error:', e);
      }
    }
  }

  async toggleMusic() {
    this.init();
    await this.resume();

    if (this.isPlayingMusic) {
      this.musicEnabled = false;
      this.stopMusic();
    } else {
      this.musicEnabled = true;
      this.startMusic();
    }
    return this.musicEnabled;
  }

  // --- MELODIC CHILL/UPBEAT SYNTHWAVE BACKGROUND MUSIC ---
  async startMusic() {
    this.init();
    await this.resume();
    if (!this.musicEnabled || this.isPlayingMusic) return;

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
    const bpm = 124;
    const stepDuration = 60 / bpm / 2; // 8th note rhythm

    const playStep = () => {
      if (!this.isPlayingMusic || !this.musicEnabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const measure = Math.floor(this.step / 8) % 4;
      const beatInMeasure = this.step % 8;

      // Warm bass pulse on beats 0, 2, 4, 6
      if (beatInMeasure % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bassGain = this.ctx.createGain();

        bassOsc.type = 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassNotes[measure], t);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(360, t);
        bassFilter.frequency.exponentialRampToValueAtTime(110, t + 0.22);

        bassGain.gain.setValueAtTime(0.3, t);
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
          padFilter.frequency.setValueAtTime(650, t);

          padGain.gain.setValueAtTime(0.1, t);
          padGain.gain.linearRampToValueAtTime(0.18, t + 0.4);
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
      hatOsc.frequency.setValueAtTime(beatInMeasure % 4 === 0 ? 1200 : 850, t);
      hatGain.gain.setValueAtTime(0.06, t);
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
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
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
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.06);

    gain.gain.setValueAtTime(0.25, t);
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

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);

    gain.gain.setValueAtTime(0.7, t);
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
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playButtonHover() {
    if (!this.sfxEnabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.02);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  speak() {}
  setTempo() {}
  playSuperSmash() { this.playPaddleHit(2.0); }
  playPerfectDeflect() { this.playPaddleHit(1.5); }
  playMineHit() { this.playWallBounce(); }
  playMineAttach() { this.playWallBounce(); }
}

export const sound = new SoundManager();

// ============================================================================
// AUDIO SYSTEM FOR "ME VS ME" - PROCEDURAL WEB AUDIO SYNTHESIZER
// Zero external assets required, zero loading delays, 100% dynamic
// ============================================================================

class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.voiceEnabled = true;
    this.bgmPlaying = false;
    this.tempo = 124;
    this.bgmTimer = null;
    this.step = 0;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SOUND EFFECTS ---

  playPaddleHit(speedRatio = 1.0, isSuper = false) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Laser / kinetic slap tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = isSuper ? 'sawtooth' : 'triangle';
    const baseFreq = isSuper ? 520 : 320;
    const endFreq = isSuper ? 160 : 120;
    
    osc.frequency.setValueAtTime(baseFreq * (0.8 + speedRatio * 0.4), t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.12);

    gain.gain.setValueAtTime(isSuper ? 0.8 : 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);

    // Punchy transient click
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(800, t);
    click.frequency.exponentialRampToValueAtTime(80, t + 0.04);
    clickGain.gain.setValueAtTime(0.6, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    click.connect(clickGain);
    clickGain.connect(this.sfxGain);
    click.start(t);
    click.stop(t + 0.04);
  }

  playWallBounce(speed = 1.0) {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180 + Math.min(speed * 15, 200), t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playPerfectDeflect() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Harmonic chiming shimmer
    [440, 660, 880, 1320].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.03);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.3);

      gain.gain.setValueAtTime(0.3 / (idx + 1), t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.03);
      osc.stop(t + 0.35);
    });
  }

  playMineHit() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Metallic chime + electric buzz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1174, t + 0.04);
    osc.frequency.setValueAtTime(659, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playMineAttach() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Warning magnetic snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.15);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playGoal() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // 808 Sub Boom Explosion
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.8);

    subGain.gain.setValueAtTime(1.0, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.9);

    // Synth fanfare chord
    [330, 415, 495, 660].forEach((freq) => {
      const fan = this.ctx.createOscillator();
      const fanGain = this.ctx.createGain();
      fan.type = 'sawtooth';
      fan.frequency.setValueAtTime(freq, t + 0.05);
      fanGain.gain.setValueAtTime(0.2, t + 0.05);
      fanGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      fan.connect(fanGain);
      fanGain.connect(this.sfxGain);
      fan.start(t + 0.05);
      fan.stop(t + 0.7);
    });
  }

  playPowerup() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Arpeggio chime
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      gain.gain.setValueAtTime(0.25, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.15);
    });
  }

  playSuperSmash() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Cyber laser beam sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);

    gain.gain.setValueAtTime(0.65, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  playButtonHover() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.04);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playButtonClick() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.07);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // --- ROBOTIC ANNOUNCER SYSTEM (SpeechSynthesis) ---
  speak(phrase, pitch = 0.8, rate = 1.15) {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(phrase);
      utter.pitch = pitch;
      utter.rate = rate;
      utter.volume = 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      // Try finding an English or robotic-sounding voice
      const roboticVoice = voices.find(v => 
        v.name.toLowerCase().includes('google') || 
        v.name.toLowerCase().includes('david') || 
        v.name.toLowerCase().includes('zarvox') ||
        v.name.toLowerCase().includes('daniel')
      ) || voices[0];
      
      if (roboticVoice) utter.voice = roboticVoice;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  // --- PROCEDURAL CYBERPUNK BGM SYNTHESIZER ---
  startBGM() {
    if (this.bgmPlaying || !this.enabled || !this.ctx) return;
    this.resume();
    this.bgmPlaying = true;
    this.step = 0;
    
    // 16-step synthwave bassline & arpeggio
    const bassNotes = [55, 55, 65.4, 55, 73.4, 55, 65.4, 49, 55, 55, 82.4, 55, 73.4, 65.4, 55, 49]; // A, C, D, B
    const arpNotes = [220, 261.6, 329.6, 440, 392, 329.6, 261.6, 220, 246.9, 293.7, 349.2, 440, 392, 349.2, 293.7, 246.9];

    const stepInterval = (60 / this.tempo) / 4; // 16th note

    const tick = () => {
      if (!this.bgmPlaying) return;
      const t = this.ctx.currentTime;
      const curStep = this.step % 16;

      // Kick drum on 0, 4, 8, 12
      if (curStep % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(130, t);
        kick.frequency.exponentialRampToValueAtTime(32, t + 0.12);
        kGain.gain.setValueAtTime(0.5, t);
        kGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        kick.connect(kGain);
        kGain.connect(this.musicGain);
        kick.start(t);
        kick.stop(t + 0.14);
      }

      // Snare on 4, 12 (noise buffer)
      if (curStep === 4 || curStep === 12) {
        const noise = this.ctx.createOscillator();
        const nGain = this.ctx.createGain();
        noise.type = 'triangle';
        noise.frequency.setValueAtTime(240, t);
        noise.frequency.exponentialRampToValueAtTime(60, t + 0.08);
        nGain.gain.setValueAtTime(0.25, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        noise.connect(nGain);
        nGain.connect(this.musicGain);
        noise.start(t);
        noise.stop(t + 0.09);
      }

      // Bass synth on 16th notes
      const bassOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassNotes[curStep], t);
      bGain.gain.setValueAtTime(0.2, t);
      bGain.gain.exponentialRampToValueAtTime(0.01, t + stepInterval * 0.9);
      bassOsc.connect(bGain);
      bGain.connect(this.musicGain);
      bassOsc.start(t);
      bassOsc.stop(t + stepInterval * 0.9);

      // High cyber arpeggio
      if (curStep % 2 === 0) {
        const arpOsc = this.ctx.createOscillator();
        const aGain = this.ctx.createGain();
        arpOsc.type = 'sine';
        arpOsc.frequency.setValueAtTime(arpNotes[curStep], t);
        aGain.gain.setValueAtTime(0.12, t);
        aGain.gain.exponentialRampToValueAtTime(0.001, t + stepInterval * 1.5);
        arpOsc.connect(aGain);
        aGain.connect(this.musicGain);
        arpOsc.start(t);
        arpOsc.stop(t + stepInterval * 1.5);
      }

      this.step++;
      this.bgmTimer = setTimeout(tick, stepInterval * 1000);
    };

    tick();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  setTempo(rallyCount) {
    // Increase tempo dynamically during high rally volleys!
    this.tempo = Math.min(170, 124 + rallyCount * 2.5);
  }
}

export const sound = new SoundFX();

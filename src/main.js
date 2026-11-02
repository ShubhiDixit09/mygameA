import { Arena3D } from './arena3d.js';
import { GameEngine, GAME_MODES } from './game.js';
import { sound } from './audio.js';
import confetti from 'canvas-confetti';

// --- INITIALIZE CORE ENGINES ---
const container = document.getElementById('canvas-container');
const arena = new Arena3D(container);
const game = new GameEngine(arena);

// UI DOM References
const menuScreen = document.getElementById('menu-screen');
const gameHud = document.getElementById('game-hud');
const gameOverScreen = document.getElementById('gameover-screen');
const announcementEl = document.getElementById('hud-announcement');

// HUD Elements
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const p2LabelEl = document.getElementById('p2-label');
const p2ControlLabelEl = document.getElementById('p2-control-label');
const hudSpeedEl = document.getElementById('hud-speed');
const hudRallyEl = document.getElementById('hud-rally');
const p1MeterValEl = document.getElementById('p1-meter-val');
const p1MeterBarEl = document.getElementById('p1-meter-bar');
const p2MeterValEl = document.getElementById('p2-meter-val');
const p2MeterBarEl = document.getElementById('p2-meter-bar');
const camLabelEl = document.getElementById('cam-label');

// Custom Cursor Elements
const cursor = document.getElementById('custom-cursor');
const cursorDot = document.getElementById('custom-cursor-dot');

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let curX = mouseX;
let curY = mouseY;

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = `${mouseX}px`;
  cursorDot.style.top = `${mouseY}px`;

  const normX = (e.clientX / window.innerWidth) * 2 - 1;
  const normY = (e.clientY / window.innerHeight) * 2 - 1;

  // Dynamic 3D Parallax for Background Art
  arena.mouseParallax.x = normX;
  arena.mouseParallax.y = -normY;

  // Instant zero-delay mouse control for Player 1
  if (game.state === 'PLAYING') {
    game.setPlayer1Target(normX * 18, normY * 11);
  }
});

// Click anywhere on canvas / field to deflect with zero delay!
window.addEventListener('mousedown', (e) => {
  if (game.state === 'PLAYING' && !e.target.closest('button')) {
    game.triggerDeflect(game.p1);
  }
});

// Mobile / Tablet touch dragging
window.addEventListener('touchmove', (e) => {
  if (game.state === 'PLAYING' && e.touches[0]) {
    const t = e.touches[0];
    const normX = (t.clientX / window.innerWidth) * 2 - 1;
    const normY = (t.clientY / window.innerHeight) * 2 - 1;
    game.setPlayer1Target(normX * 18, normY * 11);
  }
}, { passive: true });

function updateCursor() {
  curX += (mouseX - curX) * 0.25;
  curY += (mouseY - curY) * 0.25;
  cursor.style.left = `${curX}px`;
  cursor.style.top = `${curY}px`;
  requestAnimationFrame(updateCursor);
}
requestAnimationFrame(updateCursor);

// Add hover effect
document.querySelectorAll('button, .mode-segment, .rule-card').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '42px';
    cursor.style.height = '42px';
    cursor.style.borderColor = 'var(--gold)';
    sound.playButtonHover();
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '22px';
    cursor.style.height = '22px';
    cursor.style.borderColor = 'var(--gold)';
  });
});

// --- AUDIO INITIALIZATION ON FIRST INTERACTION ---
function handleFirstInteraction() {
  sound.init();
  window.removeEventListener('click', handleFirstInteraction);
  window.removeEventListener('keydown', handleFirstInteraction);
}
window.addEventListener('click', handleFirstInteraction);
window.addEventListener('keydown', handleFirstInteraction);

// --- UNIFIED MODE SELECTION & LAUNCHER ---
let selectedMode = GAME_MODES.AI_NEMESIS;

const modeSegments = document.querySelectorAll('.mode-segment');
const startDuelBtn = document.getElementById('start-duel-btn');

modeSegments.forEach((tab) => {
  tab.addEventListener('click', () => {
    modeSegments.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    selectedMode = tab.getAttribute('data-mode');
    sound.playButtonClick();
  });
});

if (startDuelBtn) {
  startDuelBtn.addEventListener('click', () => {
    sound.playButtonClick();
    startMatch(selectedMode);
  });
}

function startMatch(mode) {
  menuScreen.classList.add('hidden');
  gameOverScreen.classList.remove('active');
  gameHud.classList.add('active');

  // Update HUD labels for chosen mode
  if (mode === GAME_MODES.PVP_LOCAL) {
    p2LabelEl.textContent = 'ME [SHADOW - P2]';
    p2ControlLabelEl.textContent = 'SHADOW OVERDRIVE [ENTER]';
  } else if (mode === GAME_MODES.BRAIN_SPLIT) {
    p2LabelEl.textContent = 'ME [RIGHT BRAIN]';
    p2ControlLabelEl.textContent = 'RIGHT BRAIN [ENTER]';
  } else if (mode === GAME_MODES.AI_SOLIPSISM) {
    p2LabelEl.textContent = 'PARADOX GOD [AI]';
    p2ControlLabelEl.textContent = 'GOD AI OVERDRIVE';
  } else {
    p2LabelEl.textContent = 'ME [SHADOW AI]';
    p2ControlLabelEl.textContent = 'SHADOW AI OVERDRIVE';
  }

  game.startMatch(mode);
  showAnnouncement('DUEL COMMENCE!', 1200);
}

// --- HUD BUTTON ACTIONS ---
const camModes = ['dynamic', 'tactical', 'orbit'];
let currentCamIdx = 0;
const hudCamBtn = document.getElementById('hud-cam-btn');
if (hudCamBtn) {
  hudCamBtn.addEventListener('click', () => {
    currentCamIdx = (currentCamIdx + 1) % camModes.length;
    const nextCam = camModes[currentCamIdx];
    arena.setCameraMode(nextCam);
    if (camLabelEl) camLabelEl.textContent = `CAM: ${nextCam.toUpperCase()}`;
    sound.playButtonClick();
  });
}

const hudMenuBtn = document.getElementById('hud-menu-btn');
if (hudMenuBtn) {
  hudMenuBtn.addEventListener('click', () => {
    sound.playButtonClick();
    returnToMenu();
  });
}

function returnToMenu() {
  game.state = 'MENU';
  gameHud.classList.remove('active');
  gameOverScreen.classList.remove('active');
  menuScreen.classList.remove('hidden');
}

// --- BACKGROUND MUSIC TOGGLE (INSTANT ON / OFF) ---
const toggleAudioBtn = document.getElementById('toggle-audio-btn');
const hudMusicBtn = document.getElementById('hud-music-btn');
const soundStatusEl = document.getElementById('sound-status');
const hudMusicStatusEl = document.getElementById('hud-music-status');

function updateMusicUI(enabled) {
  const text = enabled ? 'ON' : 'OFF';
  if (soundStatusEl) soundStatusEl.textContent = text;
  if (hudMusicStatusEl) hudMusicStatusEl.textContent = `MUSIC: ${text}`;
}

if (toggleAudioBtn) {
  toggleAudioBtn.addEventListener('click', () => {
    const isNowOn = sound.toggleMusic();
    updateMusicUI(isNowOn);
  });
}

if (hudMusicBtn) {
  hudMusicBtn.addEventListener('click', () => {
    const isNowOn = sound.toggleMusic();
    updateMusicUI(isNowOn);
  });
}

// --- REMATCH & EXIT ---
const rematchBtn = document.getElementById('rematch-btn');
if (rematchBtn) {
  rematchBtn.addEventListener('click', () => {
    sound.playButtonClick();
    startMatch(game.mode);
  });
}

const exitBtn = document.getElementById('exit-btn');
if (exitBtn) {
  exitBtn.addEventListener('click', () => {
    sound.playButtonClick();
    returnToMenu();
  });
}

// Spacebar Rematch listener when game over
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && game.state === 'GAME_OVER') {
    startMatch(game.mode);
  }
});

// Floating Announcement Helper
let announceTimeout = null;
function showAnnouncement(text, duration = 1200) {
  if (announceTimeout) clearTimeout(announceTimeout);
  announcementEl.textContent = text;
  announcementEl.classList.add('show');
  announceTimeout = setTimeout(() => {
    announcementEl.classList.remove('show');
  }, duration);
}

// --- MAIN LOOP ---
let lastFrameTime = performance.now();
let lastScore1 = 0;
let lastScore2 = 0;

function mainLoop(currentTime) {
  const delta = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
  lastFrameTime = currentTime;

  // 1. Update Game Physics & AI
  game.update(delta);

  // 2. Detect Score changes for announcements
  if (game.score1 !== lastScore1) {
    lastScore1 = game.score1;
    showAnnouncement('ORIGIN POINT!', 1400);
  }
  if (game.score2 !== lastScore2) {
    lastScore2 = game.score2;
    showAnnouncement('SHADOW BREACH!', 1400);
  }

  // 3. Update HUD Display
  const state = game.getGameState();
  p1ScoreEl.textContent = state.score1;
  p2ScoreEl.textContent = state.score2;
  hudSpeedEl.textContent = state.puck.speedKmH || 0;
  hudRallyEl.textContent = `VOLLEY STREAK: ${state.rallyCount}`;

  // Super Meters
  p1MeterValEl.textContent = `${Math.round(state.p1.superMeter)}%`;
  p1MeterBarEl.style.width = `${state.p1.superMeter}%`;
  p2MeterValEl.textContent = `${Math.round(state.p2.superMeter)}%`;
  p2MeterBarEl.style.width = `${state.p2.superMeter}%`;

  // Mine Dots
  const m1 = document.getElementById('p1-mine-0');
  if (m1) m1.className = `mine-dot ${state.p1.attachedMines >= 1 ? 'active' : ''}`;
  const m2 = document.getElementById('p1-mine-1');
  if (m2) m2.className = `mine-dot ${state.p1.attachedMines >= 2 ? 'active' : ''}`;
  const m3 = document.getElementById('p2-mine-0');
  if (m3) m3.className = `mine-dot ${state.p2.attachedMines >= 1 ? 'active' : ''}`;
  const m4 = document.getElementById('p2-mine-1');
  if (m4) m4.className = `mine-dot ${state.p2.attachedMines >= 2 ? 'active' : ''}`;

  // 4. Check Game Over Trigger
  if (game.state === 'GAME_OVER' && !gameOverScreen.classList.contains('active')) {
    onGameOver(state);
  }

  // 5. Render 3D Scene
  arena.update(state);

  requestAnimationFrame(mainLoop);
}

function onGameOver(state) {
  gameOverScreen.classList.add('active');
  const p1Won = state.score1 >= game.winningScore;

  const winnerEl = document.getElementById('gameover-winner');
  const flavorEl = document.getElementById('gameover-flavor');

  if (p1Won) {
    winnerEl.textContent = 'ORIGIN PREVAILED';
    winnerEl.style.color = 'var(--cyan)';
    flavorEl.textContent = 'YOU HAVE CONQUERED YOUR SHADOW SELF';
    // Confetti celebration burst
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#ff0055', '#ffdd00', '#ffffff']
    });
  } else {
    winnerEl.textContent = 'SHADOW CONSUMED YOU';
    winnerEl.style.color = 'var(--magenta)';
    flavorEl.textContent = 'THE PARALLEL REFLECTION REIGNS SUPREME';
  }

  document.getElementById('stat-final-score').textContent = `${state.score1} - ${state.score2}`;
  document.getElementById('stat-max-speed').textContent = `${state.maxSpeedKmH} KM/H`;
  document.getElementById('stat-longest-rally').textContent = `${state.longestRally} VOLLEYS`;
  document.getElementById('stat-deflects').textContent = `${state.perfectDeflectsP1 + state.perfectDeflectsP2}`;
}

// Start animation loop
requestAnimationFrame(mainLoop);

// --- TOUCH / MOBILE ON-SCREEN JOYSTICK ---
const touchLeft = document.getElementById('touch-left');
const knobLeft = document.getElementById('knob-left');
let touchActive = false;
let touchOrigin = { x: 0, y: 0 };

if (touchLeft) {
  touchLeft.addEventListener('touchstart', (e) => {
    touchActive = true;
    const t = e.touches[0];
    const rect = touchLeft.getBoundingClientRect();
    touchOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!touchActive) return;
    const t = e.touches[0];
    const dx = t.clientX - touchOrigin.x;
    const dy = t.clientY - touchOrigin.y;
    const dist = Math.hypot(dx, dy);
    const maxR = 40;
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    knobLeft.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    if (dist > 8) {
      game.p1.vx = (dx / dist) * game.p1.speed;
      game.p1.vz = (dy / dist) * game.p1.speed;
    } else {
      game.p1.vx = 0;
      game.p1.vz = 0;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    touchActive = false;
    knobLeft.style.transform = 'translate(-50%, -50%)';
    game.p1.vx = 0;
    game.p1.vz = 0;
  });

  // Tap anywhere on the right side of the screen on touch devices to deflect!
  const touchRight = document.getElementById('touch-right');
  if (touchRight) {
    touchRight.addEventListener('touchstart', (e) => {
      e.preventDefault();
      game.triggerDeflect(game.p1);
    });
  }
}


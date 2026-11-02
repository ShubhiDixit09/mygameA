import { ARENA_WIDTH, ARENA_HEIGHT, GOAL_SIZE } from './arena3d.js';
import { sound } from './audio.js';

export const GAME_MODES = {
  PVP_LOCAL: 'pvp_local',   // 1v1 on same keyboard
  AI_ECHO: 'ai_echo',       // Solo vs Casual AI
  AI_NEMESIS: 'ai_nemesis', // Solo vs Ruthless AI
  AI_SOLIPSISM: 'ai_god',   // Solo vs Paradox God AI
  BRAIN_SPLIT: 'brain_split'// Control both yourself!
};

export class GameEngine {
  constructor(arena3d) {
    this.arena = arena3d;

    // Game state
    this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'ROUND_TRANSITION' | 'GAME_OVER'
    this.mode = GAME_MODES.AI_NEMESIS;
    this.winningScore = 7;

    // Scores & Match Stats
    this.score1 = 0;
    this.score2 = 0;
    this.rallyCount = 0;
    this.longestRally = 0;
    this.maxSpeedKmH = 0;
    this.perfectDeflectsP1 = 0;
    this.perfectDeflectsP2 = 0;
    this.matchStartTime = 0;

    // Players
    this.p1 = this.createPlayer(-11, 0, 1);
    this.p2 = this.createPlayer(11, 0, 2);

    // Puck
    this.puck = this.createPuck();

    // 3 Klask Magnetic Mines
    this.mines = [];
    this.resetMines();

    // Inputs
    this.keys = {};
    this.setupInputListeners();

    // Timing
    this.lastTime = performance.now();
    this.transitionTimer = 0;
    this.lastScorer = null;
  }

  createPlayer(x, z, id) {
    return {
      id,
      x,
      z,
      vx: 0,
      vz: 0,
      radius: 1.25,
      speed: 28,
      superMeter: 0,      // 0 - 100
      isSuperReady: false,
      deflectActive: false,
      deflectTimer: 0,
      attachedMines: 0,
      lastDeflectTime: 0
    };
  }

  createPuck() {
    return {
      x: 0,
      z: 0,
      vx: 0,
      vz: 0,
      radius: 0.8,
      spin: 0,
      speedKmH: 0,
      lastHitter: 0
    };
  }

  resetMines() {
    this.mines = [
      { id: 0, x: 0, z: -4.5, vx: 0, vz: 0, radius: 0.55, attachedTo: null },
      { id: 1, x: 0, z: 0,    vx: 0, vz: 0, radius: 0.55, attachedTo: null },
      { id: 2, x: 0, z: 4.5,  vx: 0, vz: 0, radius: 0.55, attachedTo: null }
    ];
  }

  setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // P1 Deflection (Spacebar)
      if (e.code === 'Space' && this.state === 'PLAYING') {
        this.triggerDeflect(this.p1);
      }

      // P2 Deflection (Enter / Numpad0)
      if ((e.code === 'Enter' || e.code === 'Numpad0') && this.state === 'PLAYING') {
        if (this.mode === GAME_MODES.PVP_LOCAL || this.mode === GAME_MODES.BRAIN_SPLIT) {
          this.triggerDeflect(this.p2);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  startMatch(mode = GAME_MODES.AI_NEMESIS) {
    this.mode = mode;
    this.score1 = 0;
    this.score2 = 0;
    this.rallyCount = 0;
    this.longestRally = 0;
    this.maxSpeedKmH = 0;
    this.perfectDeflectsP1 = 0;
    this.perfectDeflectsP2 = 0;
    this.matchStartTime = performance.now();

    this.p1 = this.createPlayer(-11, 0, 1);
    this.p2 = this.createPlayer(11, 0, 2);
    this.resetMines();
    this.servePuck(1);

    this.state = 'PLAYING';
    sound.startBGM();
    sound.speak('Duelling conscious initiated. Me versus me.');
  }

  servePuck(direction = 1) {
    this.puck.x = 0;
    this.puck.z = (Math.random() - 0.5) * 4;
    const initialSpeed = 16;
    const angle = (Math.random() - 0.5) * 0.8;
    this.puck.vx = direction * Math.cos(angle) * initialSpeed;
    this.puck.vz = Math.sin(angle) * initialSpeed;
    this.puck.spin = 0;
    this.puck.lastHitter = 0;
    this.rallyCount = 0;
    sound.setTempo(0);
  }

  triggerDeflect(player) {
    const now = performance.now();
    if (now - player.lastDeflectTime < 350) return; // cooldown
    player.lastDeflectTime = now;
    player.deflectActive = true;
    player.deflectTimer = 0.22; // active window (220ms)

    this.arena.triggerDeflectShield(player.id);

    // Check if puck is close enough for a PERFECT REFLECT
    const dx = this.puck.x - player.x;
    const dz = this.puck.z - player.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < player.radius + this.puck.radius + 1.8) {
      // PERFORM PERFECT DEFLECTION!
      const nx = dx / dist;
      const nz = dz / dist;
      
      const currentSpeed = Math.sqrt(this.puck.vx * this.puck.vx + this.puck.vz * this.puck.vz);
      const boostedSpeed = Math.min(48, currentSpeed * 1.5 + 4);

      this.puck.vx = nx * boostedSpeed;
      this.puck.vz = nz * boostedSpeed;
      this.puck.lastHitter = player.id;
      this.puck.spin = (Math.random() - 0.5) * 0.5;

      player.superMeter = Math.min(100, player.superMeter + 40);
      if (player.id === 1) this.perfectDeflectsP1++;
      else this.perfectDeflectsP2++;

      sound.playPerfectDeflect();
      this.arena.spawnSparkBurst(this.puck.x, this.puck.z, 0xffffff, 25);
      this.arena.triggerScreenShake(0.35);
    }
  }

  update(delta) {
    if (this.state === 'MENU') {
      // Gentle ambient hover motion during menu
      const t = performance.now() * 0.0015;
      this.p1.z = Math.sin(t) * 3.5;
      this.p2.z = Math.cos(t * 1.2) * 3.5;
      this.puck.x = Math.sin(t * 1.8) * 6;
      this.puck.z = Math.cos(t * 1.4) * 4;
      return;
    }

    if (this.state !== 'PLAYING' && this.state !== 'ROUND_TRANSITION') return;

    if (this.state === 'ROUND_TRANSITION') {
      this.transitionTimer -= delta;
      if (this.transitionTimer <= 0) {
        if (this.score1 >= this.winningScore || this.score2 >= this.winningScore) {
          this.endMatch();
        } else {
          this.state = 'PLAYING';
          if (this.score1 === this.winningScore - 1 || this.score2 === this.winningScore - 1) {
            sound.speak('Warning. Match point.');
          }
          this.servePuck(this.lastScorer === 1 ? -1 : 1);
        }
      }
      return;
    }

    // 1. Process Inputs
    this.updatePlayerInputs(delta);

    // 2. Process AI if not 1v1 local
    if (this.mode.startsWith('ai_')) {
      this.updateAI(delta);
    }

    // 3. Move Entities
    this.movePlayer(this.p1, delta, -ARENA_WIDTH / 2 + 1.5, -0.8);
    this.movePlayer(this.p2, delta, 0.8, ARENA_WIDTH / 2 - 1.5);

    // 4. Update Puck Physics
    this.updatePuck(delta);

    // 5. Update Magnetic Mines (Klask hazard)
    this.updateMines(delta);

    // 6. Check Collisions
    this.checkPaddlePuckCollision(this.p1);
    this.checkPaddlePuckCollision(this.p2);

    // 7. Check Goals
    this.checkGoal();
  }

  updatePlayerInputs(delta) {
    // Player 1 (WASD)
    let p1MoveX = 0;
    let p1MoveZ = 0;
    if (this.keys['KeyW']) p1MoveZ -= 1;
    if (this.keys['KeyS']) p1MoveZ += 1;
    if (this.keys['KeyA']) p1MoveX -= 1;
    if (this.keys['KeyD']) p1MoveX += 1;

    // Normalize
    const len1 = Math.hypot(p1MoveX, p1MoveZ);
    if (len1 > 0) {
      this.p1.vx = (p1MoveX / len1) * this.p1.speed;
      this.p1.vz = (p1MoveZ / len1) * this.p1.speed;
    } else {
      this.p1.vx *= 0.8;
      this.p1.vz *= 0.8;
    }

    // Spin slice triggers
    if (this.keys['KeyQ']) this.p1.vz -= 6;
    if (this.keys['KeyE']) this.p1.vz += 6;

    // Player 2 / Local PVP (Arrow Keys)
    if (this.mode === GAME_MODES.PVP_LOCAL || this.mode === GAME_MODES.BRAIN_SPLIT) {
      let p2MoveX = 0;
      let p2MoveZ = 0;
      if (this.keys['ArrowUp']) p2MoveZ -= 1;
      if (this.keys['ArrowDown']) p2MoveZ += 1;
      if (this.keys['ArrowLeft']) p2MoveX -= 1;
      if (this.keys['ArrowRight']) p2MoveX += 1;

      const len2 = Math.hypot(p2MoveX, p2MoveZ);
      if (len2 > 0) {
        this.p2.vx = (p2MoveX / len2) * this.p2.speed;
        this.p2.vz = (p2MoveZ / len2) * this.p2.speed;
      } else {
        this.p2.vx *= 0.8;
        this.p2.vz *= 0.8;
      }
    }

    // Super Smashing with Space / Enter
    if (this.keys['ShiftLeft'] && this.p1.superMeter >= 100) {
      this.activateSuperSmash(this.p1);
    }
    if (this.keys['ShiftRight'] && this.p2.superMeter >= 100 && (this.mode === GAME_MODES.PVP_LOCAL || this.mode === GAME_MODES.BRAIN_SPLIT)) {
      this.activateSuperSmash(this.p2);
    }
  }

  updateAI(delta) {
    const ai = this.p2;
    const puck = this.puck;
    
    // AI Difficulty parameters
    let reactionSpeed = 22;
    let predictRatio = 0.5;
    let aggressiveSmash = false;

    if (this.mode === GAME_MODES.AI_ECHO) {
      reactionSpeed = 18;
      predictRatio = 0.3;
    } else if (this.mode === GAME_MODES.AI_NEMESIS) {
      reactionSpeed = 26;
      predictRatio = 0.75;
      aggressiveSmash = true;
    } else if (this.mode === GAME_MODES.AI_SOLIPSISM) {
      reactionSpeed = 31;
      predictRatio = 0.95;
      aggressiveSmash = true;
    }

    // Predict puck arrival Z
    let targetZ = puck.z;
    let targetX = 11; // default holding position

    if (puck.vx > 0) {
      // Puck is approaching AI side
      const timeToReach = Math.max(0.01, (ai.x - puck.x) / puck.vx);
      targetZ = puck.z + (puck.vz * timeToReach) * predictRatio;
      targetX = Math.max(2.5, Math.min(15, puck.x + 1.2));

      // AI Deflect chance when close
      const dist = Math.hypot(puck.x - ai.x, puck.z - ai.z);
      if (dist < 3.2 && Math.random() < (this.mode === GAME_MODES.AI_SOLIPSISM ? 0.85 : 0.45)) {
        this.triggerDeflect(ai);
      }
    } else {
      // Puck moving away, return to strategic center
      targetZ = 0;
      targetX = 11.5;
    }

    // Avoid attached mines
    this.mines.forEach(m => {
      if (!m.attachedTo) {
        const mDist = Math.hypot(m.x - ai.x, m.z - ai.z);
        if (mDist < 2.5) {
          // Push target away from mine
          targetZ += (ai.z > m.z ? 2 : -2);
        }
      }
    });

    // Move AI toward target
    const dz = targetZ - ai.z;
    const dx = targetX - ai.x;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.4) {
      ai.vx = (dx / dist) * Math.min(dist * 10, reactionSpeed);
      ai.vz = (dz / dist) * Math.min(dist * 10, reactionSpeed);
    } else {
      ai.vx *= 0.7;
      ai.vz *= 0.7;
    }

    // AI Super Smash trigger
    if (aggressiveSmash && ai.superMeter >= 100 && puck.vx > 0 && Math.hypot(puck.x - ai.x, puck.z - ai.z) < 3.5) {
      this.activateSuperSmash(ai);
    }
  }

  movePlayer(player, delta, minX, maxX) {
    player.x += player.vx * delta;
    player.z += player.vz * delta;

    // Boundaries
    const halfH = ARENA_HEIGHT / 2 - player.radius;
    player.x = Math.max(minX, Math.min(maxX, player.x));
    player.z = Math.max(-halfH, Math.min(halfH, player.z));

    if (player.deflectTimer > 0) {
      player.deflectTimer -= delta;
      if (player.deflectTimer <= 0) player.deflectActive = false;
    }
  }

  updatePuck(delta) {
    const p = this.puck;

    // Magnus effect / Spin curve
    p.vz += p.spin * 14 * delta;
    p.spin *= 0.985; // spin decay

    p.x += p.vx * delta;
    p.z += p.vz * delta;

    // Calculate real-time speed in km/h
    const velocity = Math.hypot(p.vx, p.vz);
    p.speedKmH = Math.round(velocity * 4.2);
    if (p.speedKmH > this.maxSpeedKmH) this.maxSpeedKmH = p.speedKmH;

    const halfW = ARENA_WIDTH / 2 - p.radius;
    const halfH = ARENA_HEIGHT / 2 - p.radius;
    const goalHalfZ = GOAL_SIZE / 2;

    // Top and Bottom Wall Collisions
    if (p.z < -halfH) {
      p.z = -halfH;
      p.vz = Math.abs(p.vz) * 0.98;
      sound.playWallBounce(velocity);
      this.arena.spawnSparkBurst(p.x, p.z, 0x00f0ff, 8);
    } else if (p.z > halfH) {
      p.z = halfH;
      p.vz = -Math.abs(p.vz) * 0.98;
      sound.playWallBounce(velocity);
      this.arena.spawnSparkBurst(p.x, p.z, 0x00f0ff, 8);
    }

    // Left and Right Wall Collisions (outside goal opening)
    if (Math.abs(p.z) > goalHalfZ) {
      if (p.x < -halfW) {
        p.x = -halfW;
        p.vx = Math.abs(p.vx) * 0.98;
        sound.playWallBounce(velocity);
        this.arena.spawnSparkBurst(p.x, p.z, 0x00f0ff, 12);
      } else if (p.x > halfW) {
        p.x = halfW;
        p.vx = -Math.abs(p.vx) * 0.98;
        sound.playWallBounce(velocity);
        this.arena.spawnSparkBurst(p.x, p.z, 0xff0055, 12);
      }
    }
  }

  updateMines(delta) {
    this.mines.forEach((mine) => {
      // If attached to a player, follow them tightly
      if (mine.attachedTo) {
        const owner = mine.attachedTo === 1 ? this.p1 : this.p2;
        const angle = mine.id * (Math.PI * 2 / 3);
        mine.x = owner.x + Math.cos(angle) * (owner.radius + 0.3);
        mine.z = owner.z + Math.sin(angle) * (owner.radius + 0.3);
        return;
      }

      // Physics drift
      mine.x += mine.vx * delta;
      mine.z += mine.vz * delta;
      mine.vx *= 0.96;
      mine.vz *= 0.96;

      // Magnetic attraction to nearby players (Klask mechanism)
      [this.p1, this.p2].forEach((pl) => {
        const dx = pl.x - mine.x;
        const dz = pl.z - mine.z;
        const dist = Math.hypot(dx, dz);

        // Attraction field
        if (dist < 4.2 && dist > 0.05) {
          const force = (4.2 - dist) * 7.5;
          mine.vx += (dx / dist) * force * delta;
          mine.vz += (dz / dist) * force * delta;

          // Snap attachment
          if (dist < pl.radius + mine.radius + 0.2) {
            mine.attachedTo = pl.id;
            pl.attachedMines++;
            sound.playMineAttach();
            this.arena.spawnSparkBurst(mine.x, mine.z, 0xffdd00, 16);

            // CHECK KLASK PENALTY RULE: 2 Mines = OVERLOAD!
            if (pl.attachedMines >= 2) {
              this.triggerMineOverload(pl.id);
            }
          }
        }
      });

      // Puck hits Mine
      const pdx = this.puck.x - mine.x;
      const pdz = this.puck.z - mine.z;
      const pdist = Math.hypot(pdx, pdz);

      if (pdist < this.puck.radius + mine.radius) {
        const nx = pdx / pdist;
        const nz = pdz / pdist;

        // Elastic bounce transfer
        const dot = this.puck.vx * nx + this.puck.vz * nz;
        this.puck.vx -= 1.8 * dot * nx;
        this.puck.vz -= 1.8 * dot * nz;

        mine.vx = -nx * 14;
        mine.vz = -nz * 14;

        sound.playMineHit();
        this.arena.spawnSparkBurst(mine.x, mine.z, 0xffdd00, 14);
      }
    });
  }

  triggerMineOverload(playerId) {
    const victim = playerId === 1 ? 'ORIGIN' : 'SHADOW';
    const beneficiary = playerId === 1 ? 2 : 1;
    sound.speak('Magnetic overload! Penalty score.');
    
    if (beneficiary === 1) this.score1++;
    else this.score2++;

    this.roundEnd(beneficiary);
  }

  checkPaddlePuckCollision(player) {
    const dx = this.puck.x - player.x;
    const dz = this.puck.z - player.z;
    const dist = Math.hypot(dx, dz);
    const minDist = player.radius + this.puck.radius;

    if (dist < minDist) {
      // Normal vector
      const nx = dx / dist;
      const nz = dz / dist;

      // Prevent sticking inside
      this.puck.x = player.x + nx * minDist;
      this.puck.z = player.z + nz * minDist;

      // Relative velocity
      const rvx = this.puck.vx - player.vx;
      const rvz = this.puck.vz - player.vz;
      const velAlongNorm = rvx * nx + rvz * nz;

      if (velAlongNorm < 0) {
        const impulse = -(1 + 0.95) * velAlongNorm;
        this.puck.vx += impulse * nx;
        this.puck.vz += impulse * nz;

        // Speed ramp per volley
        const currentSpeed = Math.hypot(this.puck.vx, this.puck.vz);
        const newSpeed = Math.min(45, Math.max(18, currentSpeed * 1.05 + 0.8));
        const factor = newSpeed / currentSpeed;
        this.puck.vx *= factor;
        this.puck.vz *= factor;

        // Add player sideways motion as spin
        this.puck.spin = player.vz * 0.08;
        this.puck.lastHitter = player.id;

        // Super meter gain
        player.superMeter = Math.min(100, player.superMeter + 16);

        this.rallyCount++;
        if (this.rallyCount > this.longestRally) this.longestRally = this.rallyCount;
        sound.setTempo(this.rallyCount);

        if (this.rallyCount === 10) {
          sound.speak('Unstoppable volley streak!');
        } else if (this.puck.speedKmH > 115) {
          sound.speak('Supersonic velocity!');
        }

        sound.playPaddleHit(newSpeed / 30, false);
        this.arena.spawnSparkBurst(this.puck.x, this.puck.z, player.id === 1 ? 0x00f0ff : 0xff0055, 15);
        this.arena.triggerScreenShake(0.18);
      }
    }
  }

  activateSuperSmash(player) {
    player.superMeter = 0;
    const dir = player.id === 1 ? 1 : -1;
    this.puck.vx = dir * 46;
    this.puck.vz = (Math.random() - 0.5) * 12;
    this.puck.spin = (Math.random() - 0.5) * 0.8;
    this.puck.lastHitter = player.id;

    sound.playSuperSmash();
    sound.speak('Hyper blast overdrive!');
    this.arena.spawnSparkBurst(player.x, player.z, 0xff00ff, 40);
    this.arena.triggerScreenShake(0.6);
  }

  checkGoal() {
    const halfW = ARENA_WIDTH / 2;
    const goalHalfZ = GOAL_SIZE / 2;

    // Left Goal (Player 2 scored on Player 1)
    if (this.puck.x < -halfW && Math.abs(this.puck.z) <= goalHalfZ) {
      this.score2++;
      this.arena.spawnGoalExplosion(false);
      sound.playGoal();
      sound.speak(this.mode.startsWith('ai_') ? 'Shadow breached your matrix!' : 'Player two scores!');
      this.roundEnd(2);
    }
    // Right Goal (Player 1 scored on Player 2)
    else if (this.puck.x > halfW && Math.abs(this.puck.z) <= goalHalfZ) {
      this.score1++;
      this.arena.spawnGoalExplosion(true);
      sound.playGoal();
      sound.speak(this.mode.startsWith('ai_') ? 'Origin strike confirmed!' : 'Player one scores!');
      this.roundEnd(1);
    }
  }

  roundEnd(scorer) {
    this.lastScorer = scorer;
    this.state = 'ROUND_TRANSITION';
    this.transitionTimer = 1.6;

    // Reset paddle mine attachments
    this.p1.attachedMines = 0;
    this.p2.attachedMines = 0;
    this.resetMines();
  }

  endMatch() {
    this.state = 'GAME_OVER';
    sound.stopBGM();

    const p1Won = this.score1 >= this.winningScore;
    sound.speak(p1Won ? 'Victory! Origin consciousness conquered the shadow.' : 'Defeat! The shadow has consumed you.');
  }

  getGameState() {
    return {
      state: this.state,
      mode: this.mode,
      score1: this.score1,
      score2: this.score2,
      rallyCount: this.rallyCount,
      longestRally: this.longestRally,
      maxSpeedKmH: this.maxSpeedKmH,
      perfectDeflectsP1: this.perfectDeflectsP1,
      perfectDeflectsP2: this.perfectDeflectsP2,
      p1: this.p1,
      p2: this.p2,
      puck: this.puck,
      mines: this.mines
    };
  }
}

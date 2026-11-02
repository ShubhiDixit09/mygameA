import * as THREE from 'three';

// Arena Dimensions in 3D world units
export const ARENA_WIDTH = 34;   // X-axis (-17 to +17)
export const ARENA_HEIGHT = 20;  // Z-axis (-10 to +10)
export const GOAL_SIZE = 7.5;    // Goal width on Z-axis

export class Arena3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // 3D Objects
    this.floor = null;
    this.puckMesh = null;
    this.puckLight = null;
    this.trailPoints = [];
    this.trailLine = null;
    this.player1Mesh = null;
    this.player2Mesh = null;
    this.player1Light = null;
    this.player2Light = null;
    this.mineMeshes = [];
    this.powerupMeshes = [];
    this.particles = [];
    this.boundaryLines = [];
    this.backgroundStars = null;

    // Camera settings
    this.cameraMode = 'dynamic'; // 'dynamic' | 'tactical' | 'orbit'
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.shakeIntensity = 0;
    this.orbitAngle = 0;
    this.isSloMo = false;

    // Current Theme
    this.theme = 'neon'; // 'neon' | 'solaris' | 'void'
    this.themeColors = {
      neon: {
        bg: 0x070714,
        p1: 0x00f0ff,
        p2: 0xff0055,
        grid: 0x1a214d,
        wall: 0x3d4fd6,
        accent: 0x9d00ff,
        core: 0xffffff
      },
      solaris: {
        bg: 0x140702,
        p1: 0xffaa00,
        p2: 0xff2200,
        grid: 0x4d2110,
        wall: 0xff6600,
        accent: 0xffcc00,
        core: 0xfff0bb
      },
      void: {
        bg: 0x021208,
        p1: 0x00ff88,
        p2: 0x8800ff,
        grid: 0x0f3b1e,
        wall: 0x00cc66,
        accent: 0x00ffaa,
        core: 0xe0ffee
      }
    };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.themeColors[this.theme].bg);
    this.scene.fog = new THREE.FogExp2(this.themeColors[this.theme].bg, 0.015);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 1000);
    this.camera.position.set(0, 24, 18);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 30, 20);
    this.scene.add(dirLight);

    // 5. Build Arena Meshes
    this.createArenaFloor();
    this.createBoundaryWalls();
    this.createPuck();
    this.createPlayers();
    this.createMines();
    this.createStarfield();
    this.setupTrail();

    // Window Resize Handler
    window.addEventListener('resize', () => this.onResize());
  }

  createArenaFloor() {
    const colors = this.themeColors[this.theme];
    
    // Glowing grid plane
    const floorGeo = new THREE.PlaneGeometry(ARENA_WIDTH + 6, ARENA_HEIGHT + 6, 40, 26);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0e1b,
      roughness: 0.2,
      metalness: 0.85,
      wireframe: false
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.1;
    this.scene.add(this.floor);

    // Center divider / Mirror line
    const dividerGeo = new THREE.PlaneGeometry(0.2, ARENA_HEIGHT);
    const dividerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6
    });
    const divider = new THREE.Mesh(dividerGeo, dividerMat);
    divider.rotation.x = -Math.PI / 2;
    divider.position.y = 0.01;
    this.scene.add(divider);

    // Center circular ring (The Mirror Core)
    const ringGeo = new THREE.RingGeometry(3.2, 3.4, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    // Grid wireframe overlay
    const gridHelper = new THREE.GridHelper(ARENA_WIDTH + 6, 30, colors.wall, colors.grid);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);
  }

  createBoundaryWalls() {
    const colors = this.themeColors[this.theme];
    const halfW = ARENA_WIDTH / 2;
    const halfH = ARENA_HEIGHT / 2;
    const goalH = GOAL_SIZE / 2;

    const wallMat = new THREE.MeshStandardMaterial({
      color: colors.wall,
      emissive: colors.wall,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9
    });

    const addWall = (x, z, w, h, d) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, h / 2, z);
      this.scene.add(mesh);
      this.boundaryLines.push(mesh);
    };

    const wallThick = 0.6;
    const wallHeight = 1.0;

    // Top wall
    addWall(0, -halfH - wallThick / 2, ARENA_WIDTH + wallThick * 2, wallHeight, wallThick);
    // Bottom wall
    addWall(0, halfH + wallThick / 2, ARENA_WIDTH + wallThick * 2, wallHeight, wallThick);

    // Left Goal Posts (Upper & Lower)
    const sideWallLen = (ARENA_HEIGHT - GOAL_SIZE) / 2;
    addWall(-halfW - wallThick / 2, -halfH + sideWallLen / 2, wallThick, wallHeight, sideWallLen);
    addWall(-halfW - wallThick / 2, halfH - sideWallLen / 2, wallThick, wallHeight, sideWallLen);

    // Right Goal Posts (Upper & Lower)
    addWall(halfW + wallThick / 2, -halfH + sideWallLen / 2, wallThick, wallHeight, sideWallLen);
    addWall(halfW + wallThick / 2, halfH - sideWallLen / 2, wallThick, wallHeight, sideWallLen);

    // Neon Goal Laser Gates (Left Blue, Right Red)
    this.createGoalGates();
  }

  createGoalGates() {
    const halfW = ARENA_WIDTH / 2;
    
    // Left Goal Gate (Player 1)
    const p1GateGeo = new THREE.PlaneGeometry(0.3, GOAL_SIZE);
    const p1GateMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.p1Gate = new THREE.Mesh(p1GateGeo, p1GateMat);
    this.p1Gate.rotation.x = -Math.PI / 2;
    this.p1Gate.position.set(-halfW - 0.2, 0.4, 0);
    this.scene.add(this.p1Gate);

    // Right Goal Gate (Player 2)
    const p2GateGeo = new THREE.PlaneGeometry(0.3, GOAL_SIZE);
    const p2GateMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.p2Gate = new THREE.Mesh(p2GateGeo, p2GateMat);
    this.p2Gate.rotation.x = -Math.PI / 2;
    this.p2Gate.position.set(halfW + 0.2, 0.4, 0);
    this.scene.add(this.p2Gate);
  }

  createPuck() {
    const group = new THREE.Group();

    // Outer kinetic disc
    const discGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.35, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    group.add(discMesh);

    // Inner glowing core
    const coreGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 0.15;
    group.add(coreMesh);

    // Dynamic light on puck
    this.puckLight = new THREE.PointLight(0x00ffff, 3.5, 12);
    this.puckLight.position.set(0, 0.6, 0);
    group.add(this.puckLight);

    group.position.set(0, 0.2, 0);
    this.scene.add(group);
    this.puckMesh = group;
  }

  setupTrail() {
    this.maxTrailPoints = 25;
    const trailPositions = new Float32Array(this.maxTrailPoints * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.75,
      linewidth: 3
    });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.scene.add(this.trailLine);
  }

  createPlayers() {
    // Player 1 (ME - ORIGIN)
    this.player1Mesh = this.buildStrikerMesh(0x00f0ff, 0x0077ff);
    this.player1Mesh.position.set(-10, 0.3, 0);
    this.scene.add(this.player1Mesh);

    this.player1Light = new THREE.PointLight(0x00f0ff, 2.5, 8);
    this.player1Light.position.set(0, 0.5, 0);
    this.player1Mesh.add(this.player1Light);

    // Player 2 / Shadow (ME - SHADOW)
    this.player2Mesh = this.buildStrikerMesh(0xff0055, 0xaa0033);
    this.player2Mesh.position.set(10, 0.3, 0);
    this.scene.add(this.player2Mesh);

    this.player2Light = new THREE.PointLight(0xff0055, 2.5, 8);
    this.player2Light.position.set(0, 0.5, 0);
    this.player2Mesh.add(this.player2Light);
  }

  buildStrikerMesh(glowColor, darkColor) {
    const group = new THREE.Group();

    // Outer hover ring
    const ringGeo = new THREE.TorusGeometry(1.2, 0.22, 16, 36);
    const ringMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);

    // Inner dome handle
    const domeGeo = new THREE.SphereGeometry(0.75, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: darkColor,
      metalness: 0.9,
      roughness: 0.1
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    group.add(domeMesh);

    // Top indicator gem
    const gemGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.y = 0.7;
    group.add(gemMesh);

    // Deflector shield halo (hidden by default, pulses when deflect triggered)
    const shieldGeo = new THREE.RingGeometry(1.4, 1.8, 32);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.rotation.x = -Math.PI / 2;
    shieldMesh.position.y = 0.1;
    group.add(shieldMesh);
    group.shield = shieldMesh;

    return group;
  }

  createMines() {
    // 3 Magnetic Klask-style Hazard Mines in neutral zone
    const mineGeo = new THREE.OctahedronGeometry(0.45, 1);
    const mineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xcccccc,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9
    });

    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(mineGeo, mineMat);
      group.add(mesh);

      // Warning halo
      const ringGeo = new THREE.RingGeometry(0.55, 0.65, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);

      group.position.set(0, 0.35, (i - 1) * 4.5);
      this.scene.add(group);
      this.mineMeshes.push(group);
    }
  }

  createStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 160;
      positions[i + 1] = Math.random() * 80 - 20;
      positions[i + 2] = (Math.random() - 0.5) * 160;

      // Subtle cyan/pink/white neon stars
      const rChoice = Math.random();
      if (rChoice < 0.4) {
        colors[i] = 0.1; colors[i + 1] = 0.8; colors[i + 2] = 1.0;
      } else if (rChoice < 0.7) {
        colors[i] = 1.0; colors[i + 1] = 0.2; colors[i + 2] = 0.6;
      } else {
        colors[i] = 0.9; colors[i + 1] = 0.9; colors[i + 2] = 1.0;
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    this.backgroundStars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.backgroundStars);
  }

  // --- PARTICLE FX ---

  spawnThrusterExhaust(x, z, vx, vz, colorHex) {
    if (Math.hypot(vx, vz) < 2) return;
    if (Math.random() > 0.4) return; // limit frequency

    const pGeo = new THREE.SphereGeometry(0.12, 4, 4);
    const pMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.8
    });
    const pMesh = new THREE.Mesh(pGeo, pMat);
    // Spawn slightly behind velocity
    const speed = Math.hypot(vx, vz);
    const nx = vx / speed;
    const nz = vz / speed;
    pMesh.position.set(x - nx * 0.9, 0.2, z - nz * 0.9);

    this.scene.add(pMesh);
    this.particles.push({
      mesh: pMesh,
      vx: -nx * 2 + (Math.random() - 0.5) * 1.5,
      vy: 0.5 + Math.random() * 0.5,
      vz: -nz * 2 + (Math.random() - 0.5) * 1.5,
      life: 0.25,
      maxLife: 0.25
    });
  }

  spawnSparkBurst(x, z, colorHex, count = 18) {
    for (let i = 0; i < count; i++) {
      const pGeo = new THREE.SphereGeometry(0.1, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 1
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(x, 0.3 + Math.random() * 0.4, z);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      const vx = Math.cos(angle) * speed;
      const vz = Math.sin(angle) * speed;
      const vy = 2 + Math.random() * 4;

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        vx, vy, vz,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7
      });
    }
  }

  spawnGoalExplosion(isPlayer1Goal) {
    const x = isPlayer1Goal ? ARENA_WIDTH / 2 : -ARENA_WIDTH / 2;
    const color = isPlayer1Goal ? 0x00f0ff : 0xff0055;
    this.spawnSparkBurst(x, 0, color, 65);
    this.triggerScreenShake(0.7);
  }

  triggerScreenShake(intensity = 0.4) {
    this.shakeIntensity = intensity;
  }

  triggerDeflectShield(playerIdx) {
    const striker = playerIdx === 1 ? this.player1Mesh : this.player2Mesh;
    if (striker && striker.shield) {
      striker.shield.material.opacity = 0.9;
    }
  }

  // --- THEME SWITCHING ---
  setTheme(themeName) {
    if (!this.themeColors[themeName]) return;
    this.theme = themeName;
    const col = this.themeColors[themeName];

    this.scene.background = new THREE.Color(col.bg);
    this.scene.fog.color = new THREE.Color(col.bg);

    this.boundaryLines.forEach(wall => {
      wall.material.color.setHex(col.wall);
      wall.material.emissive.setHex(col.wall);
    });

    this.player1Light.color.setHex(col.p1);
    this.player2Light.color.setHex(col.p2);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
  }

  onResize() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- RENDER LOOP UPDATE ---
  update(gameState) {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update Puck Position & Visuals
    if (this.puckMesh && gameState.puck) {
      this.puckMesh.position.x = gameState.puck.x;
      this.puckMesh.position.z = gameState.puck.z;
      this.puckMesh.rotation.y += gameState.puck.spin || 0.1;

      // Color shifts based on speed
      const speedKmH = gameState.puck.speedKmH || 50;
      if (speedKmH > 110) {
        this.puckLight.color.setHex(0xffaa00);
      } else {
        this.puckLight.color.setHex(0x00ffff);
      }

      // Trail update
      this.trailPoints.unshift(new THREE.Vector3(gameState.puck.x, 0.2, gameState.puck.z));
      if (this.trailPoints.length > this.maxTrailPoints) {
        this.trailPoints.pop();
      }

      const positions = this.trailLine.geometry.attributes.position.array;
      for (let i = 0; i < this.trailPoints.length; i++) {
        positions[i * 3] = this.trailPoints[i].x;
        positions[i * 3 + 1] = this.trailPoints[i].y;
        positions[i * 3 + 2] = this.trailPoints[i].z;
      }
      this.trailLine.geometry.attributes.position.needsUpdate = true;
    }

    // 2. Update Players Position
    if (this.player1Mesh && gameState.p1) {
      this.player1Mesh.position.x = gameState.p1.x;
      this.player1Mesh.position.z = gameState.p1.z;
      this.player1Mesh.rotation.y += 0.03;

      // Spawn thruster particles
      this.spawnThrusterExhaust(gameState.p1.x, gameState.p1.z, gameState.p1.vx, gameState.p1.vz, 0x00f0ff);

      // Fade shield
      if (this.player1Mesh.shield.material.opacity > 0) {
        this.player1Mesh.shield.material.opacity -= delta * 3;
      }
    }

    if (this.player2Mesh && gameState.p2) {
      this.player2Mesh.position.x = gameState.p2.x;
      this.player2Mesh.position.z = gameState.p2.z;
      this.player2Mesh.rotation.y -= 0.03;

      // Spawn thruster particles
      this.spawnThrusterExhaust(gameState.p2.x, gameState.p2.z, gameState.p2.vx, gameState.p2.vz, 0xff0055);

      // Fade shield
      if (this.player2Mesh.shield.material.opacity > 0) {
        this.player2Mesh.shield.material.opacity -= delta * 3;
      }
    }

    // 3. Update Mines Position & Spin
    if (gameState.mines && gameState.mines.length > 0) {
      gameState.mines.forEach((m, idx) => {
        if (this.mineMeshes[idx]) {
          this.mineMeshes[idx].position.x = m.x;
          this.mineMeshes[idx].position.z = m.z;
          this.mineMeshes[idx].rotation.y += 0.05;
          this.mineMeshes[idx].rotation.x += 0.02;
          
          // Flash ring if attached
          const ring = this.mineMeshes[idx].children[1];
          if (ring) {
            ring.material.color.setHex(m.attachedTo ? 0xff0000 : 0xffdd00);
          }
        }
      });
    }

    // 4. Update Particle Physics
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      } else {
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        p.vy -= 9.8 * delta; // gravity
        p.mesh.material.opacity = p.life / p.maxLife;
      }
    }

    // 5. Starfield gentle drift
    if (this.backgroundStars) {
      this.backgroundStars.rotation.y = elapsedTime * 0.02;
    }

    // 6. Camera Handling
    this.updateCamera(delta, gameState);

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(delta, gameState) {
    let targetPos = new THREE.Vector3();
    let lookAtPos = new THREE.Vector3(0, 0, 0);

    if (gameState.state === 'MENU' || this.cameraMode === 'orbit') {
      // Sweeping Orbit for Menu or Orbit mode
      this.orbitAngle += delta * 0.25;
      targetPos.set(Math.sin(this.orbitAngle) * 30, 21, Math.cos(this.orbitAngle) * 26);
      lookAtPos.set(0, 0, 0);
    } else if (this.cameraMode === 'dynamic') {
      // Dynamic Action Cam: follows puck with smooth offset and speed sways
      const puckX = gameState.puck ? gameState.puck.x : 0;
      const puckZ = gameState.puck ? gameState.puck.z : 0;
      
      targetPos.set(puckX * 0.45, 22, 17 + puckZ * 0.25);
      lookAtPos.set(puckX * 0.3, 0, puckZ * 0.3);
    } else if (this.cameraMode === 'tactical') {
      // Overhead Cyber View
      targetPos.set(0, 31, 7);
      lookAtPos.set(0, 0, 0);
    }

    // Screen Shake
    if (this.shakeIntensity > 0) {
      targetPos.x += (Math.random() - 0.5) * this.shakeIntensity * 2.2;
      targetPos.y += (Math.random() - 0.5) * this.shakeIntensity * 1.5;
      targetPos.z += (Math.random() - 0.5) * this.shakeIntensity * 2.2;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 2.2);
    }

    this.camera.position.lerp(targetPos, 0.08);
    this.cameraTarget.lerp(lookAtPos, 0.08);
    this.camera.lookAt(this.cameraTarget);
  }
}

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
    this.boundaryLines = [];
    this.particles = [];
    this.backgroundStars = null;

    // Camera settings
    this.cameraMode = 'dynamic';
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.shakeIntensity = 0;
    this.orbitAngle = 0;

    // HIGH-CLARITY OBSIDIAN & GOLDEN AMBER PALETTE
    this.themeColors = {
      bg: 0x090b12,         // Deep obsidian space
      p1: 0x00f0ff,         // Radiant Cyan (P1)
      p2: 0xff3366,         // Coral Magenta (P2)
      floor: 0x0e111a,      // Sleek obsidian court
      grid: 0x1f2638,       // Subtle cyber grid
      wall: 0xffb703,       // Crisp Gold boundary rails
      accent: 0xffffff,     // Pure crisp white
      puck: 0xffffff,       // Glowing core
      mine: 0xffb703        // Amber hazard mines
    };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    const col = this.themeColors;
    this.scene.background = new THREE.Color(col.bg);
    this.scene.fog = new THREE.FogExp2(col.bg, 0.014);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 24, 18);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with high clarity
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights: Crisp, clear directional & ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(12, 32, 18);
    this.scene.add(dirLight);

    // 5. Build Arena Meshes
    this.createArenaFloor();
    this.createBoundaryWalls();
    this.createPuck();
    this.createPlayers();
    this.createMines();
    this.createStarfield();
    this.setupTrail();

    window.addEventListener('resize', () => this.onResize());
  }

  createArenaFloor() {
    const col = this.themeColors;
    
    // Sleek polished obsidian floor
    const floorGeo = new THREE.PlaneGeometry(ARENA_WIDTH + 6, ARENA_HEIGHT + 6, 40, 26);
    const floorMat = new THREE.MeshStandardMaterial({
      color: col.floor,
      roughness: 0.15,
      metalness: 0.88
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.1;
    this.scene.add(this.floor);

    // Center divider / Mirror line (Clean luminous white-gold)
    const dividerGeo = new THREE.PlaneGeometry(0.25, ARENA_HEIGHT);
    const dividerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65
    });
    const divider = new THREE.Mesh(dividerGeo, dividerMat);
    divider.rotation.x = -Math.PI / 2;
    divider.position.y = 0.01;
    this.scene.add(divider);

    // Center ring
    const ringGeo = new THREE.RingGeometry(3.2, 3.4, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    // Crisp cyber grid
    const gridHelper = new THREE.GridHelper(ARENA_WIDTH + 6, 28, col.wall, col.grid);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);
  }

  createBoundaryWalls() {
    const col = this.themeColors;
    const halfW = ARENA_WIDTH / 2;
    const halfH = ARENA_HEIGHT / 2;

    const wallMat = new THREE.MeshStandardMaterial({
      color: col.wall,
      emissive: col.wall,
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

    // Goal Posts
    const sideWallLen = (ARENA_HEIGHT - GOAL_SIZE) / 2;
    addWall(-halfW - wallThick / 2, -halfH + sideWallLen / 2, wallThick, wallHeight, sideWallLen);
    addWall(-halfW - wallThick / 2, halfH - sideWallLen / 2, wallThick, wallHeight, sideWallLen);

    addWall(halfW + wallThick / 2, -halfH + sideWallLen / 2, wallThick, wallHeight, sideWallLen);
    addWall(halfW + wallThick / 2, halfH - sideWallLen / 2, wallThick, wallHeight, sideWallLen);

    this.createGoalGates();
  }

  createGoalGates() {
    const halfW = ARENA_WIDTH / 2;
    
    // Left Goal Gate (Player 1 - Cyan)
    const p1GateGeo = new THREE.PlaneGeometry(0.3, GOAL_SIZE);
    const p1GateMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.p1Gate = new THREE.Mesh(p1GateGeo, p1GateMat);
    this.p1Gate.rotation.x = -Math.PI / 2;
    this.p1Gate.position.set(-halfW - 0.2, 0.4, 0);
    this.scene.add(this.p1Gate);

    // Right Goal Gate (Player 2 - Magenta)
    const p2GateGeo = new THREE.PlaneGeometry(0.3, GOAL_SIZE);
    const p2GateMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.p2Gate = new THREE.Mesh(p2GateGeo, p2GateMat);
    this.p2Gate.rotation.x = -Math.PI / 2;
    this.p2Gate.position.set(halfW + 0.2, 0.4, 0);
    this.scene.add(this.p2Gate);
  }

  createPuck() {
    const group = new THREE.Group();

    // Outer kinetic disc (Crisp Incandescent Glow)
    const discGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.35, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.95,
      roughness: 0.1,
      metalness: 0.95
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
    this.puckLight = new THREE.PointLight(0x00f0ff, 3.8, 14);
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
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
      linewidth: 3
    });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.scene.add(this.trailLine);
  }

  createPlayers() {
    // Player 1 (ME - ORIGIN: Electric Cyan)
    this.player1Mesh = this.buildStrikerMesh(0x00f0ff, 0x0b2545);
    this.player1Mesh.position.set(-11, 0.3, 0);
    this.scene.add(this.player1Mesh);

    this.player1Light = new THREE.PointLight(0x00f0ff, 2.8, 9);
    this.player1Light.position.set(0, 0.5, 0);
    this.player1Mesh.add(this.player1Light);

    // Player 2 / Shadow (ME - SHADOW: Coral Magenta)
    this.player2Mesh = this.buildStrikerMesh(0xff3366, 0x4a0e17);
    this.player2Mesh.position.set(11, 0.3, 0);
    this.scene.add(this.player2Mesh);

    this.player2Light = new THREE.PointLight(0xff3366, 2.8, 9);
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
      emissiveIntensity: 0.9,
      metalness: 0.85,
      roughness: 0.2
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);

    // Inner dome handle
    const domeGeo = new THREE.SphereGeometry(0.75, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: darkColor,
      metalness: 0.92,
      roughness: 0.15
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    group.add(domeMesh);

    // Top indicator gem
    const gemGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.y = 0.7;
    group.add(gemMesh);

    // Deflector shield halo
    const shieldGeo = new THREE.RingGeometry(1.4, 1.85, 32);
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
    // 3 Golden Amber Magnetic Hazard Mines
    const mineGeo = new THREE.OctahedronGeometry(0.48, 1);
    const mineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffb703,
      emissiveIntensity: 0.75,
      roughness: 0.2,
      metalness: 0.95
    });

    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(mineGeo, mineMat);
      group.add(mesh);

      // Warning halo
      const ringGeo = new THREE.RingGeometry(0.55, 0.68, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffb703,
        transparent: true,
        opacity: 0.8,
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
    const starCount = 850;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 160;
      positions[i + 1] = Math.random() * 80 - 20;
      positions[i + 2] = (Math.random() - 0.5) * 160;

      const r = Math.random();
      if (r < 0.45) {
        colors[i] = 0.2; colors[i + 1] = 0.8; colors[i + 2] = 1.0; // Cyan
      } else if (r < 0.75) {
        colors[i] = 1.0; colors[i + 1] = 0.7; colors[i + 2] = 0.1; // Gold
      } else {
        colors[i] = 0.95; colors[i + 1] = 0.95; colors[i + 2] = 1.0; // White
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.65,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.backgroundStars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.backgroundStars);
  }

  // --- PARTICLE FX ---

  spawnThrusterExhaust(x, z, vx, vz, colorHex) {
    if (Math.hypot(vx, vz) < 2) return;
    if (Math.random() > 0.4) return;

    const pGeo = new THREE.SphereGeometry(0.12, 4, 4);
    const pMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85
    });
    const pMesh = new THREE.Mesh(pGeo, pMat);
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
    const color = isPlayer1Goal ? 0x00f0ff : 0xff3366;
    this.spawnSparkBurst(x, 0, color, 65);
    this.triggerScreenShake(0.7);
  }

  triggerScreenShake(intensity = 0.4) {
    this.shakeIntensity = intensity;
  }

  triggerDeflectShield(playerIdx) {
    const striker = playerIdx === 1 ? this.player1Mesh : this.player2Mesh;
    if (striker && striker.shield) {
      striker.shield.material.opacity = 0.95;
    }
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

      const speedKmH = gameState.puck.speedKmH || 50;
      if (speedKmH > 110) {
        this.puckLight.color.setHex(0xffaa00);
      } else {
        this.puckLight.color.setHex(0x00f0ff);
      }

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

    // 2. Update Players Position & Thrusters
    if (this.player1Mesh && gameState.p1) {
      this.player1Mesh.position.x = gameState.p1.x;
      this.player1Mesh.position.z = gameState.p1.z;
      this.player1Mesh.rotation.y += 0.03;

      this.spawnThrusterExhaust(gameState.p1.x, gameState.p1.z, gameState.p1.vx, gameState.p1.vz, 0x00f0ff);

      if (this.player1Mesh.shield.material.opacity > 0) {
        this.player1Mesh.shield.material.opacity -= delta * 3;
      }
    }

    if (this.player2Mesh && gameState.p2) {
      this.player2Mesh.position.x = gameState.p2.x;
      this.player2Mesh.position.z = gameState.p2.z;
      this.player2Mesh.rotation.y -= 0.03;

      this.spawnThrusterExhaust(gameState.p2.x, gameState.p2.z, gameState.p2.vx, gameState.p2.vz, 0xff3366);

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
          
          const ring = this.mineMeshes[idx].children[1];
          if (ring) {
            ring.material.color.setHex(m.attachedTo ? 0xff2200 : 0xffb703);
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
        p.vy -= 9.8 * delta;
        p.mesh.material.opacity = p.life / p.maxLife;
      }
    }

    // 5. Starfield gentle drift
    if (this.backgroundStars) {
      this.backgroundStars.rotation.y = elapsedTime * 0.015;
    }

    // 6. Camera Handling
    this.updateCamera(delta, gameState);

    // 7. Render
    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(delta, gameState) {
    let targetPos = new THREE.Vector3(0, 22, 17);
    let lookAtPos = new THREE.Vector3(0, 0, 0);

    if (gameState.state === 'MENU' || this.cameraMode === 'orbit') {
      this.orbitAngle += delta * 0.22;
      targetPos.set(Math.sin(this.orbitAngle) * 30, 21, Math.cos(this.orbitAngle) * 26);
      lookAtPos.set(0, 0, 0);
    } else if (this.cameraMode === 'dynamic') {
      const puckX = gameState.puck ? gameState.puck.x : 0;
      const puckZ = gameState.puck ? gameState.puck.z : 0;
      
      targetPos.set(puckX * 0.45, 22, 17 + puckZ * 0.25);
      lookAtPos.set(puckX * 0.3, 0, puckZ * 0.3);
    } else if (this.cameraMode === 'tactical') {
      targetPos.set(0, 31, 7);
      lookAtPos.set(0, 0, 0);
    } else {
      targetPos.set(0, 22, 17);
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

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
    this.mouseParallax = { x: 0, y: 0 };

    // Camera settings
    this.cameraMode = 'dynamic';
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.shakeIntensity = 0;
    this.orbitAngle = 0;

    // FRESH, SERENE LIGHT BLUE & MINT GREEN PALETTE
    this.themeColors = {
      bg: 0xedf7f9,         // Clean soft ice-sky ambient
      p1: 0x0284c7,         // Vibrant Sky Blue
      p2: 0x059669,         // Fresh Mint / Emerald Green
      wallP1: 0x38bdf8,     // Soft Sky Blue Laser Rail
      wallP2: 0x34d399,     // Soft Mint Green Laser Rail
      wallTop: 0x0284c7,    // Sky Blue Boundary Rails
      floor: 0xf8fafc,      // Pristine clean ice porcelain court
      grid1: 0xbae6fd,      // Soft Sky Grid Lines
      grid2: 0xdcfce7,      // Soft Mint Grid Lines
      puck: 0x0f172a,       // Slate-dark metallic core for pinpoint clarity
      puckGlow: 0x0284c7,   // Sky Blue Plasma Glow
      mine: 0xd97706        // Warm Amber Hazard Mines
    };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene with soft atmospheric fog
    this.scene = new THREE.Scene();
    const col = this.themeColors;
    this.scene.background = new THREE.Color(col.bg);
    this.scene.fog = new THREE.FogExp2(col.bg, 0.014);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    this.camera.position.set(0, 24, 19);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer with high performance & natural tone mapping
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Bright, clean studio lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xbae6fd, 1.1);
    dirLight1.position.set(-15, 30, 15);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa7f3d0, 1.1);
    dirLight2.position.set(15, 30, 15);
    this.scene.add(dirLight2);

    // 5. Build Pristine Arena Meshes (Clean, uncluttered, high-clarity)
    this.createArenaFloor();
    this.createBoundaryWalls();
    this.createPuck();
    this.createPlayers();
    this.createMines();
    this.setupTrail();

    window.addEventListener('resize', () => this.onResize());
  }

  createArenaFloor() {
    const col = this.themeColors;
    
    // Pristine high-gloss porcelain / ice court floor
    const floorGeo = new THREE.PlaneGeometry(ARENA_WIDTH + 6, ARENA_HEIGHT + 6, 32, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: col.floor,
      roughness: 0.25,
      metalness: 0.15
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -0.1;
    this.scene.add(this.floor);

    // Center divider / Quantum Mirror Meridian (Sky Blue / Mint)
    const dividerGeo = new THREE.PlaneGeometry(0.32, ARENA_HEIGHT);
    const dividerMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.75
    });
    const divider = new THREE.Mesh(dividerGeo, dividerMat);
    divider.rotation.x = -Math.PI / 2;
    divider.position.y = 0.01;
    this.scene.add(divider);

    // Center Meridian Circle
    const ringGeo = new THREE.RingGeometry(3.1, 3.35, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    // Subtle, clean grid overlay
    const gridHelper = new THREE.GridHelper(ARENA_WIDTH + 6, 26, 0x38bdf8, 0xbae6fd);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);
  }

  createBoundaryWalls() {
    const col = this.themeColors;
    const halfW = ARENA_WIDTH / 2;
    const halfH = ARENA_HEIGHT / 2;
    const wallThick = 0.6;
    const wallHeight = 1.0;

    // Glowing Top and Bottom Rails (Sky Blue)
    const topMat = new THREE.MeshStandardMaterial({
      color: col.wallTop,
      emissive: col.wallTop,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.7
    });

    const addWall = (x, z, w, h, d, mat) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, h / 2, z);
      this.scene.add(mesh);
      this.boundaryLines.push(mesh);
    };

    // Top wall
    addWall(0, -halfH - wallThick / 2, ARENA_WIDTH + wallThick * 2, wallHeight, wallThick, topMat);
    // Bottom wall
    addWall(0, halfH + wallThick / 2, ARENA_WIDTH + wallThick * 2, wallHeight, wallThick, topMat);

    // Left Goal Posts (Sky Blue)
    const p1Mat = new THREE.MeshStandardMaterial({
      color: col.wallP1,
      emissive: col.wallP1,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.7
    });
    const sideWallLen = (ARENA_HEIGHT - GOAL_SIZE) / 2;
    addWall(-halfW - wallThick / 2, -halfH + sideWallLen / 2, wallThick, wallHeight, sideWallLen, p1Mat);
    addWall(-halfW - wallThick / 2, halfH - sideWallLen / 2, wallThick, wallHeight, sideWallLen, p1Mat);

    // Right Goal Posts (Mint Green)
    const p2Mat = new THREE.MeshStandardMaterial({
      color: col.wallP2,
      emissive: col.wallP2,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.7
    });
    addWall(halfW + wallThick / 2, -halfH + sideWallLen / 2, wallThick, wallHeight, sideWallLen, p2Mat);
    addWall(halfW + wallThick / 2, halfH - sideWallLen / 2, wallThick, wallHeight, sideWallLen, p2Mat);

    this.createGoalGates();
  }

  createGoalGates() {
    const halfW = ARENA_WIDTH / 2;
    
    // Left Goal Gate (Sky Blue)
    const p1GateGeo = new THREE.PlaneGeometry(0.35, GOAL_SIZE);
    const p1GateMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.p1Gate = new THREE.Mesh(p1GateGeo, p1GateMat);
    this.p1Gate.rotation.x = -Math.PI / 2;
    this.p1Gate.position.set(-halfW - 0.2, 0.45, 0);
    this.scene.add(this.p1Gate);

    // Right Goal Gate (Mint Green)
    const p2GateGeo = new THREE.PlaneGeometry(0.35, GOAL_SIZE);
    const p2GateMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.p2Gate = new THREE.Mesh(p2GateGeo, p2GateMat);
    this.p2Gate.rotation.x = -Math.PI / 2;
    this.p2Gate.position.set(halfW + 0.2, 0.45, 0);
    this.scene.add(this.p2Gate);
  }

  createPuck() {
    const group = new THREE.Group();

    // High-contrast slate core for crystal clarity on light floor
    const discGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.38, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      roughness: 0.1,
      metalness: 0.85
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    group.add(discMesh);

    // Inner glowing Sky Blue orb
    const coreGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 0.16;
    group.add(coreMesh);

    // Dynamic light on puck
    this.puckLight = new THREE.PointLight(0x0284c7, 3.5, 14);
    this.puckLight.position.set(0, 0.7, 0);
    group.add(this.puckLight);

    group.position.set(0, 0.2, 0);
    this.scene.add(group);
    this.puckMesh = group;
  }

  setupTrail() {
    this.maxTrailPoints = 22;
    const trailPositions = new Float32Array(this.maxTrailPoints * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.75,
      linewidth: 3
    });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    this.scene.add(this.trailLine);
  }

  createPlayers() {
    // Player 1 (ME - ORIGIN: Sky Blue Striker)
    this.player1Mesh = this.buildStrikerMesh(0x0284c7, 0x0369a1);
    this.player1Mesh.position.set(-11, 0.3, 0);
    this.scene.add(this.player1Mesh);

    this.player1Light = new THREE.PointLight(0x0284c7, 2.5, 8);
    this.player1Light.position.set(0, 0.6, 0);
    this.player1Mesh.add(this.player1Light);

    // Player 2 / Shadow (ME - SHADOW: Mint Green Striker)
    this.player2Mesh = this.buildStrikerMesh(0x059669, 0x047857);
    this.player2Mesh.position.set(11, 0.3, 0);
    this.scene.add(this.player2Mesh);

    this.player2Light = new THREE.PointLight(0x059669, 2.5, 8);
    this.player2Light.position.set(0, 0.6, 0);
    this.player2Mesh.add(this.player2Light);
  }

  buildStrikerMesh(glowColor, darkColor) {
    const group = new THREE.Group();

    // Outer hover ring with vibrant glow
    const ringGeo = new THREE.TorusGeometry(1.25, 0.24, 16, 36);
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

    // Inner dome handle (Pristine porcelain white with colored core)
    const domeGeo = new THREE.SphereGeometry(0.78, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 0.2
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    group.add(domeMesh);

    // Top indicator gem
    const gemGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.35, 16);
    const gemMat = new THREE.MeshBasicMaterial({ color: glowColor });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.y = 0.72;
    group.add(gemMesh);

    // Deflector shield halo
    const shieldGeo = new THREE.RingGeometry(1.4, 1.9, 32);
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
    // 3 Amber Magnetic Hazard Mines
    const mineGeo = new THREE.OctahedronGeometry(0.5, 1);
    const mineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.8
    });

    for (let i = 0; i < 3; i++) {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(mineGeo, mineMat);
      group.add(mesh);

      // Warning halo
      const ringGeo = new THREE.RingGeometry(0.58, 0.72, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd97706,
        transparent: true,
        opacity: 0.75,
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

  spawnSparkBurst(x, z, colorHex, count = 20) {
    for (let i = 0; i < count; i++) {
      const pGeo = new THREE.SphereGeometry(0.12, 6, 6);
      const pMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 1
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(x, 0.3 + Math.random() * 0.4, z);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      const vx = Math.cos(angle) * speed;
      const vz = Math.sin(angle) * speed;
      const vy = 2.5 + Math.random() * 4.5;

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        vx, vy, vz,
        life: 0.5 + Math.random() * 0.25,
        maxLife: 0.75
      });
    }
  }

  spawnGoalExplosion(isPlayer1Goal) {
    const x = isPlayer1Goal ? ARENA_WIDTH / 2 : -ARENA_WIDTH / 2;
    const color = isPlayer1Goal ? 0x0284c7 : 0x059669;
    this.spawnSparkBurst(x, 0, color, 60);
    this.triggerScreenShake(0.6);
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

    // 1. Update Puck Position & Visuals
    if (this.puckMesh && gameState.puck) {
      this.puckMesh.position.x = gameState.puck.x;
      this.puckMesh.position.z = gameState.puck.z;
      this.puckMesh.rotation.y += gameState.puck.spin || 0.12;

      const speedKmH = gameState.puck.speedKmH || 50;
      if (speedKmH > 110) {
        this.puckLight.color.setHex(0x059669);
      } else {
        this.puckLight.color.setHex(0x0284c7);
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

    // 2. Update Players (Hover motion & Shield decay)
    if (this.player1Mesh && gameState.p1) {
      this.player1Mesh.position.x = gameState.p1.x;
      this.player1Mesh.position.z = gameState.p1.z;
      this.player1Mesh.position.y = 0.3 + Math.sin(this.clock.getElapsedTime() * 4) * 0.05;

      if (this.player1Mesh.shield && this.player1Mesh.shield.material.opacity > 0) {
        this.player1Mesh.shield.material.opacity = Math.max(0, this.player1Mesh.shield.material.opacity - delta * 3.5);
      }
    }

    if (this.player2Mesh && gameState.p2) {
      this.player2Mesh.position.x = gameState.p2.x;
      this.player2Mesh.position.z = gameState.p2.z;
      this.player2Mesh.position.y = 0.3 + Math.cos(this.clock.getElapsedTime() * 4) * 0.05;

      if (this.player2Mesh.shield && this.player2Mesh.shield.material.opacity > 0) {
        this.player2Mesh.shield.material.opacity = Math.max(0, this.player2Mesh.shield.material.opacity - delta * 3.5);
      }
    }

    // 3. Update Mines
    if (gameState.mines) {
      gameState.mines.forEach((mine, idx) => {
        if (this.mineMeshes[idx]) {
          const m = this.mineMeshes[idx];
          m.position.x = mine.x;
          m.position.z = mine.z;
          m.rotation.y += delta * 1.5;
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

    // 5. Camera Handling with calm, serene sway
    this.updateCamera(delta, gameState);

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }

  updateCamera(delta, gameState) {
    let targetPos = new THREE.Vector3(0, 24, 19);
    let lookAtPos = new THREE.Vector3(0, 0, 0);

    if (gameState.state === 'MENU' || this.cameraMode === 'orbit') {
      const px = this.mouseParallax.x * 2.2;
      const py = this.mouseParallax.y * 1.2;
      targetPos.set(px, 24 + py, 19);
      lookAtPos.set(px * 0.25, 0, 0);
    } else if (this.cameraMode === 'dynamic') {
      const puckX = gameState.puck ? gameState.puck.x : 0;
      const puckZ = gameState.puck ? gameState.puck.z : 0;
      
      targetPos.set(puckX * 0.45, 23, 18 + puckZ * 0.25);
      lookAtPos.set(puckX * 0.3, 0, puckZ * 0.3);
    } else if (this.cameraMode === 'tactical') {
      targetPos.set(0, 31, 7);
      lookAtPos.set(0, 0, 0);
    } else {
      targetPos.set(0, 24, 19);
      lookAtPos.set(0, 0, 0);
    }

    // Screen Shake
    if (this.shakeIntensity > 0) {
      targetPos.x += (Math.random() - 0.5) * this.shakeIntensity * 2.0;
      targetPos.y += (Math.random() - 0.5) * this.shakeIntensity * 1.2;
      targetPos.z += (Math.random() - 0.5) * this.shakeIntensity * 2.0;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - delta * 2.2);
    }

    this.camera.position.lerp(targetPos, 0.08);
    this.cameraTarget.lerp(lookAtPos, 0.08);
    this.camera.lookAt(this.cameraTarget);
  }
}

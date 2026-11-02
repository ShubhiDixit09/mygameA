# ME VS ME ⚡
### *The 3D Cyber-Kinetic Mirror Duel*

> *"You are your own worst enemy. Face your Parallel Reflection in the Zero-G Hyper-Arena."*

---

## 🌌 Overview
**ME VS ME** is a hyper-kinetic, out-of-the-box 3D arcade web game reviving the lost dexterity mechanics of physical bar classic **KLASK** combined with **WINDJAMMERS** and **TRON LIGHT-DISC DUELS**. 

Built with **Three.js WebGL**, procedural **Web Audio API** synthesis, dynamic lighting, real-time particle physics, and glassmorphic holographic telemetry.

---

## 🕹️ Game Modes

| Mode | Type | Description |
| :--- | :--- | :--- |
| **1 VS 1 LOCAL DUEL** | 2-Player | Two players battle on the same keyboard. Pure reflex and positioning showdown. |
| **ME VS SHADOW** | Solo vs AI | Battle your ruthless quantum mirror. AI calculates rebound bank shots & mine launches. |
| **BRAIN SPLIT** | Solo Reflex | Control BOTH Origin (Left hand WASD) and Shadow (Right hand Arrows) at once. Test of hemispheric coordination! |
| **PARADOX GOD** | Hardcore AI | For masters only. Unforgiving Solipsism AI predicts supersonic vector trajectories with frame-perfect precision. |

---

## 🎮 Controls

### **Player 1 — ME [ORIGIN PRIME] (Cyan)**
* `W` / `A` / `S` / `D` : Navigate Chassis
* `SPACEBAR` : Kinetic Deflector Shield (Time perfectly on hit for **PERFECT REFLECTION**)
* `Q` / `E` : Curve Slice / Magnus Spin
* `LEFT SHIFT` : **HYPER OVERDRIVE BLAST** (When Super Meter reaches 100%)

### **Player 2 — ME [SHADOW ALTER] (Magenta)**
* `Arrow Keys` : Navigate Chassis
* `ENTER` or `NUMPAD 0` : Kinetic Deflector Shield
* `RIGHT SHIFT` : **HYPER OVERDRIVE BLAST** (When Super Meter reaches 100%)

### **Camera & Atmosphere Controls**
* **Camera Modes**: Toggle between **Action Dynamic Cam**, **Tactical 3D Cam**, and **Cinematic Orbit** in the HUD.
* **Arena Dimensions**: Switch between **Neo Tokyo 2099**, **Solaris Forge**, and **Quantum Void**.
* **CRT Scanlines**: Toggle retro arcade raster overlay on/off.
* **Touch / Mobile**: Dual virtual joysticks appear automatically on touch devices.

---

## ⚡ Core Rules & The Klask Revival

1. **The Quantum Core (The Disc)**:
   - Every consecutive volley accelerates the core (+5 km/h per hit) up to supersonic speeds (>140 km/h).
2. **Magnetic Quantum Mines (Klask Hazard)**:
   - 3 floating magnetic mines drift in the center.
   - If you get too close, they magnetically latch onto your chassis.
   - **Magnetic Overload Penalty**: If **2 mines** stick to your ship, an overload detonates and the opponent automatically scores a point!
3. **Perfect Deflection**:
   - Pulse your shield right as the disc impacts to launch a supersonic Mach rebound and instantly charge 40% of your Super Meter.
4. **Hyper Overdrive Blast**:
   - At 100% kinetic energy, trigger a searing hyper-beam that warps space-time and blasts straight past defenses.

---

## 🚀 Instant Deployment (Deploy in 30 Seconds)

### Option A: Vercel (1-Click)
```bash
npm install -g vercel
vercel
```
*(Or push this folder to GitHub and import into Vercel — pre-configured with `vercel.json`!)*

### Option B: Netlify
1. Run `npm run build`
2. Drag and drop the generated `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
*(Or link GitHub repo with `netlify.toml` pre-configured!)*

### Option C: Run Locally
```bash
npm run dev
# or
npm run build
npm run preview
```

---

## 🛠️ Tech Architecture
- **Rendering**: Three.js WebGL (ACESFilmicToneMapping, dynamic point lights, particle systems, procedural starfield)
- **Audio Engine**: 100% Procedural Web Audio API Synthesizer (808 sub drops, resonant laser sweeps, adaptive tempo arpeggios, SpeechSynthesis robo-announcer)
- **UI / HUD**: CSS3D Glassmorphism, glitch typography, responsive cyber-gauges, canvas confetti bursts
- **Bundler**: Vite 6 (Zero build friction, instant production bundles)

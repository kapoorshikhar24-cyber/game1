# Sniper Elite: WebGL Prototype

A realistic, browser-based 3D sniper game prototype built using **Three.js** and **Vanilla JavaScript**. The project focuses on tactical stealth gameplay, physically-based ballistics, and cinematic realism inspired by the *Sniper Elite* series.

## Overview

This prototype was developed in 7 iterative phases, transforming a simple shooting range into a fully playable stealth-action compound with intelligent AI, dynamic lighting, and a post-processing cinematic stack.

---

## Core Systems & Mechanics

### 1. Realistic Ballistics Engine (`Ballistics.js`)
- **Bullet Drop & Wind Drift:** Bullets are simulated projectiles (not hitscan) affected by gravity over time and crosswinds. The player must manually lead moving targets and compensate for drop at long distances.
- **Dynamic Wind:** Wind speed and direction subtly shift over time, simulating gusts.
- **Material-Aware Decals:** Bullets leave persistent decals upon impact. The decal's appearance adapts to the surface hit (e.g., splintered holes for wood, scorched pockmarks for metal, dirt craters for the ground).
- **Tracers:** Bullets emit a dynamic point-light that casts a glowing streak across nearby environment surfaces as they fly.

### 2. Tactical Weapon Handling (`Weapon.js`)
- **Scope & Magnification:** Narrow field-of-view aiming with a mil-dot reticle. The glass features CSS-driven `backdrop-filter` refraction, blurring, and edge distortion for a true optical lens feel.
- **Breath Control & Sway:** The scope naturally sways procedurally. Players can hold `Shift` to steady their aim, depleting a breath meter. Running out of breath results in violent, uncontrollable shaking.
- **Muzzle Flashes:** Firing emits a sudden, rapidly decaying point-light that illuminates the player and the immediate surroundings. Suppressed weapons have a dimmer flash and a low-pass filtered audio profile.

### 3. AI & Stealth System (`Guard.js`)
- **State Machine AI:** Guards patrol along waypoints and transition between `PATROL`, `INVESTIGATING`, and `ALERTED` states.
- **Suspicion Meter:** Guards feature a vision cone. If the player enters it, suspicion builds based on distance. If it fills halfway, the guard investigates the player's last known position. If it reaches 100%, the guard opens fire.
- **Alert Propagation:** If a guard enters the `ALERTED` state, they notify other guards within a specific radius, causing the compound to swarm.
- **Corpse Detection:** Guards will instantly raise the alarm if they walk within visual range of a dead body.

### 4. Cinematic Kill-Cam
- **Bullet Follow Cam:** Earning a long-distance kill triggers a slow-motion cinematic camera that chases the bullet from the muzzle to the point of impact.
- **Color Grading:** During the Kill-Cam, the Three.js Post-Processing stack aggressively intensifies the film grain and desaturates the colors for a gritty, theatrical finish.

### 5. Adaptive Difficulty (`main.js`)
Players can select a difficulty profile before deploying, which globally scales the simulation:
- **Rookie:** Adds a red trajectory-prediction dot on the scope. Guards have smaller vision cones, slower suspicion rates, and deal half damage.
- **Regular:** Standard baseline tuning. 
- **Elite:** Tactical HUD is stripped away. Wind speed readouts fluctuate with a random margin of error, forcing players to rely on instinct. Guards are hyper-lethal, spot the player instantly, and deal massive damage.

### 6. Photorealistic Rendering & UI
- **PBR Materials:** The environment and characters use `MeshStandardMaterial` to react dynamically to ambient lighting, directional shadows, and point-lights.
- **Post-Processing:** The game runs through a custom `EffectComposer` pipeline featuring `UnrealBloomPass` (soft highlights) and `FilmPass` (cinematic grain).
- **Diegetic UI:** The HUD elements (ammo counters, compass, objective markers) feature noise gradients, brushed textures, and text-shadow LED glows to mimic physical, field-worn military equipment.

---

## File Structure

- **`index.html`**: Entry point. Contains the UI DOM overlay, CSS glass effects, and loads the Three.js CDN dependencies (including post-processing scripts).
- **`style.css`**: Styling for the menus, HUD, and photorealistic UI elements.
- **`js/main.js`**: Game loop, difficulty configuration, `EffectComposer` setup, menu event listeners, and global end-state logic.
- **`js/Player.js`**: `PointerLockControls` wrapper for First-Person movement and health management.
- **`js/Weapon.js`**: Manages weapon states, scope toggling, procedural sway, breath holding, muzzle flash lighting, and audio synthesis (Web Audio API).
- **`js/Ballistics.js`**: Calculates projectile physics, raycast collision detection against AI and the environment, tracer lighting, and dynamic bullet hole generation.
- **`js/Guard.js`**: AI agent class governing patrol logic, vision cones, suspicion build-up, and combat mechanics.
- **`js/Level.js`**: Generates the 3D environment, ground plane, compound buildings (using primitive geometries), rocks, and assigns PBR material properties.

---

## Controls
- **Mouse**: Look / Aim
- **Right Click (Hold/Toggle)**: Aim Down Sights (Scope)
- **Left Click**: Fire Weapon
- **Shift (Hold)**: Hold Breath (Steady Scope)
- **Q**: Switch Weapon (Suppressed / Loud)
- **H**: Toggle Tactical HUD

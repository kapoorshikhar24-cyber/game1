/**
 * RealisticsManager.js
 * Handles all visual realism effects:
 *  - Blood splatter / impact decals
 *  - Scope lens glare / lens flare
 *  - Breathing overlay (heartbeat + vignette pulse)
 *  - Screen shake
 *  - Vegetation / grass system
 *  - Distant gunshot muzzle smoke
 */

export class RealisticsManager {
    constructor(engine) {
        this.engine = engine;
        this.scene = null;
        this.camera = null;

        // Screen shake state
        this._shakeIntensity = 0;
        this._shakeDuration = 0;
        this._shakeTimer = 0;
        this._origCamPos = new THREE.Vector3();

        // Heartbeat state
        this._heartbeatActive = false;
        this._heartbeatPhase = 0;
        this._heartbeatRate = 1.0; // beats per second (resting = 1.0, combat = 2.2)

        // Lens glare state
        this._glareIntensity = 0;
        this._glarePulse = 0;

        // Blood pool refs
        this._bloodDecals = [];

        // Weather state
        this._snowParticles = null;

        this.overlayEl = null;
        this.vignetteEl = null;
        this.glareEl = null;
        this.scopeDustEl = null;
        this.heartbeatEl = null;
        this.breathOverlayEl = null;

        this._setupEventListeners();
        this._buildUI();
    }

    init(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this._buildVegetation();
        this._buildWeather();
    }

    _setupEventListeners() {
        const bus = this.engine.eventBus;
        bus.on('GUARD_KILLED',     (g)    => this._onGuardKilled(g));
        bus.on('TARGET_HIT',       (data) => this._onTargetHit(data));
        bus.on('WEAPON_FIRED',     ()     => this._onWeaponFired());
        bus.on('BULLET_IMPACT',    (data) => this._onBulletImpact(data));
        bus.on('PLAYER_HEALTH_CHANGED', (pct) => this._onHealthChanged(pct));
        bus.on('COMPOUND_ALERT_LEVEL_CHANGED', (lvl) => this._onAlertChanged(lvl));
        bus.on('STATE_CHANGED',    (e)    => this._onStateChanged(e));
    }

    _buildUI() {
        const container = document.getElementById('game-container') || document.body;

        // ── Heartbeat bar (horizontal lines bottom left) ─────────────────────
        if (!document.getElementById('heartbeat-display')) {
            const hb = document.createElement('div');
            hb.id = 'heartbeat-display';
            hb.style.cssText = `
                position: absolute; bottom: 38px; left: 28px;
                width: 140px; height: 36px;
                pointer-events: none;
                z-index: 42;
                opacity: 0;
                transition: opacity 0.6s;
            `;
            hb.innerHTML = `
                <canvas id="heartbeat-canvas" width="140" height="36" style="width:140px;height:36px;"></canvas>
            `;
            container.appendChild(hb);
            this.heartbeatEl = hb;
        } else {
            this.heartbeatEl = document.getElementById('heartbeat-display');
        }

        // ── Breathing vignette overlay ───────────────────────────────────────
        if (!document.getElementById('breath-vignette')) {
            const bv = document.createElement('div');
            bv.id = 'breath-vignette';
            bv.style.cssText = `
                position: absolute; inset: 0;
                pointer-events: none;
                z-index: 38;
                background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0) 100%);
                opacity: 0;
                transition: opacity 0.2s;
            `;
            container.appendChild(bv);
            this.breathOverlayEl = bv;
        } else {
            this.breathOverlayEl = document.getElementById('breath-vignette');
        }

        // ── Scope lens glare (sun reflection) ───────────────────────────────
        if (!document.getElementById('scope-glare')) {
            const gl = document.createElement('div');
            gl.id = 'scope-glare';
            gl.style.cssText = `
                position: absolute; inset: 0;
                pointer-events: none;
                z-index: 70;
                opacity: 0;
                background: radial-gradient(
                    ellipse 80px 80px at var(--gx, 50%) var(--gy, 30%),
                    rgba(255,255,200,0.55) 0%,
                    rgba(255,255,200,0.12) 40%,
                    transparent 70%
                );
                transition: opacity 0.3s;
                mix-blend-mode: screen;
            `;
            container.appendChild(gl);
            this.glareEl = gl;
        } else {
            this.glareEl = document.getElementById('scope-glare');
        }

        // ── Scope lens dust / scratches ──────────────────────────────────────
        if (!document.getElementById('scope-dust')) {
            const dust = document.createElement('div');
            dust.id = 'scope-dust';
            dust.style.cssText = `
                position: absolute; inset: 0;
                pointer-events: none;
                z-index: 71;
                opacity: 0;
                mix-blend-mode: screen;
            `;
            // SVG dust scratches on the lens
            dust.innerHTML = `
                <svg width="100%" height="100%" style="position:absolute;inset:0;opacity:0.04;">
                    <line x1="48%" y1="44%" x2="52%" y2="46%" stroke="white" stroke-width="0.5"/>
                    <line x1="50%" y1="43%" x2="49%" y2="53%" stroke="white" stroke-width="0.3"/>
                    <circle cx="51%" cy="49%" r="0.5%" fill="white" opacity="0.5"/>
                    <circle cx="47%" cy="52%" r="0.3%" fill="white" opacity="0.4"/>
                </svg>
            `;
            container.appendChild(dust);
            this.scopeDustEl = dust;
        } else {
            this.scopeDustEl = document.getElementById('scope-dust');
        }

        // Inject CSS for heartbeat
        if (!document.getElementById('realism-styles')) {
            const style = document.createElement('style');
            style.id = 'realism-styles';
            style.textContent = `
                @keyframes bloodFlash {
                    0%   { opacity: 0.45; }
                    100% { opacity: 0; }
                }
                @keyframes breathePulse {
                    0%, 100% { opacity: 0; }
                    50%      { opacity: 0.28; }
                }
                .blood-splat {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(ellipse, #6b0000 0%, rgba(80,0,0,0.5) 50%, transparent 75%);
                    pointer-events: none;
                    animation: bloodFlash 1.4s ease-out forwards;
                    z-index: 65;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ─── Vegetation ────────────────────────────────────────────────────────────
    _buildVegetation() {
        if (!this.scene) return;

        // Grass patches — scattered around the approach path (Z: 20 to 90)
        const grassGeo = new THREE.PlaneGeometry(0.8, 0.8);
        const grassMat = new THREE.MeshStandardMaterial({
            color: 0x2d4a1e,
            roughness: 1.0,
            metalness: 0,
            side: THREE.DoubleSide,
            alphaTest: 0.5,
            transparent: true
        });

        const grassPositions = [];
        for (let i = 0; i < 80; i++) {
            grassPositions.push({
                x: (Math.random() - 0.5) * 200,
                z: 20 + Math.random() * 90,
            });
        }

        for (const gp of grassPositions) {
            const bladeCount = 5 + Math.floor(Math.random() * 5);
            for (let b = 0; b < bladeCount; b++) {
                const h = 0.4 + Math.random() * 0.6;
                const geo = new THREE.PlaneGeometry(0.06, h);
                const blade = new THREE.Mesh(geo, grassMat);
                blade.position.set(
                    gp.x + (Math.random() - 0.5) * 1.2,
                    h / 2,
                    gp.z + (Math.random() - 0.5) * 1.2
                );
                blade.rotation.y = Math.random() * Math.PI;
                blade.rotation.z = (Math.random() - 0.5) * 0.3;
                blade.castShadow = false;
                blade.receiveShadow = false;
                this.scene.add(blade);
            }
        }

        // Pine saplings near forest edge
        this._addSaplings();
    }

    _addSaplings() {
        if (!this.scene) return;
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 1.0 });
        const leafMat  = new THREE.MeshStandardMaterial({ color: 0x1a3d1a, roughness: 0.9 });

        const positions = [
            [-55, 42], [-62, 65], [58, 35], [64, 50], [-48, 80],
            [52, 78], [-70, 30], [70, 60], [-35, 92], [38, 88],
        ];

        for (const [x, z] of positions) {
            const h = 1.5 + Math.random();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, h, 8), trunkMat);
            trunk.position.set(x, h / 2, z);
            this.scene.add(trunk);

            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.5, 8), leafMat);
            cone.position.set(x, h + 0.6, z);
            this.scene.add(cone);
        }
    }

    // ─── Event Handlers ───────────────────────────────────────────────────────

    _onGuardKilled(guard) {
        if (!guard) return;
        // Blood pool on ground under guard
        this._spawnBloodPool(guard.position);
        // Screen edge blood flash
        this._showBloodSplat();
    }

    _onTargetHit(data) {
        if (data?.isHeadshot) {
            this._showBloodSplat(true);
        } else {
            this._showBloodSplat(false);
        }
    }

    _onWeaponFired() {
        // Screen shake on fire
        this._triggerScreenShake(0.012, 0.09);
        // Start heartbeat after firing
        this._heartbeatRate = 1.6;
        this._heartbeatActive = true;
        if (this.heartbeatEl) this.heartbeatEl.style.opacity = '1';
        // Return to resting after 8 seconds
        clearTimeout(this._heartRestoreTimer);
        this._heartRestoreTimer = setTimeout(() => {
            this._heartbeatRate = 1.0;
            if (this.heartbeatEl) this.heartbeatEl.style.opacity = '0';
        }, 8000);
    }

    _onBulletImpact() {
        // Small shake on bullet hitting surface
        this._triggerScreenShake(0.004, 0.06);
    }

    _onHealthChanged(pct) {
        // Pulse breathing vignette when low health
        if (pct < 35) {
            if (this.breathOverlayEl) {
                this.breathOverlayEl.style.background = 
                    `radial-gradient(ellipse at center, transparent 55%, rgba(80,0,0,${0.35 - pct/200}) 100%)`;
                this.breathOverlayEl.style.animation = 'breathePulse 1.2s infinite';
            }
            this._heartbeatRate = 2.2;
            this._heartbeatActive = true;
            if (this.heartbeatEl) this.heartbeatEl.style.opacity = '1';
        } else {
            if (this.breathOverlayEl) {
                this.breathOverlayEl.style.animation = '';
                this.breathOverlayEl.style.opacity = '0';
            }
        }
    }

    _onAlertChanged(level) {
        if (level === 'alerted') {
            this._heartbeatRate = 2.0;
            this._heartbeatActive = true;
            if (this.heartbeatEl) this.heartbeatEl.style.opacity = '1';
        }
    }

    _onStateChanged(e) {
        const isScoped = e.current === 'SCOPE';
        // Show lens glare + dust overlay when scoped
        if (this.scopeDustEl) {
            this.scopeDustEl.style.opacity = isScoped ? '1' : '0';
        }
    }

    // ─── Screen Shake ─────────────────────────────────────────────────────────
    _triggerScreenShake(intensity, duration) {
        this._shakeIntensity = intensity;
        this._shakeDuration = duration;
        this._shakeTimer = duration;
    }

    _updateScreenShake(dt) {
        if (this._shakeTimer <= 0 || !this.camera) return;
        this._shakeTimer -= dt;
        const t = this._shakeTimer / this._shakeDuration;
        const s = this._shakeIntensity * t;
        this.camera.position.x += (Math.random() - 0.5) * s;
        this.camera.position.y += (Math.random() - 0.5) * s * 0.5;
        if (this._shakeTimer < 0) this._shakeTimer = 0;
    }

    // ─── Scope Lens Glare ─────────────────────────────────────────────────────
    _updateScopeGlare(dt) {
        if (!this.glareEl || !this.camera) return;
        const isScoped = this.engine.stateManager?.is('SCOPE');
        if (!isScoped) {
            if (this._glareIntensity > 0) {
                this._glareIntensity -= dt * 2;
                this.glareEl.style.opacity = Math.max(0, this._glareIntensity).toString();
            }
            return;
        }

        // Check if sun direction aligns with camera
        // Sun is roughly at (200, 120, -150) in the scene
        const sunDir = new THREE.Vector3(200, 120, -150).normalize();
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        const dot = camDir.dot(sunDir);

        if (dot > 0.7) {
            const targetIntensity = (dot - 0.7) / 0.3 * 0.6;
            this._glareIntensity += (targetIntensity - this._glareIntensity) * dt * 3;

            // Animate glare position slightly
            this._glarePulse += dt * 0.8;
            const gx = 50 + Math.sin(this._glarePulse) * 2;
            const gy = 30 + Math.cos(this._glarePulse * 0.7) * 1.5;
            this.glareEl.style.setProperty('--gx', gx + '%');
            this.glareEl.style.setProperty('--gy', gy + '%');
        } else {
            this._glareIntensity -= dt * 1.5;
            if (this._glareIntensity < 0) this._glareIntensity = 0;
        }
        this.glareEl.style.opacity = this._glareIntensity.toFixed(3);
    }

    // ─── Heartbeat ECG Canvas ─────────────────────────────────────────────────
    _updateHeartbeat(dt) {
        if (!this._heartbeatActive || !this.heartbeatEl) return;
        const canvas = document.getElementById('heartbeat-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        this._heartbeatPhase += dt * this._heartbeatRate * Math.PI * 2;

        ctx.clearRect(0, 0, 140, 36);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 4;
        ctx.beginPath();

        for (let x = 0; x < 140; x++) {
            const t = x / 140;
            const phase = this._heartbeatPhase + t * Math.PI * 4;

            // ECG waveform shape: flat → spike up → spike down → flat
            const cycle = ((phase % (Math.PI * 2)) / (Math.PI * 2));
            let y;
            if (cycle < 0.1) {
                y = 18; // flat
            } else if (cycle < 0.15) {
                y = 18 - (cycle - 0.1) / 0.05 * 14; // Q wave up
            } else if (cycle < 0.2) {
                y = 4 + (cycle - 0.15) / 0.05 * 26; // R peak
            } else if (cycle < 0.25) {
                y = 30 - (cycle - 0.2) / 0.05 * 12; // S wave
            } else if (cycle < 0.35) {
                y = 18 + Math.sin((cycle - 0.25) / 0.1 * Math.PI) * 4; // T wave
            } else {
                y = 18; // flat
            }

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // ─── Blood Effects ─────────────────────────────────────────────────────────
    _showBloodSplat(isHeadshot = false) {
        const container = document.getElementById('game-container') || document.body;
        const splat = document.createElement('div');
        splat.className = 'blood-splat';
        const size = isHeadshot ? (80 + Math.random() * 60) : (40 + Math.random() * 40);
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        const pct = 20 + Math.random() * 60;

        splat.style.width  = size + 'px';
        splat.style.height = size + 'px';

        switch (edge) {
            case 0: splat.style.top = '0'; splat.style.left = pct + '%'; break;
            case 1: splat.style.right = '0'; splat.style.top = pct + '%'; break;
            case 2: splat.style.bottom = '0'; splat.style.left = pct + '%'; break;
            case 3: splat.style.left = '0'; splat.style.top = pct + '%'; break;
        }

        container.appendChild(splat);
        setTimeout(() => splat.remove(), 1500);
    }

    _spawnBloodPool(position) {
        if (!this.scene) return;
        const geo = new THREE.CircleGeometry(0.5 + Math.random() * 0.4, 12);
        geo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x3a0000,
            roughness: 1.0,
            metalness: 0,
            transparent: true,
            opacity: 0.9,
        });
        const pool = new THREE.Mesh(geo, mat);
        pool.position.set(position.x, 0.05, position.z);
        pool.receiveShadow = false;
        this.scene.add(pool);
        this._bloodDecals.push(pool);

        // Limit decals to 20
        if (this._bloodDecals.length > 20) {
            const old = this._bloodDecals.shift();
            this.scene.remove(old);
        }
    }

    _buildVegetation() {
        // Subtle grass / shrub instances if scene exists
    }

    _buildWeather() {
        if (!this.scene) return;
        const particleCount = 600;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 400;
            positions[i + 1] = Math.random() * 120;
            positions[i + 2] = (Math.random() - 0.5) * 400;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.6,
            transparent: true,
            opacity: 0.6,
        });

        this._snowParticles = new THREE.Points(geometry, material);
        this.scene.add(this._snowParticles);
    }

    // ─── Update Loop ──────────────────────────────────────────────────────────
    update(dt) {
        this._updateScreenShake(dt);
        this._updateScopeGlare(dt);
        this._updateHeartbeat(dt);
        this._updateWeather(dt);
    }

    _updateWeather(dt) {
        if (!this._snowParticles) return;
        
        const posAttr = this._snowParticles.geometry.attributes.position;
        const arr = posAttr.array;
        
        for(let i=1; i<arr.length; i+=3) {
            // Drop Y
            arr[i] -= 4.0 * dt;
            // Drift X
            arr[i-1] += Math.sin(arr[i] * 0.1) * dt; 
            
            // Reset to top if below ground
            if (arr[i] < 0) {
                arr[i] = 100 + Math.random() * 50;
            }
        }
        
        posAttr.needsUpdate = true;
    }
}

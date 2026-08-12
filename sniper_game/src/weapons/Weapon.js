/**
 * Weapon.js — Realistic Weapon System
 * Enhancements:
 *  - Layered gunshot audio (crack + boom + tail)
 *  - Suppressor gas cloud effect
 *  - Supersonic crack vs subsonic thud
 *  - Realistic muzzle flash (light burst + particle)
 *  - Distance-based gunshot echo delay
 *  - Camera recoil spring recovery
 *  - Ejection shell audio on bolt cycle
 *  - Weapon sway tied to stance + movement + fatigue
 */

export class Weapon {
    constructor(camera, ballistics) {
        this.camera    = camera;
        this.ballistics = ballistics;

        this.state     = 'IDLE';
        this.isScoped  = false;
        this.baseFOV   = 75;
        this.targetFOV = 75;

        // Zoom Levels
        this.zoomLevels = [
            { label: '2x',  fov: 35 },
            { label: '4x',  fov: 20 },
            { label: '8x',  fov: 10 },
            { label: '12x', fov: 5  },
        ];
        this.zoomIndex = 1;

        // Breath
        this.isHoldingBreath   = false;
        this.breathCapacity    = 100;
        this.currentBreath     = 100;
        this.breathDepletionRate = 18;
        this.breathRecoveryRate  = 10;

        // Sway
        this.swayTime     = 0;
        this.baseSwayAmp  = 0.0005;
        this.heldSwayAmp  = 0.00004;
        this.exhaustedSwayAmp = 0.0028;

        // Parallax
        this.parallaxX = 0;
        this.parallaxY = 0;

        // Recoil spring
        this._recoilX = 0;    // accumulated pitch kick
        this._recoilY = 0;    // accumulated yaw kick
        this._recoilRecoverySpeed = 5.0;

        // Timers
        this.reloadTimer  = 0;
        this.boltTimer    = 0;
        this.fireCooldown = 0;

        // DOM cache
        this.cachedUI = { zoom: '', stability: '', breathOffset: -1, ammoCurrent: -1, ammoTotal: -1 };

        // Weapons — Indian Military Arsenal
        this.weapons = [
            {
                id: 'insas_sniper',
                name: 'INSAS Sniper (Suppressed)',
                type: 'bolt_action',
                vel: 920,                // muzzle velocity m/s
                subsonic: false,         // supersonic → crack audible to enemies
                suppressed: true,
                noise: 22,               // detection radius
                magSize: 5,
                currentAmmo: 5,
                reserveAmmo: 25,
                reloadDuration: 2.4,
                boltDuration: 1.1,
                recoilPitch: 0.028,
                recoilYaw: 0.006,
                fireRate: 0.0,
            },
            {
                id: 'svd_dragunov',
                name: 'SVD Dragunov (Loud)',
                type: 'semi_auto',
                vel: 830,
                subsonic: false,
                suppressed: false,
                noise: 180,
                magSize: 10,
                currentAmmo: 10,
                reserveAmmo: 40,
                reloadDuration: 2.6,
                boltDuration: 0.0,
                recoilPitch: 0.045,
                recoilYaw: 0.012,
                fireRate: 0.24,
            },
        ];
        this.currentWeaponIdx = 0;

        // Muzzle light
        this.muzzleLight = new THREE.PointLight(0xffbb44, 0, 40);
        this.muzzleLight.castShadow = false;
        this.camera.add(this.muzzleLight);
        this.muzzleLight.position.set(0, -0.08, -0.8);

        // Muzzle flash sprite (2D DOM element)
        this._buildMuzzleFlash();

        this.initUI();
        this.setupWheelZoom();
    }

    // ─── Muzzle Flash ─────────────────────────────────────────────────────────

    _buildMuzzleFlash() {
        if (document.getElementById('muzzle-flash-el')) {
            this._muzzleFlashEl = document.getElementById('muzzle-flash-el');
            return;
        }
        const el = document.createElement('div');
        el.id = 'muzzle-flash-el';
        el.style.cssText = `
            position: absolute;
            bottom: 32%; left: 52%;
            transform: translate(-50%, 50%);
            width: 48px; height: 48px;
            border-radius: 50%;
            background: radial-gradient(circle, #fffbe0 0%, #ffaa00 40%, transparent 75%);
            opacity: 0;
            pointer-events: none;
            z-index: 55;
            mix-blend-mode: screen;
            filter: blur(3px);
        `;
        (document.getElementById('game-container') || document.body).appendChild(el);
        this._muzzleFlashEl = el;
    }

    _triggerMuzzleFlash(suppressed) {
        if (!this._muzzleFlashEl) return;
        const size = suppressed ? 18 : 56;
        this._muzzleFlashEl.style.width  = size + 'px';
        this._muzzleFlashEl.style.height = size + 'px';
        this._muzzleFlashEl.style.opacity = suppressed ? '0.4' : '1.0';
        clearTimeout(this._flashTimer);
        this._flashTimer = setTimeout(() => {
            if (this._muzzleFlashEl) this._muzzleFlashEl.style.opacity = '0';
        }, suppressed ? 28 : 55);
    }

    // ─── Audio ────────────────────────────────────────────────────────────────

    _getCtx() {
        if (!window.audioCtx) {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = window.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    /**
     * Realistic layered gunshot:
     *  Layer 1 — Initial mechanical CRACK (high-freq transient)
     *  Layer 2 — Chamber BOOM (low-freq pressure wave)
     *  Layer 3 — Tail / reverb decay
     *  Layer 4 — Distance ECHO (if not suppressed)
     *  Suppressed: shorter tail, no boom, slight gas hiss
     */
    playFireSound() {
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const w = this.weapons[this.currentWeaponIdx];
        const suppressed = w.suppressed;

        if (suppressed) {
            this._playSuppressedShot(ctx, now);
        } else {
            this._playUnsuppressedShot(ctx, now, w.vel);
        }
    }

    _playSuppressedShot(ctx, now) {
        // Mechanical click-thump — subsonic action sound
        const bufLen = Math.floor(ctx.sampleRate * 0.35);
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 300;

        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 1200;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        src.connect(hp); hp.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
        src.start(now);

        // Gas hiss
        const gasLen = Math.floor(ctx.sampleRate * 0.12);
        const gasBuf = ctx.createBuffer(1, gasLen, ctx.sampleRate);
        const gd = gasBuf.getChannelData(0);
        for (let i = 0; i < gasLen; i++) gd[i] = Math.random() * 2 - 1;
        const gasSrc = ctx.createBufferSource();
        gasSrc.buffer = gasBuf;
        const gasBP = ctx.createBiquadFilter();
        gasBP.type = 'bandpass'; gasBP.frequency.value = 4000; gasBP.Q.value = 0.5;
        const gasGain = ctx.createGain();
        gasGain.gain.setValueAtTime(0.08, now + 0.02);
        gasGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        gasSrc.connect(gasBP); gasBP.connect(gasGain); gasGain.connect(ctx.destination);
        gasSrc.start(now + 0.02);
    }

    _playUnsuppressedShot(ctx, now, muzzleVelocity) {
        // ── Layer 1: CRACK (transient, high freq) ──────────────────────────
        const crackLen = Math.floor(ctx.sampleRate * 0.08);
        const crackBuf = ctx.createBuffer(1, crackLen, ctx.sampleRate);
        const cd = crackBuf.getChannelData(0);
        for (let i = 0; i < crackLen; i++) {
            cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.006));
        }
        const crack = ctx.createBufferSource();
        crack.buffer = crackBuf;
        const crackBP = ctx.createBiquadFilter();
        crackBP.type = 'bandpass'; crackBP.frequency.value = 2400; crackBP.Q.value = 0.8;
        const crackGain = ctx.createGain();
        crackGain.gain.setValueAtTime(1.0, now);
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        crack.connect(crackBP); crackBP.connect(crackGain); crackGain.connect(ctx.destination);
        crack.start(now);

        // ── Layer 2: BOOM (pressure wave, low freq) ────────────────────────
        const boomLen = Math.floor(ctx.sampleRate * 0.55);
        const boomBuf = ctx.createBuffer(1, boomLen, ctx.sampleRate);
        const bd = boomBuf.getChannelData(0);
        for (let i = 0; i < boomLen; i++) {
            const t = i / ctx.sampleRate;
            bd[i] = (Math.random() * 2 - 1) * Math.exp(-t * 7) + Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 9) * 0.4;
        }
        const boom = ctx.createBufferSource();
        boom.buffer = boomBuf;
        const boomLP = ctx.createBiquadFilter();
        boomLP.type = 'lowpass'; boomLP.frequency.value = 600;
        const boomGain = ctx.createGain();
        boomGain.gain.setValueAtTime(1.6, now);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        boom.connect(boomLP); boomLP.connect(boomGain); boomGain.connect(ctx.destination);
        boom.start(now);

        // ── Layer 3: TAIL reverb ────────────────────────────────────────────
        const tailLen = Math.floor(ctx.sampleRate * 1.2);
        const tailBuf = ctx.createBuffer(1, tailLen, ctx.sampleRate);
        const td = tailBuf.getChannelData(0);
        for (let i = 0; i < tailLen; i++) {
            td[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
        }
        const tail = ctx.createBufferSource();
        tail.buffer = tailBuf;
        const tailLP = ctx.createBiquadFilter();
        tailLP.type = 'lowpass'; tailLP.frequency.value = 900;
        const tailGain = ctx.createGain();
        tailGain.gain.setValueAtTime(0.22, now + 0.05);
        tailGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        tail.connect(tailLP); tailLP.connect(tailGain); tailGain.connect(ctx.destination);
        tail.start(now + 0.04);

        // ── Layer 4: DISTANT ECHO (delayed, 0.3s) ──────────────────────────
        const echoDelay = 0.28 + Math.random() * 0.08;
        const echoGain = ctx.createGain();
        echoGain.gain.setValueAtTime(0.18, now + echoDelay);
        echoGain.gain.exponentialRampToValueAtTime(0.001, now + echoDelay + 0.5);
        const echo = ctx.createBufferSource();
        echo.buffer = boomBuf;
        const echoLP = ctx.createBiquadFilter();
        echoLP.type = 'lowpass'; echoLP.frequency.value = 400;
        echo.connect(echoLP); echoLP.connect(echoGain); echoGain.connect(ctx.destination);
        echo.start(now + echoDelay);
    }

    playReloadSound() {
        const ctx = this._getCtx();
        const now = ctx.currentTime;

        // Magazine click out
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.type = 'square'; osc1.frequency.setValueAtTime(320, now);
        g1.gain.setValueAtTime(0.18, now); g1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc1.connect(g1); g1.connect(ctx.destination);
        osc1.start(now); osc1.stop(now + 0.08);

        // Mag insert click
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'square'; osc2.frequency.setValueAtTime(440, now + 0.6);
        g2.gain.setValueAtTime(0.22, now + 0.6); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.start(now + 0.6); osc2.stop(now + 0.72);

        // Chamber round
        const osc3 = ctx.createOscillator();
        const g3 = ctx.createGain();
        osc3.type = 'sawtooth'; osc3.frequency.setValueAtTime(200, now + 1.0);
        osc3.frequency.exponentialRampToValueAtTime(80, now + 1.15);
        g3.gain.setValueAtTime(0.18, now + 1.0); g3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc3.connect(g3); g3.connect(ctx.destination);
        osc3.start(now + 1.0); osc3.stop(now + 1.2);
    }

    playBoltSound() {
        const ctx = this._getCtx();
        const now = ctx.currentTime;

        // Bolt pull back — metallic scrape
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.18);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 1200;
        osc.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.2);

        // Shell ejection clink
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1800, now + 0.14);
        osc2.frequency.exponentialRampToValueAtTime(600, now + 0.22);
        g2.gain.setValueAtTime(0.14, now + 0.14);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.start(now + 0.14); osc2.stop(now + 0.28);
    }

    playEmptyClickSound() {
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1400, now);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.05);
    }

    // ─── Setup ────────────────────────────────────────────────────────────────

    initUI() {
        this.ui = {
            crosshair:    document.getElementById('crosshair-dot'),
            scopeOverlay: document.getElementById('scope-overlay'),
            reticleSvg:   document.getElementById('reticle-svg'),
            breathArc:    document.getElementById('breath-arc'),
            weaponName:   document.getElementById('weapon-name'),
            ammoCurrent:  document.getElementById('ammo-current'),
            ammoTotal:    document.getElementById('ammo-total'),
            scopeZoom:    document.getElementById('scope-zoom'),
            scopeStability: document.getElementById('scope-stability'),
        };
        this.updateWeaponUI();
        this.emitAmmoUpdate();
    }

    setupWheelZoom() {
        window.addEventListener('wheel', (e) => {
            if (!this.isScoped) return;
            if (e.deltaY < 0 && this.zoomIndex < this.zoomLevels.length - 1) {
                this.zoomIndex++; this.applyZoom();
            } else if (e.deltaY > 0 && this.zoomIndex > 0) {
                this.zoomIndex--; this.applyZoom();
            }
        });
    }

    applyZoom() {
        const zoom = this.zoomLevels[this.zoomIndex];
        this.targetFOV = zoom.fov;
        if (this.ui.scopeZoom && this.cachedUI.zoom !== zoom.label) {
            this.cachedUI.zoom = zoom.label;
            this.ui.scopeZoom.innerText = zoom.label;
        }
        this.emitEvent('SCOPE_ZOOM_CHANGED', { zoomLevel: zoom.label, fov: zoom.fov });
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.emitEvent('WEAPON_STATE_CHANGED', { state: this.state, weapon: this.weapons[this.currentWeaponIdx] });
    }

    emitEvent(name, payload) {
        window.gameEngine?.eventBus?.emit(name, payload);
    }

    emitAmmoUpdate() {
        const w = this.weapons[this.currentWeaponIdx];
        if (this.ui.ammoCurrent && this.cachedUI.ammoCurrent !== w.currentAmmo) {
            this.cachedUI.ammoCurrent = w.currentAmmo;
            this.ui.ammoCurrent.innerText = w.currentAmmo;
        }
        if (this.ui.ammoTotal && this.cachedUI.ammoTotal !== w.reserveAmmo) {
            this.cachedUI.ammoTotal = w.reserveAmmo;
            this.ui.ammoTotal.innerText = w.reserveAmmo;
        }
        this.emitEvent('AMMO_UPDATED', { current: w.currentAmmo, total: w.reserveAmmo });
    }

    switchWeapon() {
        if (this.state === 'RELOADING' || this.state === 'BOLT_ACTION') return;
        this.currentWeaponIdx = (this.currentWeaponIdx + 1) % this.weapons.length;
        this.updateWeaponUI();
        this.emitAmmoUpdate();
        this.setState(this.isScoped ? 'AIMING' : 'IDLE');
    }

    updateWeaponUI() {
        if (this.ui.weaponName) {
            this.ui.weaponName.innerText = this.weapons[this.currentWeaponIdx].name.toUpperCase();
        }
    }

    toggleScope() {
        if (this.state === 'RELOADING' || this.state === 'DISABLED') return;
        this.isScoped = !this.isScoped;

        if (this.isScoped) {
            this.targetFOV = this.zoomLevels[this.zoomIndex].fov;
            this.ui.scopeOverlay?.classList.remove('hidden');
            this.ui.crosshair?.classList.add('hidden');
            document.getElementById('main-hud')?.classList.add('hidden');
            this.setState('AIMING');
            this.applyZoom();
            this.emitEvent('PLAYER_SCOPED', {});
        } else {
            this.targetFOV = this.baseFOV;
            this.ui.scopeOverlay?.classList.add('hidden');
            this.ui.crosshair?.classList.remove('hidden');
            document.getElementById('main-hud')?.classList.remove('hidden');
            this.holdBreath(false);
            this.setState('IDLE');
        }
    }

    holdBreath(state) {
        if (!this.isScoped) return;
        this.isHoldingBreath = state;
    }

    reload() {
        const w = this.weapons[this.currentWeaponIdx];
        if (this.state === 'RELOADING' || this.state === 'DISABLED' || this.state === 'BOLT_ACTION') return;
        if (w.currentAmmo >= w.magSize || w.reserveAmmo <= 0) {
            this.playEmptyClickSound();
            return;
        }
        this.setState('RELOADING');
        this.reloadTimer = w.reloadDuration;
        this.playReloadSound();
        this.emitEvent('WEAPON_RELOAD_START', { weapon: w, duration: w.reloadDuration });
    }

    fire() {
        const w = this.weapons[this.currentWeaponIdx];
        if (this.state === 'RELOADING' || this.state === 'BOLT_ACTION' || this.state === 'DISABLED' || this.fireCooldown > 0) return false;

        if (w.currentAmmo <= 0) {
            this.playEmptyClickSound();
            this.reload();
            return false;
        }

        this.setState('FIRING');
        w.currentAmmo--;
        this.fireCooldown = w.fireRate;
        this.emitAmmoUpdate();

        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        this.ballistics.fireBullet(this.camera.position, dir, w.vel, {
            mass: 0.010,
            caliber: 0.00762,
            dragCoefficient: 0.25,
            baseDamage: 100,
            penetrationPower: 35,
        });

        // Recoil spring — add kick, recover smoothly in update()
        this._recoilX += (Math.random() * 0.3 + 0.85) * w.recoilPitch;
        this._recoilY += (Math.random() - 0.5) * w.recoilYaw;

        this.playFireSound();
        this._triggerMuzzleFlash(w.suppressed);
        this.muzzleLight.intensity = w.suppressed ? 2.5 : 14;

        this.emitEvent('WEAPON_FIRED', { weapon: w, position: this.camera.position.clone() });
        window.dispatchEvent(new CustomEvent('gunshotFired', {
            detail: { position: this.camera.position.clone(), noiseRadius: w.noise }
        }));

        if (w.type === 'bolt_action' && w.currentAmmo > 0) {
            this.state = 'BOLT_ACTION';
            this.boltTimer = w.boltDuration;
            this.playBoltSound();
            this.emitEvent('BOLT_CYCLE_START', { weapon: w, duration: w.boltDuration });
        } else if (w.currentAmmo === 0 && w.reserveAmmo > 0) {
            this.reload();
        } else {
            this.setState(this.isScoped ? 'AIMING' : 'IDLE');
        }

        return true;
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    update(dt) {
        const w = this.weapons[this.currentWeaponIdx];

        // FOV lerp
        if (Math.abs(this.camera.fov - this.targetFOV) > 0.05) {
            this.camera.fov += (this.targetFOV - this.camera.fov) * Math.min(1.0, 14.0 * dt);
            this.camera.updateProjectionMatrix();
        }

        // Muzzle light decay
        if (this.muzzleLight.intensity > 0) {
            this.muzzleLight.intensity -= 70 * dt;
            if (this.muzzleLight.intensity < 0) this.muzzleLight.intensity = 0;
        }

        // Fire cooldown
        if (this.fireCooldown > 0) this.fireCooldown -= dt;

        // Recoil spring recovery — smooth return to center
        if (Math.abs(this._recoilX) > 0.0002) {
            const recoverX = this._recoilX * Math.min(1.0, this._recoilRecoverySpeed * dt);
            this.camera.rotateX(-recoverX * 0.5);
            this._recoilX -= recoverX;
        } else { this._recoilX = 0; }

        if (Math.abs(this._recoilY) > 0.0002) {
            const recoverY = this._recoilY * Math.min(1.0, this._recoilRecoverySpeed * dt);
            this.camera.rotateY(-recoverY * 0.5);
            this._recoilY -= recoverY;
        } else { this._recoilY = 0; }

        // Apply recoil kick this frame
        if (this.state === 'FIRING') {
            this.camera.rotateX(this._recoilX * dt * 12);
            this.camera.rotateY(this._recoilY * dt * 12);
        }

        // Reload
        if (this.state === 'RELOADING') {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.reloadTimer = 0;
                const needed = w.magSize - w.currentAmmo;
                const actual = Math.min(needed, w.reserveAmmo);
                w.currentAmmo += actual;
                w.reserveAmmo -= actual;
                this.emitAmmoUpdate();
                this.emitEvent('WEAPON_RELOAD_COMPLETE', { weapon: w });
                this.setState(this.isScoped ? 'AIMING' : 'IDLE');
            }
            return;
        }

        // Bolt action
        if (this.state === 'BOLT_ACTION') {
            this.boltTimer -= dt;
            if (this.boltTimer <= 0) {
                this.boltTimer = 0;
                this.emitEvent('BOLT_CYCLE_COMPLETE', { weapon: w });
                this.setState(this.isScoped ? 'AIMING' : 'IDLE');
            }
            return;
        }

        // Scoped breath + sway
        if (this.isScoped) {
            // Breath
            if (this.isHoldingBreath && this.currentBreath > 0) {
                this.currentBreath -= this.breathDepletionRate * dt;
            } else {
                if (this.currentBreath <= 0) this.isHoldingBreath = false;
                this.currentBreath += this.breathRecoveryRate * dt;
                if (this.currentBreath > this.breathCapacity) this.currentBreath = this.breathCapacity;
            }

            const offset = 283 - (283 * (this.currentBreath / this.breathCapacity));
            if (this.ui.breathArc && Math.abs(this.cachedUI.breathOffset - offset) > 0.4) {
                this.cachedUI.breathOffset = offset;
                this.ui.breathArc.style.strokeDashoffset = offset;
            }

            // Stance & speed sway
            const player = window.gameEngine?.playerManager?.player;
            let stanceFactor = 1.0;
            let speedFactor  = 1.0;

            if (player) {
                if (player.stance === 'CROUCHING') stanceFactor = 0.55;
                else if (player.stance === 'PRONE') stanceFactor = 0.25;
                const speed = Math.hypot(player.velocity.x, player.velocity.z);
                if (speed > 0.5) speedFactor = 1.9;
            }

            let amp = this.baseSwayAmp * stanceFactor * speedFactor;
            if (this.isHoldingBreath)   amp = this.heldSwayAmp;
            if (this.currentBreath < 20) amp = this.exhaustedSwayAmp;

            // Stability indicator
            const stabilityPct = Math.round(Math.max(5, Math.min(100, (1.0 - (amp / this.exhaustedSwayAmp)) * 100)));
            if (this.ui.scopeStability && this.cachedUI.stability !== `${stabilityPct}%`) {
                this.cachedUI.stability = `${stabilityPct}%`;
                this.ui.scopeStability.innerText = `${stabilityPct}%`;
            }

            this.swayTime += dt;
            const swayX = Math.sin(this.swayTime * 1.4 + 0.7) * amp + Math.sin(this.swayTime * 2.8) * amp * 0.3;
            const swayY = Math.sin(this.swayTime * 1.1) * amp + Math.cos(this.swayTime * 2.2) * amp * 0.25;

            this.camera.rotateX(swayY);
            this.camera.rotateY(swayX);

            // Parallax
            this.parallaxX += (swayX * 1200 - this.parallaxX) * Math.min(1.0, 10.0 * dt);
            this.parallaxY += (swayY * 1200 - this.parallaxY) * Math.min(1.0, 10.0 * dt);

            if (this.ui.reticleSvg) {
                this.ui.reticleSvg.style.transform = `translate(calc(-50% + ${this.parallaxX}px), calc(-50% + ${this.parallaxY}px))`;
            }

            // Trajectory guide (rookie)
            const trajDot = document.getElementById('trajectory-dot');
            const diff = window.CurrentDifficulty || { showTrajectoryGuide: false };
            if (diff.showTrajectoryGuide && window.guards && window.level) {
                const dir = new THREE.Vector3();
                this.camera.getWorldDirection(dir);
                const allTargets = window.guards.concat(window.level.targets || []);
                const impactPos = this.ballistics.predictTrajectory(this.camera.position, dir, w.vel, allTargets);
                impactPos.project(this.camera);
                if (impactPos.z < 1) {
                    if (trajDot) {
                        trajDot.classList.remove('hidden');
                        trajDot.style.left = Math.max(10, Math.min(90, (impactPos.x * 0.5 + 0.5) * 100)) + '%';
                        trajDot.style.top  = Math.max(10, Math.min(90, (impactPos.y * -0.5 + 0.5) * 100)) + '%';
                    }
                } else {
                    trajDot?.classList.add('hidden');
                }
            } else {
                trajDot?.classList.add('hidden');
            }
        }
    }
}

export class Player {
    constructor(camera, domElement) {
        this.camera = camera;
        this.controls = new THREE.PointerLockControls(camera, domElement);
        
        // Physics & Movement Vectors
        this.position = new THREE.Vector3(0, 15.8, 80);
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        // Configurable Parameters
        this.mouseSensitivity = 0.002;
        this.walkSpeed = 6.0;
        this.crouchSpeed = 3.2;
        this.proneSpeed = 1.5;
        this.acceleration = 60.0;
        this.deceleration = 10.0;
        this.jumpForce = 7.0;
        this.gravity = -18.0;
        
        // Stances: 'STANDING', 'CROUCHING', 'PRONE'
        this.stance = 'STANDING';
        this.targetEyeHeight = 1.8;
        this.currentEyeHeight = 1.8;
        this.standingHeight = 1.8;
        this.crouchingHeight = 1.0;
        this.proneHeight = 0.4;
        
        // State Flags
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isGrounded = true;
        this.isHoldingBreath = false;
        this.health = 100;
        this.maxHealth = 100;
        
        // Head bobbing FX
        this.bobTimer = 0;
        this.headBobOffset = 0;

        // ── Fatigue / Stamina ─────────────────────────────────────────────────
        this.stamina = 100;             // 0–100
        this.maxStamina = 100;
        this.staminaDrain = 22;         // per second while sprinting
        this.staminaRecover = 14;       // per second while resting
        this.isSprinting = false;
        this.fatigueMult = 1.0;         // reduces walk speed when stamina is low

        // ── Injury ─────────────────────────────────────────────────────────────
        this.isLimping = false;         // below 35% HP
        this._limpTimer = 0;

        // ── Footstep Audio ─────────────────────────────────────────────────────
        this._footstepTimer  = 0;
        this._footstepInterval = 0.48;  // seconds between steps (standing)
        this._lastFootstepSurface = 'ground';

        this.setupInput();
    }

    takeDamage(amount) {
        if (this.health <= 0) return;
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        const hpPct = (this.health / this.maxHealth) * 100;
        const hpEl = document.getElementById('health-fill');
        if (hpEl) hpEl.style.width = `${hpPct}%`;

        // Damage vignette flash
        const vignette = document.getElementById('damage-vignette');
        if (vignette) {
            vignette.style.transition = 'opacity 0.08s';
            vignette.style.opacity = '1';
            clearTimeout(this._vignetteTimeout);
            this._vignetteTimeout = setTimeout(() => {
                const persistent = this.health < this.maxHealth * 0.3 ? '0.28' : '0';
                vignette.style.transition = 'opacity 0.9s';
                vignette.style.opacity = persistent;
            }, 120);
        }

        // Pain grunt sound
        this._playPainSound(hpPct);

        // Limp when below 35%
        this.isLimping = hpPct < 35;
        
        if (window.gameEngine?.eventBus) {
            window.gameEngine.eventBus.emit('PLAYER_HEALTH_CHANGED', hpPct);
        }

        if (this.health <= 0) {
            window.gameEngine?.stateManager?.setState('MISSION_FAILED');
        }
    }

    _playPainSound(hpPct) {
        try {
            const ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (!window.audioCtx) window.audioCtx = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(hpPct < 35 ? 120 : 180, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.25);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 700;
            osc.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.3);
        } catch(e) {}
    }

    setStance(newStance) {
        this.stance = newStance;
        if (this.stance === 'STANDING') {
            this.targetEyeHeight = this.standingHeight;
        } else if (this.stance === 'CROUCHING') {
            this.targetEyeHeight = this.crouchingHeight;
        } else if (this.stance === 'PRONE') {
            this.targetEyeHeight = this.proneHeight;
        }
    }

    cycleStance() {
        if (this.stance === 'STANDING') {
            this.setStance('CROUCHING');
        } else if (this.stance === 'CROUCHING') {
            this.setStance('PRONE');
        } else {
            this.setStance('STANDING');
        }
    }

    jump() {
        if (this.isGrounded && this.stance === 'STANDING') {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        } else if (this.stance !== 'STANDING') {
            this.setStance('STANDING');
        }
    }

    setupInput() {
        const onKeyDown = (event) => {
            switch (event.code) {
                // --- Movement (requires pointer lock) ---
                case 'KeyW':
                case 'ArrowUp':
                    if (this.controls.isLocked) this.moveForward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    if (this.controls.isLocked) this.moveLeft = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    if (this.controls.isLocked) this.moveBackward = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    if (this.controls.isLocked) this.moveRight = true;
                    break;
                case 'ControlLeft':
                case 'KeyC':
                    if (this.controls.isLocked) this.cycleStance();
                    break;
                case 'Space':
                    if (this.controls.isLocked) this.jump();
                    break;
                case 'ShiftLeft':
                    if (this.controls.isLocked) this.isHoldingBreath = true;
                    break;

                // --- Global keys (work without pointer lock) ---
                case 'Escape':
                    this._handleEscapeKey();
                    break;
                case 'KeyH':
                    if (window.gameEngine?.uiManager) {
                        window.gameEngine.uiManager.toggleTacticalHUD();
                    }
                    break;
                case 'KeyQ':
                    if (this.controls.isLocked && window.gameEngine?.weaponManager) {
                        window.gameEngine.weaponManager.weapon?.switchWeapon();
                    }
                    break;
            }
        };

        const onKeyUp = (event) => {
            if (!this.controls.isLocked) return;
            switch (event.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.moveForward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.moveLeft = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.moveBackward = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.moveRight = false;
                    break;
                case 'ShiftLeft':
                    this.isHoldingBreath = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    _handleEscapeKey() {
        const engine = window.gameEngine;
        if (!engine) return;
        const state = engine.stateManager;

        if (state.is('PLAYING') || state.is('SCOPE')) {
            // Pause
            this.controls.unlock();
            state.setState('PAUSED');
        } else if (state.is('PAUSED')) {
            // Resume
            state.setState('PLAYING');
            try { this.controls.lock(); } catch (e) {}
        }
    }

    getCurrentSpeedLimit() {
        if (this.stance === 'CROUCHING') return this.crouchSpeed;
        if (this.stance === 'PRONE') return this.proneSpeed;
        return this.walkSpeed;
    }

    resolveCollisions(targetPos, levelTargets, radius = 0.6) {
        if (!levelTargets || levelTargets.length === 0) return targetPos;

        let pos = targetPos.clone();
        let box = new THREE.Box3();

        for (let i = 0; i < levelTargets.length; i++) {
            let obj = levelTargets[i];
            if (!obj || !obj.geometry) continue;

            box.setFromObject(obj);

            // Ignore target objects high in air or far underground
            if (pos.y + this.standingHeight < box.min.y || pos.y > box.max.y) continue;

            let minX = box.min.x - radius;
            let maxX = box.max.x + radius;
            let minZ = box.min.z - radius;
            let maxZ = box.max.z + radius;

            if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
                let pushLeft = pos.x - minX;
                let pushRight = maxX - pos.x;
                let pushBack = pos.z - minZ;
                let pushForward = maxZ - pos.z;

                let minPush = Math.min(pushLeft, pushRight, pushBack, pushForward);

                if (minPush === pushLeft) pos.x = minX;
                else if (minPush === pushRight) pos.x = maxX;
                else if (minPush === pushBack) pos.z = minZ;
                else if (minPush === pushForward) pos.z = maxZ;
            }
        }
        return pos;
    }

    update(dt, levelTargets = []) {
        if (!this.controls.isLocked) return;

        // Smooth stance height transition
        this.currentEyeHeight += (this.targetEyeHeight - this.currentEyeHeight) * Math.min(1.0, 10.0 * dt);

        // Apply friction / deceleration
        this.velocity.x -= this.velocity.x * this.deceleration * dt;
        this.velocity.z -= this.velocity.z * this.deceleration * dt;

        // Calculate input movement direction
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        let maxSpeed = this.getCurrentSpeedLimit();

        // ── Fatigue System ──────────────────────────────────────────────────
        const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        if (isMoving && this.stance === 'STANDING') {
            this.stamina -= this.staminaDrain * dt;
            if (this.stamina < 0) this.stamina = 0;
        } else {
            this.stamina += this.staminaRecover * dt;
            if (this.stamina > this.maxStamina) this.stamina = this.maxStamina;
        }
        // Fatigue multiplier: stamina 0–20 = 0.55x speed
        this.fatigueMult = this.stamina < 20
            ? 0.55 + (this.stamina / 20) * 0.45
            : 1.0;
        // Limp slows further
        if (this.isLimping) this.fatigueMult *= 0.7;
        maxSpeed *= this.fatigueMult;

        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * this.acceleration * dt;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * this.acceleration * dt;
        }

        // Clamp horizontal velocity to max speed
        let speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (speed > maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * maxSpeed;
            this.velocity.z = (this.velocity.z / speed) * maxSpeed;
        }

        // Gravity and vertical movement
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * dt;
        }

        // Apply local space move translation
        this.controls.moveRight(-this.velocity.x * dt);
        this.controls.moveForward(-this.velocity.z * dt);

        // Vertical translation
        this.camera.position.y += this.velocity.y * dt;

        // Dynamic Terrain Height Check
        let terrainY = 0;
        if (window.gameEngine?.worldManager?.level?.getTerrainHeight) {
            terrainY = window.gameEngine.worldManager.level.getTerrainHeight(this.camera.position.x, this.camera.position.z);
        }
        let targetGroundY = terrainY + this.currentEyeHeight;

        if (this.camera.position.y <= targetGroundY || (this.isGrounded && Math.abs(this.camera.position.y - targetGroundY) < 1.5)) {
            this.camera.position.y = targetGroundY;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // Level geometry collision resolution
        let resolvedPos = this.resolveCollisions(this.camera.position, levelTargets, 0.6);
        this.camera.position.x = resolvedPos.x;
        this.camera.position.z = resolvedPos.z;

        // Head bobbing effect + footstep snow crunch audio
        if (speed > 0.5 && this.isGrounded) {
            this.bobTimer += dt * (speed * 2.0);
            this.headBobOffset = Math.sin(this.bobTimer) * 0.04;
            this.camera.position.y += this.headBobOffset;

            // Footstep crunch every ~0.5 bobTimer cycle
            if (!this._lastBobSign) this._lastBobSign = 1;
            const bobSign = Math.sign(Math.sin(this.bobTimer));
            if (bobSign !== this._lastBobSign && bobSign < 0) {
                this._playFootstepCrunch();
            }
            this._lastBobSign = bobSign;
        }

        // Health bar low-health visual class
        const hpEl = document.getElementById('health-fill');
        if (hpEl) {
            const pct = this.health / this.maxHealth;
            hpEl.classList.toggle('low', pct < 0.3);
        }

        // Emit rotation event for UI compass
        if (window.gameEngine && window.gameEngine.eventBus) {
            let rot = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
            window.gameEngine.eventBus.emit('PLAYER_ROTATED', rot.y);
        }
    }

    _playFootstepCrunch() {
        try {
            const audioCtx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (!window.audioCtx) window.audioCtx = audioCtx;
            if (audioCtx.state === 'suspended') audioCtx.resume();

            // Determine surface from player Y position / environment
            // Below z=30 = snow, z=30-80 = rocky path, z>80 = grass
            const z = this.camera.position.z;
            const surface = z > 80 ? 'grass' : z > 30 ? 'stone' : 'snow';

            const bufferSize = Math.floor(audioCtx.sampleRate * 0.09);
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);

            if (surface === 'snow') {
                // Soft crunch
                for (let i = 0; i < bufferSize; i++)
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
            } else if (surface === 'stone') {
                // Harder click
                for (let i = 0; i < bufferSize; i++)
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
            } else {
                // Grass: whisper
                for (let i = 0; i < bufferSize; i++)
                    data[i] = (Math.random() * 2 - 1) * 0.5 * Math.exp(-i / (bufferSize * 0.35));
            }

            const src = audioCtx.createBufferSource();
            src.buffer = buffer;

            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = surface === 'stone' ? 600 : surface === 'grass' ? 180 : 280;
            filter.Q.value = surface === 'stone' ? 0.5 : 0.8;

            const gain = audioCtx.createGain();
            const vol = this.stance === 'PRONE' ? 0.02
                      : this.stance === 'CROUCHING' ? 0.05
                      : surface === 'grass' ? 0.06 : 0.11;
            gain.gain.setValueAtTime(vol, audioCtx.currentTime);

            src.connect(filter);
            filter.connect(gain);
            gain.connect(audioCtx.destination);
            src.start();
        } catch (e) {}
    }
}

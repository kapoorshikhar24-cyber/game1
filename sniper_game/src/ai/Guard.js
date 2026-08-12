/**
 * Guard.js — Full Tactical AI
 * States: PATROL → SUSPICIOUS → INVESTIGATE → SEARCH → ALERT → COMBAT → FLANK → COVER → DEAD
 * Features:
 *  - Cover-seeking when shot at
 *  - Flanking maneuver (tries to move laterally around player)
 *  - Radio callout (beeps through RadioDialogueSystem)
 *  - Panic sprint on first shot
 *  - Crouching in combat
 *  - Corpse discovery
 *  - Proper line-of-sight raycast
 */

export class Guard {
    constructor(scene, startPos, waypoints, isVIP = false, isTara = false) {
        this.scene = scene;
        this.position = startPos.clone();
        this.waypoints = waypoints || [startPos.clone()];
        this.isVIP = isVIP;
        this.isTara = isTara;

        // ── State Machine ─────────────────────────────────────────────────────
        // PATROL, IDLE, SUSPICIOUS, INVESTIGATE, SEARCH, ALERT, COMBAT, FLANK, COVER, RETURN, DEAD
        this.state = 'PATROL';
        this.currentWaypoint = 0;

        // ── Movement speeds ───────────────────────────────────────────────────
        this.patrolSpeed    = 1.8;
        this.investigateSpeed = 3.2;
        this.runSpeed       = 4.8;   // Combat sprint
        this.crouchSpeed    = 1.8;   // Crouching advance

        // ── Detection ─────────────────────────────────────────────────────────
        const diff = window.CurrentDifficulty || { visionMultiplier: 1.0, suspicionRate: 1.0, guardDamage: 10 };
        this.visionRange  = 85 * diff.visionMultiplier;
        this.visionAngle  = (Math.PI / 2.8) * diff.visionMultiplier;  // ~64° cone
        this.hearingRange = 40;
        this.damage       = diff.guardDamage;

        // ── Timers ────────────────────────────────────────────────────────────
        this.suspicion        = 0;
        this.investigateTarget = null;
        this.investigateTimer  = 0;
        this.searchTimer       = 0;
        this.idleTimer         = 0;
        this.attackTimer       = 0;
        this.visionTimer       = 0;
        this.coverTimer        = 0;       // How long to stay in cover
        this.flankTimer        = 0;       // How long to flank before resuming combat
        this.panicTimer        = 0;       // Sprint away on first shot heard
        this.radioTimer        = 0;       // Cooldown between radio calls

        // ── Combat state ──────────────────────────────────────────────────────
        this.isCrouching       = false;
        this.coverPosition     = null;    // Nearest cover point
        this.flankPosition     = null;    // Flank target
        this.hasSentRadioCall  = false;   // Plays radio callout only once per alert
        this.lastKnownPlayerPos = null;

        // ── Mesh ──────────────────────────────────────────────────────────────
        this._buildMesh();
    }

    _buildMesh() {
        const bodyGeo = new THREE.CylinderGeometry(0.42, 0.48, 1.8, 12);
        let color = 0x2e382e;
        if (this.isVIP)  color = 0x111622;
        if (this.isTara) color = 0x7c3aed;

        this.mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.15 });
        this.body = new THREE.Mesh(bodyGeo, this.mat);
        this.body.position.copy(this.position);
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        this.body.userData.isGuard   = true;
        this.body.userData.guardRef  = this;
        this.body.userData.matType   = 'flesh';

        // Head
        const headGeo = new THREE.SphereGeometry(0.26, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd4956a, roughness: 0.5 });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.set(0, 1.1, 0);
        this.head.castShadow = true;
        this.head.userData.isHead   = true;
        this.head.userData.guardRef = this;
        this.body.add(this.head);

        // Weapon (rifle silhouette)
        const rifleGeo  = new THREE.BoxGeometry(0.08, 0.08, 0.9);
        const rifleMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
        this.rifle = new THREE.Mesh(rifleGeo, rifleMat);
        this.rifle.position.set(0.45, 0.6, 0.35);
        this.rifle.rotation.x = -0.2;
        this.body.add(this.rifle);

        // Kabir beret
        if (this.isVIP) {
            const beretGeo = new THREE.CylinderGeometry(0.28, 0.3, 0.11, 14);
            const beretMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
            const beret = new THREE.Mesh(beretGeo, beretMat);
            beret.position.set(0, 0.26, 0);
            beret.rotation.z = -0.12;
            this.head.add(beret);
        }

        this.scene.add(this.body);
        this.body.geometry.computeBoundingBox();
        this.head.geometry.computeBoundingBox();

        // Weapon muzzle flash point (off-scene, for future use)
        this.muzzlePos = new THREE.Object3D();
        this.muzzlePos.position.set(0.45, 0.6, 1.0);
        this.body.add(this.muzzlePos);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    emitEvent(name, payload) {
        window.gameEngine?.eventBus?.emit(name, payload);
    }

    _playGuardAudio(type) {
        try {
            const ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (!window.audioCtx) window.audioCtx = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;

            if (type === 'gunshot') {
                // Distant crack — the guard shooting
                const bufLen = Math.floor(ctx.sampleRate * 0.25);
                const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
                const src = ctx.createBufferSource();
                src.buffer = buf;
                const bp = ctx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.value = 800;
                bp.Q.value = 0.5;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
                src.start(now); src.stop(now + 0.25);
            } else if (type === 'radio_static') {
                // Radio static burst (guard calling backup)
                const bufLen = Math.floor(ctx.sampleRate * 0.15);
                const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
                const src = ctx.createBufferSource();
                src.buffer = buf;
                const bp = ctx.createBiquadFilter();
                bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
                src.start(now); src.stop(now + 0.15);
            } else if (type === 'shout') {
                // Guard shout — synthetic vocal
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.linearRampToValueAtTime(220, now + 0.08);
                osc.frequency.linearRampToValueAtTime(130, now + 0.22);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                const lp = ctx.createBiquadFilter();
                lp.type = 'lowpass'; lp.frequency.value = 900;
                osc.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
                osc.start(now); osc.stop(now + 0.3);
            }
        } catch(e) {}
    }

    hearNoise(noisePos, noiseRadius) {
        if (this.state === 'DEAD' || this.isTara) return;

        const dist = this.position.distanceTo(noisePos);
        if (dist <= noiseRadius) {
            if (this.state === 'PATROL' || this.state === 'IDLE' || this.state === 'RETURN') {
                this.investigateTarget = noisePos.clone();
                this.suspicion = Math.max(this.suspicion, 55);
                this.state = 'INVESTIGATE';
                this.investigateTimer = 7.0;
                this.emitEvent('GUARD_HEARD_NOISE', { guard: this, position: noisePos });

                // Shout
                this._playGuardAudio('shout');
            } else if (this.state === 'SUSPICIOUS') {
                // Escalate to investigate immediately
                this.state = 'INVESTIGATE';
                this.investigateTimer = 7.0;
                this.investigateTarget = noisePos.clone();
            }
        }
    }

    triggerAlert(targetLocation = null) {
        if (this.state === 'DEAD' || this.isTara) return;
        this.state = 'COMBAT';
        if (targetLocation) {
            this.investigateTarget = targetLocation.clone();
            this.lastKnownPlayerPos = targetLocation.clone();
        }

        // Radio callout — once per alert
        if (!this.hasSentRadioCall) {
            this.hasSentRadioCall = true;
            this.radioTimer = 1.5;
            this._playGuardAudio('radio_static');
            // Emit radio event for dialogue system
            setTimeout(() => {
                this.emitEvent('COMPOUND_ALERT_LEVEL_CHANGED', 'alerted');
                const radio = window.gameEngine?.missionManager?.radioSystem;
                if (radio) {
                    const lines = [
                        "Contact! Armed intruder in the compound!",
                        "All units — intruder spotted! Seal the perimeter!",
                        "We have a breach! Weapons free!",
                    ];
                    radio.speak(
                        'ENEMY COMMS',
                        lines[Math.floor(Math.random() * lines.length)],
                        3.5,
                        '#ef4444'
                    );
                }
            }, 800);
        }

        this.emitEvent('GUARD_ALERTED', this);
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    update(dt, player, allGuards) {
        if (this.state === 'DEAD') return;

        // Vision check every 100ms
        this.visionTimer += dt;
        if (this.visionTimer >= 0.1 && !this.isTara) {
            this._checkVisionAndCorpses(player, allGuards, this.visionTimer);
            this.visionTimer = 0;
        }

        switch (this.state) {

            case 'IDLE':
                this.idleTimer -= dt;
                this._applyCrouchVisual(false);
                if (this.idleTimer <= 0) this.state = 'PATROL';
                break;

            case 'PATROL':
                this._applyCrouchVisual(false);
                if (this.waypoints.length > 0) {
                    const wp = this.waypoints[this.currentWaypoint];
                    this.moveToward(wp, this.patrolSpeed, dt);
                    if (this.position.distanceTo(wp) < 0.9) {
                        this.currentWaypoint = (this.currentWaypoint + 1) % this.waypoints.length;
                        this.state = 'IDLE';
                        this.idleTimer = 1.8 + Math.random() * 2.5;
                    }
                }
                break;

            case 'SUSPICIOUS':
                if (this.investigateTarget) this.lookToward(this.investigateTarget);
                if (this.suspicion >= 50) {
                    this.state = 'INVESTIGATE';
                    this.investigateTimer = 7.0;
                } else if (this.suspicion <= 0) {
                    this.state = 'PATROL';
                }
                break;

            case 'INVESTIGATE':
                this._applyCrouchVisual(false);
                if (this.investigateTarget) {
                    this.moveToward(this.investigateTarget, this.investigateSpeed, dt);
                    this.investigateTimer -= dt;
                    if (this.position.distanceTo(this.investigateTarget) < 1.8) {
                        this.state = 'SEARCH';
                        this.searchTimer = 6.0;
                    } else if (this.investigateTimer <= 0) {
                        this.state = 'RETURN';
                        this.investigateTarget = null;
                    }
                } else {
                    this.state = 'PATROL';
                }
                break;

            case 'SEARCH':
                this.searchTimer -= dt;
                this.body.rotation.y += 1.2 * dt;
                if (this.searchTimer <= 0) {
                    this.state = 'RETURN';
                    this.investigateTarget = null;
                }
                break;

            case 'RETURN': {
                this._applyCrouchVisual(false);
                const nearWp = this._findNearestWaypoint();
                this.moveToward(nearWp, this.patrolSpeed, dt);
                if (this.position.distanceTo(nearWp) < 1.0) {
                    this.state = 'PATROL';
                    this.suspicion = 0;
                    this.hasSentRadioCall = false;
                }
                break;
            }

            case 'COMBAT':
                this._updateCombat(dt, player, allGuards);
                break;

            case 'COVER':
                this._updateCover(dt, player);
                break;

            case 'FLANK':
                this._updateFlank(dt, player);
                break;
        }
    }

    _updateCombat(dt, player, allGuards) {
        if (!player?.camera) return;

        const pPos = player.camera.position.clone();
        this.lastKnownPlayerPos = pPos.clone();

        // Face player
        this.lookToward(pPos);

        // Crouch in combat
        this._applyCrouchVisual(true);

        // Attack timer
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.attackTimer = 0.9 + Math.random() * 0.6;
            this._executeAttack(player);
            this._playGuardAudio('gunshot');
        }

        // Occasionally seek cover (30% chance every ~4s)
        if (!this.coverTimer) this.coverTimer = 3.5 + Math.random() * 3;
        this.coverTimer -= dt;
        if (this.coverTimer <= 0) {
            this.coverTimer = 0;
            if (Math.random() < 0.35) {
                this._seekCover(pPos);
            } else if (Math.random() < 0.25 && allGuards) {
                this._attemptFlank(pPos);
            }
        }

        // Advance slowly toward last known position
        const distToPlayer = this.position.distanceTo(pPos);
        if (distToPlayer > 20) {
            this.moveToward(pPos, this.crouchSpeed, dt);
        }
    }

    _updateCover(dt, player) {
        this.coverTimer -= dt;
        this._applyCrouchVisual(true);

        if (this.coverPosition) {
            this.moveToward(this.coverPosition, this.runSpeed, dt);
            if (this.position.distanceTo(this.coverPosition) < 1.5) {
                // Reached cover — wait, then re-engage
                if (this.coverTimer <= 0) {
                    this.state = 'COMBAT';
                    this.coverPosition = null;
                }
            }
        } else {
            this.state = 'COMBAT';
        }

        if (this.coverTimer <= 0) {
            this.state = 'COMBAT';
        }
    }

    _updateFlank(dt, player) {
        this.flankTimer -= dt;
        this._applyCrouchVisual(true);

        if (this.flankPosition) {
            this.moveToward(this.flankPosition, this.runSpeed, dt);
            if (this.position.distanceTo(this.flankPosition) < 2.0) {
                this.state = 'COMBAT';
                this.flankPosition = null;
            }
        }

        if (this.flankTimer <= 0) {
            this.state = 'COMBAT';
            this.flankPosition = null;
        }
    }

    _seekCover(playerPos) {
        // Find a point behind the guard (away from player) = cover
        const awayDir = new THREE.Vector3()
            .subVectors(this.position, playerPos)
            .normalize();
        const coverPos = this.position.clone().addScaledVector(awayDir, 5 + Math.random() * 8);
        coverPos.y = 0;
        this.coverPosition = coverPos;
        this.state = 'COVER';
        this.coverTimer = 2.5 + Math.random() * 2.0;
    }

    _attemptFlank(playerPos) {
        // Move perpendicular to the player direction
        const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
        toPlayer.y = 0;
        toPlayer.normalize();

        // Perpendicular (left or right)
        const perp = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);
        if (Math.random() < 0.5) perp.negate();

        const flankPos = this.position.clone()
            .addScaledVector(perp, 8 + Math.random() * 6)
            .addScaledVector(toPlayer, 4 + Math.random() * 4);
        flankPos.y = 0;

        this.flankPosition = flankPos;
        this.state = 'FLANK';
        this.flankTimer = 4.0;
    }

    _applyCrouchVisual(shouldCrouch) {
        if (this.isCrouching === shouldCrouch) return;
        this.isCrouching = shouldCrouch;
        if (shouldCrouch) {
            this.body.scale.y = 0.6;
            this.body.position.y = this.position.y - 0.35;
        } else {
            this.body.scale.y = 1.0;
            this.body.position.y = this.position.y;
        }
    }

    _executeAttack(player) {
        if (this.state !== 'COMBAT' && this.state !== 'COVER' && this.state !== 'FLANK') return;
        if (!player?.takeDamage) return;

        // Accuracy degraded by distance
        const dist = player.camera?.position
            ? this.position.distanceTo(player.camera.position)
            : 999;
        const hitChance = Math.max(0.2, 1.0 - dist / 120);

        if (Math.random() < hitChance) {
            player.takeDamage(this.damage);
            // Red flash
            this.mat.emissive?.setHex(0xff2200);
            setTimeout(() => this.mat.emissive?.setHex(0x000000), 80);
        }
    }

    // ─── Vision / Corpse Detection ─────────────────────────────────────────────

    _checkVisionAndCorpses(player, allGuards, dt) {
        // Corpse discovery
        for (const g of allGuards) {
            if (g !== this && g.state === 'DEAD') {
                const dist = this.position.distanceTo(g.position);
                if (dist < 35) {
                    const dir = new THREE.Vector3().subVectors(g.position, this.position).normalize();
                    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.body.quaternion);
                    if (forward.angleTo(dir) < this.visionAngle) {
                        this.triggerAlert(g.position);
                        this.emitEvent('BODY_DISCOVERED', { guard: this, deadGuard: g });
                        return;
                    }
                }
            }
        }

        if (!player?.camera) return;

        const playerPos = player.camera.position.clone();
        const distToPlayer = this.position.distanceTo(playerPos);

        let effectiveRange = this.visionRange;
        if (player.stance === 'CROUCHING') effectiveRange *= 0.55;
        else if (player.stance === 'PRONE') effectiveRange *= 0.28;

        let playerVisible = false;

        if (distToPlayer < effectiveRange) {
            const dirToPlayer = new THREE.Vector3().subVectors(playerPos, this.position).normalize();
            const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.body.quaternion);

            if (forward.angleTo(dirToPlayer) < this.visionAngle) {
                const ray = new THREE.Raycaster(
                    this.position.clone().add(new THREE.Vector3(0, 1.5, 0)),
                    dirToPlayer,
                    0,
                    distToPlayer
                );
                const hits = ray.intersectObjects(this.scene.children, false);
                if (hits.length === 0 || hits[0].distance > distToPlayer - 1.2) {
                    playerVisible = true;
                }
            }
        }

        const diff = window.CurrentDifficulty || { suspicionRate: 1.0 };

        if (playerVisible) {
            const speedMult = player.velocity?.length() > 0.5 ? 1.6 : 1.0;
            const distFactor = 1.0 - (distToPlayer / effectiveRange);
            const fillRate = 28 * diff.suspicionRate * (distFactor + 0.2) * speedMult;
            this.suspicion += fillRate * dt;

            if (this.suspicion >= 100) {
                this.triggerAlert(playerPos);
            } else if (['PATROL', 'IDLE', 'RETURN'].includes(this.state)) {
                this.investigateTarget = playerPos.clone();
                this.state = 'SUSPICIOUS';
            }
        } else {
            this.suspicion = Math.max(0, this.suspicion - 18 * dt);
        }
    }

    // ─── Movement ──────────────────────────────────────────────────────────────

    moveToward(target, speed, dt) {
        const dir = new THREE.Vector3().subVectors(target, this.position);
        dir.y = 0;
        if (dir.lengthSq() > 0.01) {
            dir.normalize();
            this.position.addScaledVector(dir, speed * dt);
            this.body.position.copy(this.position);
            if (this.isCrouching) this.body.position.y -= 0.35;
            this.lookToward(this.position.clone().add(dir));
        }
    }

    lookToward(targetPos) {
        const p = targetPos.clone();
        p.y = this.position.y;
        this.body.lookAt(p);
    }

    _findNearestWaypoint() {
        if (!this.waypoints?.length) return this.position;
        let nearest = this.waypoints[0];
        let minDist = this.position.distanceTo(nearest);
        for (const wp of this.waypoints) {
            const d = this.position.distanceTo(wp);
            if (d < minDist) { minDist = d; nearest = wp; }
        }
        return nearest;
    }

    // ─── Death ────────────────────────────────────────────────────────────────

    die() {
        if (this.state === 'DEAD') return;
        this.state = 'DEAD';

        // Fall animation
        this.body.rotation.x = Math.PI / 2;
        this.body.position.y = 0.28;
        this.body.scale.y = 1.0; // Reset crouch scale
        this.mat.color.setHex(0x3a3a3a);

        // Weapon drops
        if (this.rifle) {
            this.body.remove(this.rifle);
            this.rifle.position.copy(this.position);
            this.rifle.position.y = 0.06;
            this.rifle.rotation.set(Math.PI / 2, Math.random() * Math.PI, 0);
            this.scene.add(this.rifle);
        }

        this.emitEvent('GUARD_KILLED', this);
    }
}

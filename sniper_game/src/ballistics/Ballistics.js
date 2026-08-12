export class Ballistics {
    constructor(scene, eventBus = null) {
        this.scene = scene;
        this.eventBus = eventBus;
        this.bullets = [];

        // Base Physics Constants
        this.gravity = new THREE.Vector3(0, -9.81, 0);

        // Configurable Environment Wind System
        this.windDirection = 90; // Degrees (90 = East)
        this.windStrength = 4.0;  // m/s
        this.windVariation = 1.5; // Gust fluctuation
        this.windVector = new THREE.Vector3();

        this.updateWindVector(0);
    }

    setEventBus(eventBus) {
        this.eventBus = eventBus;
    }

    emitEvent(name, payload) {
        if (this.eventBus) {
            this.eventBus.emit(name, payload);
        } else if (window.gameEngine && window.gameEngine.eventBus) {
            window.gameEngine.eventBus.emit(name, payload);
        }
    }

    updateWindVector(timeSec) {
        let gust = Math.sin(timeSec * 0.5) * 0.4 + Math.cos(timeSec * 1.3) * 0.2;
        let currentSpeed = Math.max(0, this.windStrength + gust * this.windVariation);
        let rad = THREE.MathUtils.degToRad(this.windDirection);

        this.windVector.set(Math.cos(rad) * currentSpeed, 0, Math.sin(rad) * currentSpeed);

        let windSpeedEl = document.getElementById('wind-speed');
        if (windSpeedEl) {
            let diff = window.CurrentDifficulty || { windErrorMargin: 0 };
            let displayWind = currentSpeed;
            if (diff.windErrorMargin > 0) {
                displayWind += (Math.random() - 0.5) * diff.windErrorMargin;
                displayWind = Math.max(0, displayWind);
            }
            windSpeedEl.innerText = displayWind.toFixed(1);
        }

        let arrow = document.getElementById('wind-arrow');
        if (arrow) {
            arrow.style.transform = `rotate(${this.windVector.x >= 0 ? 90 : -90}deg)`;
        }

        this.emitEvent('WIND_UPDATED', { speed: currentSpeed, direction: this.windDirection });
    }

    fireBullet(position, direction, velocityMag, bulletParams = {}) {
        const mass = bulletParams.mass || 0.010;             // 10 grams (7.62mm)
        const caliber = bulletParams.caliber || 0.00762;     // 7.62mm
        const dragCoeff = bulletParams.dragCoefficient || 0.25;
        const baseDamage = bulletParams.baseDamage || 100;
        const penetration = bulletParams.penetrationPower || 35; // mm capacity

        // Create Visual Bullet Mesh
        const geo = new THREE.SphereGeometry(0.04, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        this.scene.add(mesh);

        // Create Visual Trail Mesh
        const trailGeo = new THREE.CylinderGeometry(0.015, 0.015, 8, 4);
        trailGeo.rotateX(Math.PI / 2);
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        const trailMesh = new THREE.Mesh(trailGeo, trailMat);
        this.scene.add(trailMesh);

        // Dynamic Tracer Light (No Shadows for performance)
        const trailLight = new THREE.PointLight(0xffaa55, 1.0, 6);
        trailLight.castShadow = false;
        this.scene.add(trailLight);

        let initialVel = direction.clone().normalize().multiplyScalar(velocityMag);

        let bullet = {
            position: position.clone(),
            velocity: initialVel,
            startPosition: position.clone(),
            mass: mass,
            caliber: caliber,
            muzzleVelocity: velocityMag,
            gravity: this.gravity.clone(),
            dragCoefficient: dragCoeff,
            baseDamage: baseDamage,
            penetrationPower: penetration,
            lifetime: 0,
            travelledDistance: 0,
            mesh: mesh,
            trailMesh: trailMesh,
            trailLight: trailLight,
            hasCam: false
        };

        this.bullets.push(bullet);

        this.emitEvent('BULLET_FIRED', {
            position: bullet.position.clone(),
            velocity: bullet.velocity.clone(),
            caliber: bullet.caliber,
            mass: bullet.mass
        });

        // Pre-simulate trajectory for long-range Kill Cam check
        if (window.guards && window.guards.length > 0) {
            let simPos = position.clone();
            let simVel = initialVel.clone();
            let simLife = 0;
            let simDt = 0.016;

            while (simLife < 5) {
                let prev = simPos.clone();
                simVel.addScaledVector(this.gravity, simDt);
                simVel.addScaledVector(this.windVector, 0.5 * simDt);
                simPos.addScaledVector(simVel, simDt);

                if (simPos.y <= 0) break;

                let hitData = this.checkCollisions(prev, simPos, window.guards);
                if (hitData && hitData.guard) {
                    let dist = position.distanceTo(simPos);
                    if (dist > 100 && hitData.isHeadshot) {
                        bullet.hasCam = true;
                        window.dispatchEvent(new CustomEvent('bulletCamStart', { detail: bullet }));
                    }
                    break;
                }
                simLife += simDt;
            }
        }
    }

    update(dt, player, targets = []) {
        if (!targets || !Array.isArray(targets)) targets = [];

        // Update dynamic wind fluctuations
        this.updateWindVector(performance.now() * 0.001);

        const airDensity = 1.225; // kg/m^3

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            let prevPos = b.position.clone();

            // Aerodynamic Drag Calculation: F_drag = 0.5 * rho * Cd * A * v^2
            let vMag = b.velocity.length();
            let area = Math.PI * Math.pow(b.caliber / 2, 2);
            let dragAccelMag = 0.5 * airDensity * b.dragCoefficient * area * (vMag * vMag) / b.mass;

            let dragVector = b.velocity.clone().normalize().multiplyScalar(-dragAccelMag);

            // Wind Force Vector relative to projectile velocity
            let relativeWind = this.windVector.clone().sub(b.velocity);
            let windAccel = relativeWind.normalize().multiplyScalar(0.5 * airDensity * b.dragCoefficient * area * (this.windVector.lengthSq()) / b.mass);

            // Update Velocity (Gravity + Drag + Wind)
            b.velocity.addScaledVector(b.gravity, dt);
            b.velocity.addScaledVector(dragVector, dt);
            b.velocity.addScaledVector(windAccel, dt);

            // Distance & Position update
            let stepDist = b.velocity.length() * dt;
            b.travelledDistance += stepDist;
            b.position.addScaledVector(b.velocity, dt);
            b.lifetime += dt;

            // Sync visual meshes
            b.mesh.position.copy(b.position);

            if (b.trailMesh) {
                b.trailMesh.position.copy(b.position);
                b.trailMesh.lookAt(b.position.clone().add(b.velocity));
                b.trailMesh.translateZ(-1.5);
            }
            if (b.trailLight) {
                b.trailLight.position.copy(b.position);
            }

            // Raycast Collision Detection
            let hitData = this.checkCollisions(prevPos, b.position, targets);
            if (hitData) {
                let targetPos = hitData.point;
                let drop = 1.8 - targetPos.y;
                let drift = targetPos.x - b.startPosition.x;

                let impactDist = b.travelledDistance;
                let currentSpeed = b.velocity.length();
                let speedRatio = Math.max(0.1, currentSpeed / b.muzzleVelocity);

                // Material Penetration Check
                let matType = hitData.object?.userData?.matType || 'stone';
                let requiredPenetration = 40; // Default stone

                if (matType === 'wood') requiredPenetration = 15;
                else if (matType === 'metal') requiredPenetration = 60;
                else if (matType === 'ground') requiredPenetration = 150; // Impenetrable

                // If projectile penetration capacity exceeds surface requirement & not ground
                if (b.penetrationPower > requiredPenetration && matType !== 'ground' && !hitData.guard) {
                    // Penetrate surface
                    b.penetrationPower -= requiredPenetration;
                    b.velocity.multiplyScalar(0.6); // 40% speed loss
                    b.baseDamage *= 0.7;             // 30% damage loss

                    this.createBulletHole(hitData);
                    this.playHitSound();

                    this.emitEvent('PENETRATION_EVENT', {
                        point: hitData.point.clone(),
                        normal: hitData.face ? hitData.face.normal.clone() : new THREE.Vector3(0,0,1),
                        material: matType,
                        remainingPenetration: b.penetrationPower
                    });
                    continue; // Keep bullet flying!
                }

                // Complete Impact Stop
                let zoneMult = hitData.isHeadshot ? 3.0 : 1.0;
                let finalDamage = Math.round(b.baseDamage * speedRatio * zoneMult);

                this.logBallistics(b.lifetime, drop, drift);
                this.showFeedback(hitData.isHeadshot ? `HEADSHOT! (${finalDamage} DMG)` : `TARGET HIT (${finalDamage} DMG)`);

                // Show Hit Marker
                let hm = document.getElementById('hit-marker');
                if (hm) {
                    hm.classList.remove('hidden');
                    setTimeout(() => hm.classList.add('hidden'), 300);
                }

                // If hit guard
                if (hitData.guard && hitData.guard.state !== 'DEAD') {
                    let isVIP = hitData.guard.isVIP;
                    hitData.guard.die();

                    let cameraMgr = window.gameEngine?.cameraManager;
                    if (cameraMgr && cameraMgr.bulletCamera) {
                        if (cameraMgr.bulletCamera.shouldTriggerKillCam(hitData, impactDist, isVIP)) {
                            cameraMgr.triggerKillCam(b, hitData.point);
                            cameraMgr.notifyImpact(hitData.point);
                        }
                    }

                    if (window.stats) {
                        window.stats.shotsHit++;
                        if (impactDist > window.stats.longestKill) {
                            window.stats.longestKill = impactDist;
                        }
                        if (!window.isGameOver && window.guards) {
                            let compoundAlerted = window.guards.some(g => g.state === 'ALERTED');
                            if (!compoundAlerted) window.stats.undetectedKills++;
                        }
                    }

                    this.emitEvent('TARGET_HIT', {
                        guard: hitData.guard,
                        isHeadshot: !!hitData.isHeadshot,
                        damage: finalDamage,
                        distance: impactDist
                    });
                } else if (!hitData.guard) {
                    this.createBulletHole(hitData);
                    this.emitEvent('SURFACE_HIT', {
                        point: hitData.point.clone(),
                        normal: hitData.face ? hitData.face.normal.clone() : new THREE.Vector3(0,0,1),
                        matType: matType
                    });
                }

                this.emitEvent('BULLET_IMPACT', {
                    point: hitData.point.clone(),
                    damage: finalDamage,
                    distance: impactDist
                });

                this.destroyBullet(i);
                continue;
            }

            // Destroy if out of lifetime or speed drops near zero
            if (b.lifetime > 5.0 || b.velocity.length() < 10.0 || b.position.y < -10) {
                this.destroyBullet(i);
            }
        }
    }

    checkCollisions(p1, p2, targets = []) {
        if (!targets || !Array.isArray(targets)) targets = [];

        const raycaster = new THREE.Raycaster();
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const dist = dir.length();
        dir.normalize();

        raycaster.set(p1, dir);
        raycaster.far = dist;

        for (let target of targets) {
            if (!target) continue;

            let intersectObj = target.body ? target.body : target;
            let intersects = raycaster.intersectObject(intersectObj);
            if (intersects.length > 0) {
                let hitData = intersects[0];
                hitData.guard = target.body ? target : null;
                return hitData;
            }

            if (window.Guard && target instanceof window.Guard) {
                let headIntersects = raycaster.intersectObject(target.head);
                if (headIntersects.length > 0) {
                    let hitData = headIntersects[0];
                    hitData.guard = target;
                    hitData.isHeadshot = true;
                    return hitData;
                }
            }
        }

        return null;
    }

    calculateRangeFromCamera(camera, maxDist = 1500) {
        const raycaster = new THREE.Raycaster();
        let dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        raycaster.set(camera.position, dir);
        raycaster.far = maxDist;

        let checkObjects = this.scene.children;
        let intersects = raycaster.intersectObjects(checkObjects, true);

        for (let hit of intersects) {
            // Ignore camera attached lights/meshes or player geometry
            if (hit.object === camera || hit.distance < 1.0) continue;
            return hit.distance;
        }
        return null;
    }

    createBulletHole(hitData) {
        let point = hitData.point;
        let normal = hitData.face ? hitData.face.normal : new THREE.Vector3(0, 0, 1);
        let matType = hitData.object.userData.matType || 'stone';

        let color = 0x000000;
        let size = 0.05;

        if (matType === 'wood') {
            color = 0x2e1a0b;
            size = 0.08;
        } else if (matType === 'metal') {
            color = 0x111111;
            size = 0.04;
        } else if (matType === 'ground') {
            color = 0x1a241a;
            size = 0.1;
        }

        const geo = new THREE.PlaneGeometry(size, size);
        const mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 1.0,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const hole = new THREE.Mesh(geo, mat);

        hole.position.copy(point);
        let target = point.clone().add(normal);
        hole.lookAt(target);

        hitData.object.add(hole);
        hitData.object.worldToLocal(hole.position);
    }

    playHitSound() {
        const audioCtx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        window.audioCtx = audioCtx;

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }

    logBallistics(flightTime, drop, drift) {
        let el = document.getElementById('ballistics-log');
        if (el) {
            el.innerHTML = `
                LAST SHOT<br>
                Time: ${flightTime.toFixed(2)}s<br>
                Impact Y (Drop): ${drop.toFixed(2)}m<br>
                Impact X (Drift): ${drift.toFixed(2)}m
            `;
        }
    }

    destroyBullet(index) {
        let b = this.bullets[index];
        if (!b) return;

        if (b.hasCam) {
            window.dispatchEvent(new CustomEvent('bulletCamEnd'));
        }
        if (b.mesh) {
            this.scene.remove(b.mesh);
            b.mesh.geometry.dispose();
            b.mesh.material.dispose();
        }
        if (b.trailMesh) {
            this.scene.remove(b.trailMesh);
            b.trailMesh.geometry.dispose();
            b.trailMesh.material.dispose();
        }
        if (b.trailLight) {
            this.scene.remove(b.trailLight);
        }

        this.bullets.splice(index, 1);
    }

    predictTrajectory(startPos, startDir, velocityMag, targets) {
        let pos = startPos.clone();
        let vel = startDir.clone().multiplyScalar(velocityMag);
        let dt = 1 / 60;

        for (let step = 0; step < 120; step++) {
            let prev = pos.clone();

            vel.addScaledVector(this.gravity, dt);
            vel.addScaledVector(this.windVector, 0.5 * dt);

            pos.addScaledVector(vel, dt);

            if (pos.y <= 0) return pos;

            let hitData = this.checkCollisions(prev, pos, targets);
            if (hitData) {
                return hitData.point;
            }
        }

        return pos;
    }

    showFeedback(msg) {
        let el = document.getElementById('feedback');
        if (el) {
            el.innerText = msg;
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('hidden'), 2000);
        }
    }
}

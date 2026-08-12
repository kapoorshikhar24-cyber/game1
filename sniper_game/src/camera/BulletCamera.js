export class BulletCamera {
    constructor(engine) {
        this.engine = engine;

        // Configurable Parameters
        this.config = {
            killCamDuration: 2.5,
            slowMotionScale: 0.15,
            cameraFOV: 35,
            bloomStrength: 1.2,
            filmGrainStrength: 0.4
        };

        this.isActive = false;
        this.activeBullet = null;
        this.targetPos = null;
        this.timer = 0;
        this.impactOccurred = false;
        this.impactPoint = null;

        this.originalCamPos = new THREE.Vector3();
        this.originalCamRot = new THREE.Euler();
        this.originalFOV = 75;

        this.overlayEl = null;
        this.createKillCamOverlay();
    }

    createKillCamOverlay() {
        if (document.getElementById('killcam-overlay')) return;

        let div = document.createElement('div');
        div.id = 'killcam-overlay';
        div.className = 'hidden';
        div.style.cssText = `
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none;
            z-index: 50;
            box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
            backdrop-filter: contrast(1.15) saturate(70%) sepia(20%) hue-rotate(170deg);
            transition: opacity 0.3s ease-out;
        `;

        let label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 40px; left: 50%;
            transform: translateX(-50%);
            color: #ef4444;
            font-family: 'Share Tech Mono', monospace;
            font-size: 1.4rem;
            letter-spacing: 4px;
            text-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
        `;
        label.innerText = "• SLOW MOTION KILL-CAM •";
        div.appendChild(label);

        document.getElementById('game-container').appendChild(div);
        this.overlayEl = div;
    }

    shouldTriggerKillCam(hitData, distance, isVIP) {
        // Only trigger for important shots: VIP kill, headshot, or long-range >= 80m
        if (isVIP) return true;
        if (hitData && hitData.isHeadshot) return true;
        if (distance >= 80) return true;
        return false;
    }

    trigger(bullet, targetPos, customConfig = {}) {
        if (this.isActive) return;

        Object.assign(this.config, customConfig);

        this.isActive = true;
        this.activeBullet = bullet;
        this.targetPos = targetPos ? targetPos.clone() : null;
        this.timer = this.config.killCamDuration;
        this.impactOccurred = false;
        this.impactPoint = null;

        let camera = this.engine.worldManager.camera;
        this.originalCamPos.copy(camera.position);
        this.originalCamRot.copy(camera.rotation);
        this.originalFOV = camera.fov;

        // Apply slow motion
        this.engine.timeManager.setTimeScale(this.config.slowMotionScale);

        // Apply cinematic FOV
        camera.fov = this.config.cameraFOV;
        camera.updateProjectionMatrix();

        // State & Overlay
        this.engine.stateManager.setState('BULLET_CAM');
        if (this.overlayEl) this.overlayEl.classList.remove('hidden');

        this.engine.eventBus.emit('BULLET_CAM_START', { bullet, targetPos });
    }

    notifyImpact(point) {
        if (!this.isActive) return;
        this.impactOccurred = true;
        this.impactPoint = point.clone();
    }

    update(dt) {
        if (!this.isActive) return;

        let camera = this.engine.worldManager.camera;
        this.timer -= dt;

        if (this.timer <= 0) {
            this.stop();
            return;
        }

        if (!this.impactOccurred && this.activeBullet && this.activeBullet.position) {
            // Track bullet flight
            let pos = this.activeBullet.position.clone();
            let vel = this.activeBullet.velocity.clone().normalize();

            // Offset camera behind and slightly above bullet
            let camPos = pos.clone().sub(vel.clone().multiplyScalar(3.5)).add(new THREE.Vector3(0, 0.8, 0));
            camera.position.lerp(camPos, Math.min(1.0, 15.0 * dt));

            if (this.targetPos) {
                camera.lookAt(this.targetPos);
            } else {
                camera.lookAt(pos.clone().add(vel.clone().multiplyScalar(5.0)));
            }
        } else if (this.impactPoint) {
            // Impact occurred - hold camera focused on impact site in slow-mo
            let camTarget = this.impactPoint.clone().add(new THREE.Vector3(1.5, 0.8, 2.0));
            camera.position.lerp(camTarget, Math.min(1.0, 5.0 * dt));
            camera.lookAt(this.impactPoint);
        }
    }

    stop() {
        if (!this.isActive) return;

        this.isActive = false;

        let camera = this.engine.worldManager.camera;
        camera.fov = this.originalFOV;
        camera.updateProjectionMatrix();

        // Restore normal time scale
        this.engine.timeManager.setTimeScale(1.0);

        if (this.overlayEl) this.overlayEl.classList.add('hidden');

        // Restore camera position to player
        let player = this.engine.worldManager.playerManager?.player;
        if (player && player.camera) {
            camera.position.copy(player.camera.position);
            camera.rotation.copy(player.camera.rotation);
        }

        this.engine.stateManager.setState('PLAYING');
        this.engine.eventBus.emit('BULLET_CAM_END');
    }
}

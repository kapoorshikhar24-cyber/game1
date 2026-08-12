export class TargetIdentification {
    constructor(engine) {
        this.engine = engine;
        this.overlayEl = null;
        this.scanProgress = 0;
        this.isScanning = false;
        this.isTargetConfirmed = false;
        this.targetGuard = null;

        this.createScannerOverlay();
        this.setupKeyListeners();
    }

    createScannerOverlay() {
        if (document.getElementById('target-intel-overlay')) return;

        let div = document.createElement('div');
        div.id = 'target-intel-overlay';
        div.className = 'hidden';
        div.style.cssText = `
            position: absolute;
            bottom: 22%; left: 50%;
            transform: translateX(-50%);
            background: rgba(8, 12, 10, 0.92);
            border: 1px solid #eab308;
            padding: 16px 24px;
            border-radius: 4px;
            color: #fff;
            font-family: 'Share Tech Mono', monospace;
            z-index: 45;
            min-width: 290px;
            box-shadow: 0 0 20px rgba(234, 179, 8, 0.5);
            pointer-events: none;
            text-align: center;
        `;
        div.innerHTML = `
            <div style="font-size: 0.75rem; color: #eab308; letter-spacing: 2px; margin-bottom: 4px;">TARGET PROFILE MATCH</div>
            <div id="intel-target-name" style="font-size: 1.2rem; color: #fff; font-weight: bold; letter-spacing: 1px;">CODENAME: KABIR</div>
            <div style="font-size: 0.8rem; color: #d1d5db; margin: 4px 0;">HEIGHT: ~1.8 m | CLOTHING: DARK FIELD JACKET</div>
            <div style="font-size: 0.78rem; color: #9ca3af;">BEHAVIOR: ACCOMPANIED BY GUARD ESCORT</div>
            <div id="intel-prompt" style="margin-top: 10px; color: #22c55e; font-size: 0.85rem; letter-spacing: 1px;">HOLD SCOPE ON TARGET TO CONFIRM</div>
        `;

        document.getElementById('game-container').appendChild(div);
        this.overlayEl = div;
    }

    setupKeyListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE' && this.isScanning && !this.isTargetConfirmed) {
                this.confirmTarget();
            }
        });
    }

    confirmTarget() {
        if (this.isTargetConfirmed) return;

        this.isTargetConfirmed = true;

        let promptEl = document.getElementById('intel-prompt');
        if (promptEl) {
            promptEl.innerText = "✓ TARGET CONFIRMED: KABIR";
            promptEl.style.color = "#22c55e";
        }

        if (this.overlayEl) {
            this.overlayEl.style.borderColor = "#22c55e";
            this.overlayEl.style.boxShadow = "0 0 25px rgba(34, 197, 94, 0.7)";
        }

        let radio = this.engine.missionManager.radioSystem;
        if (radio) {
            radio.speak("LT. MEERA NAIR", "Hold... That's him. Target Kabir confirmed.", 3.5, "#f472b6");
        }

        this.engine.eventBus.emit('TARGET_CONFIRMED', { target: this.targetGuard });
        this.engine.objectiveManager.completeObjectiveById('identify_target');

        setTimeout(() => {
            if (this.overlayEl) this.overlayEl.classList.add('hidden');
        }, 2200);
    }

    update(dt) {
        let player = this.engine.worldManager.playerManager?.player;
        let isScoped = this.engine.weaponManager?.weapon?.isScoped;

        if (!player || !isScoped) {
            if (this.overlayEl && !this.isTargetConfirmed) {
                this.overlayEl.classList.add('hidden');
            }
            this.isScanning = false;
            return;
        }

        let guards = this.engine.aiManager?.guards || window.guards || [];
        let vip = guards.find(g => g.isVIP && g.state !== 'DEAD');

        if (!vip) {
            if (this.overlayEl && !this.isTargetConfirmed) {
                this.overlayEl.classList.add('hidden');
            }
            return;
        }

        this.targetGuard = vip;
        let cam = this.engine.worldManager.camera;
        let dirToVip = new THREE.Vector3().subVectors(vip.position, cam.position).normalize();
        let camDir = new THREE.Vector3();
        cam.getWorldDirection(camDir);

        let angle = camDir.angleTo(dirToVip);
        let dist = cam.position.distanceTo(vip.position);

        if (angle < 0.09 && dist < 450) {
            this.isScanning = true;
            if (this.overlayEl && !this.isTargetConfirmed) {
                this.overlayEl.classList.remove('hidden');
            }

            this.scanProgress += dt;
            if (this.scanProgress >= 1.8 && !this.isTargetConfirmed) {
                this.confirmTarget();
            }
        } else {
            this.isScanning = false;
            this.scanProgress = 0;
            if (this.overlayEl && !this.isTargetConfirmed) {
                this.overlayEl.classList.add('hidden');
            }
        }
    }
}


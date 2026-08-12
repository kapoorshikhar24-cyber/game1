/**
 * StoryCinematic.js  (Enhanced)
 * Full GDD-specified Mission 1 opening cinematic:
 * Screen black → wind → radio click → vehicle POV → mountain vista → mission briefing.
 */

export class StoryCinematic {
    constructor(engine) {
        this.engine = engine;
        this.isPlaying = false;
        this.cinematicTimer = 0;
        this.duration = 12.0;
        this.phase = 'NONE'; // NONE, BLACKOUT, AERIAL, DONE

        this.startPos = new THREE.Vector3(0, 45, 140);
        this.targetLook = new THREE.Vector3(0, 5, -200);

        this.overlayEl = null;
        this.blackEl = null;
        this.createUI();
    }

    createUI() {
        // Black fade overlay
        if (!document.getElementById('cinematic-black')) {
            const black = document.createElement('div');
            black.id = 'cinematic-black';
            black.style.cssText = `
                position: absolute; inset: 0;
                background: #000;
                z-index: 80;
                opacity: 1;
                pointer-events: none;
                transition: opacity 1.2s ease;
            `;
            (document.getElementById('game-container') || document.body).appendChild(black);
            this.blackEl = black;
        } else {
            this.blackEl = document.getElementById('cinematic-black');
        }

        // Briefing banner
        if (document.getElementById('cinematic-banner')) {
            this.overlayEl = document.getElementById('cinematic-banner');
            return;
        }

        const div = document.createElement('div');
        div.id = 'cinematic-banner';
        div.className = 'hidden';
        div.style.cssText = `
            position: absolute;
            top: 18%; left: 50%;
            transform: translateX(-50%);
            background: rgba(4, 8, 6, 0.94);
            border: 1px solid #d97706;
            border-top: 3px solid #d97706;
            padding: 28px 48px;
            border-radius: 6px;
            color: #fff;
            text-align: center;
            font-family: 'Share Tech Mono', monospace;
            z-index: 60;
            box-shadow: 0 0 40px rgba(0,0,0,0.95), 0 0 80px rgba(0,0,0,0.5);
            pointer-events: none;
            transition: opacity 0.5s ease-out;
            min-width: 520px;
        `;
        div.innerHTML = `
            <div style="color: #d97706; font-size: 0.7rem; letter-spacing: 5px; margin-bottom: 6px;">CAMPAIGN — MISSION 01</div>
            <h2 style="font-size: 2rem; margin: 0 0 6px 0; color: #fff; letter-spacing: 3px;">OPERATION: TRISHUL SHADOW</h2>
            <div style="font-size: 0.9rem; color: #e5e7eb; font-weight: bold; margin-bottom: 6px;">CHAPTER 1 — THE FIRST SIGNAL</div>
            <div style="width: 60%; height: 1px; background: rgba(217,119,6,0.3); margin: 10px auto;"></div>
            <div style="font-size: 0.82rem; color: #9ca3af; max-width: 480px; line-height: 1.6; margin: 0 auto;">
                <span style="color:#6b7280;">LOCATION:</span> HIMALAYAN BORDER SECTOR, NORTHERN INDIA<br>
                Observe remote mountain valley. Identify hostile commander
                <b style="color:#fff;">KABIR</b>. Determine missing informant <b style="color:#eab308;">TARA</b>'s status.
            </div>
            <div style="margin-top: 16px; color: #22c55e; font-size: 0.78rem; letter-spacing: 2px;">[ PRESS SPACE TO BEGIN ]</div>
        `;

        (document.getElementById('game-container') || document.body).appendChild(div);
        this.overlayEl = div;
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.cinematicTimer = this.duration;
        this.phase = 'BLACKOUT';

        // Disable player controls
        const player = this.engine.worldManager?.playerManager?.player;
        if (player) player.controlsEnabled = false;

        // Set aerial camera start
        const camera = this.engine.worldManager?.camera;
        if (camera) {
            camera.position.copy(this.startPos);
            camera.lookAt(this.targetLook);
        }

        // Black fade out → fade in sequence
        if (this.blackEl) {
            this.blackEl.style.opacity = '1';
        }

        // Start with radio opening lines
        const radio = this.engine.missionManager?.radioSystem;
        if (radio) {
            setTimeout(() => {
                if (this.isPlaying) radio.speak('MAJOR VIKRAM SINGH', "Rathore. Wake up.", 3.0, '#f59e0b');
            }, 800);
            setTimeout(() => {
                if (this.isPlaying) radio.speak('CAPTAIN ARJUN RATHORE', "I'm awake, sir.", 2.0, '#60a5fa');
            }, 4200);
            setTimeout(() => {
                if (this.isPlaying) radio.speak('MAJOR VIKRAM SINGH', "Good. Because we're already late.", 2.5, '#f59e0b');
            }, 6500);
        }

        // Fade black out and show world
        setTimeout(() => {
            if (this.blackEl) this.blackEl.style.opacity = '0';
            this.phase = 'AERIAL';
        }, 1200);

        // Show mission briefing banner
        setTimeout(() => {
            if (this.isPlaying && this.overlayEl) this.overlayEl.classList.remove('hidden');
        }, 1500);

        // Continue dialogue after banner appears
        setTimeout(() => {
            if (!this.isPlaying) return;
            if (radio) {
                radio.speak('MAJOR VIKRAM SINGH', "A relay station went offline three nights ago.", 3.5, '#f59e0b');
            }
        }, 9500);
        setTimeout(() => {
            if (!this.isPlaying) return;
            if (radio) {
                radio.speak('HAVILDAR IMRAN KHAN', "Yesterday, a patrol disappeared.", 2.5, '#34d399');
            }
        }, 13500);
        setTimeout(() => {
            if (!this.isPlaying) return;
            if (radio) {
                radio.speak('MAJOR VIKRAM SINGH', "No engagement unless the situation changes. Your job is to see what they don't want us to see.", 4.5, '#f59e0b');
            }
        }, 16500);

        this.engine.eventBus.emit('CINEMATIC_START');
    }

    skip() {
        if (!this.isPlaying) return;
        this.cinematicTimer = 0;
        this.finish();
    }

    finish() {
        this.isPlaying = false;
        this.phase = 'DONE';

        if (this.overlayEl) this.overlayEl.classList.add('hidden');
        if (this.blackEl) {
            this.blackEl.style.opacity = '0';
        }

        const player = this.engine.worldManager?.playerManager?.player;
        if (player) {
            player.controlsEnabled = true;
            
            // Set Player Physical Spawn Point (Insertion Zone)
            player.position.set(0, 1.8, 140);
            player.velocity.set(0, 0, 0);

            // Reset camera to player head
            const camera = this.engine.worldManager?.camera;
            if (camera) {
                camera.position.copy(player.position);
                camera.rotation.set(0, 0, 0); // Face North (-Z)
            }
        }

        // First objective banner
        const banner = document.getElementById('masking-alert');
        if (banner) {
            banner.innerHTML = '✓ OBJECTIVE UPDATED: REACH OBSERVATION POINT [486m]';
            banner.style.borderColor = '#22c55e';
            banner.style.color = '#22c55e';
            banner.classList.remove('hidden');
            setTimeout(() => banner.classList.add('hidden'), 4500);
        }

        // Imran intro line
        const radio = this.engine.missionManager?.radioSystem;
        if (radio) {
            setTimeout(() => {
                radio.speak('HAVILDAR IMRAN KHAN', "Arjun, patrol vehicle was abandoned up ahead. Inspect it if you get a chance.", 5.0, '#34d399');
            }, 800);
        }

        this.engine.eventBus.emit('CINEMATIC_END');
    }

    update(dt) {
        if (!this.isPlaying) return;

        if (this.engine.inputManager?.isKeyDown('Space')) {
            this.skip();
            return;
        }

        this.cinematicTimer -= dt;
        if (this.cinematicTimer <= 0) {
            this.finish();
            return;
        }

        if (this.phase !== 'AERIAL') return;

        const pct = 1.0 - (this.cinematicTimer / this.duration);
        const camera = this.engine.worldManager?.camera;
        if (!camera) return;

        // Smooth aerial pan
        camera.position.x = Math.sin(pct * Math.PI * 0.4) * 40;
        camera.position.y = 45 - pct * 28;
        camera.position.z = 140 - pct * 110;
        camera.lookAt(this.targetLook);
    }
}

export class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.objectiveTickerTimer = null;
        
        // Cache DOM elements
        this.elements = {
            mainMenu: document.getElementById('main-menu'),
            pauseMenu: document.getElementById('pause-menu'),
            hud: document.getElementById('main-hud'),
            scopeOverlay: document.getElementById('scope-overlay'),
            crosshair: document.getElementById('crosshair-dot'),
            hitMarker: document.getElementById('hit-marker'),
            windSpeed: document.getElementById('wind-speed'),
            windDir: document.getElementById('wind-dir'),
            windArrow: document.getElementById('wind-arrow'),
            ammoCurrent: document.getElementById('ammo-current'),
            ammoTotal: document.getElementById('ammo-total'),
            weaponName: document.getElementById('weapon-name'),
            healthFill: document.getElementById('health-fill'),
            compassStrip: document.getElementById('compass-strip'),
            alertIcon: document.getElementById('compound-alert'),
            damageVignette: document.getElementById('damage-vignette'),
            alertLevelText: document.getElementById('alert-level-text'),
            
            // New Groups
            objectiveGroup: document.getElementById('hud-objective-group'),
            compassGroup: document.getElementById('hud-compass-group'),
            alertGroup: document.getElementById('hud-alert-group'),
            bottomLeftGroup: document.getElementById('hud-bottom-left-group'),
            bottomRightGroup: document.getElementById('hud-bottom-right-group'),
        };

        // 3D Visor Dynamic Inertial Sway
        this.currentSwayX = 0;
        this.currentSwayY = 0;
        this.targetSwayX = 0;
        this.targetSwayY = 0;

        this.setupEventListeners();
        this.setup3DSway();
    }

    setup3DSway() {
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement) {
                this.targetSwayX = Math.max(-15, Math.min(15, this.targetSwayX + e.movementX * 0.03));
                this.targetSwayY = Math.max(-10, Math.min(10, this.targetSwayY + e.movementY * 0.03));
            }
        });
    }

    setupEventListeners() {
        this.engine.eventBus.on('STATE_CHANGED', (e) => this.handleStateChange(e.current));
        this.engine.eventBus.on('WIND_UPDATED', (e) => this.updateWind(e));
        this.engine.eventBus.on('WEAPON_CHANGED', (e) => this.updateWeapon(e));
        this.engine.eventBus.on('AMMO_UPDATED', (e) => this.updateAmmo(e));
        this.engine.eventBus.on('PLAYER_HEALTH_CHANGED', (e) => this.updateHealth(e));
        this.engine.eventBus.on('PLAYER_ROTATED', (e) => this.updateCompass(e));
        this.engine.eventBus.on('OBJECTIVE_COMPLETED', () => this.flashObjectiveTicker());
        this.engine.eventBus.on('MISSION_LOADED', () => this.flashObjectiveTicker());
        this.engine.eventBus.on('COMPOUND_ALERT_LEVEL_CHANGED', (e) => this.updateAlertIcon(e));
        this.engine.eventBus.on('TARGET_HIT', () => this.showHitMarker());
        
        // Start (Mission 1 direct with intro video cutscene)
        const deployBtn = document.getElementById('btn-start');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => {
                this.engine.playCutscene('/assets/mission01_intro.mp4', () => {
                    this.engine.stateManager.setState('PLAYING');
                    const player = this.engine.playerManager?.player;
                    if (player?.controls) {
                        try { player.controls.lock(); } catch (err) {}
                    }
                });
            });
        }

        // Campaign button (shows campaign screen)
        const campaignBtn = document.getElementById('btn-campaign');
        if (campaignBtn) {
            campaignBtn.addEventListener('click', () => {
                const mainMenu = document.getElementById('main-menu');
                if (mainMenu) mainMenu.classList.add('hidden');
                this.engine.campaignScreen?.open(this.engine.campaignManager?.missions);
            });
        }

        // Pause menu resume button
        const resumeBtn = document.getElementById('btn-resume');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.engine.stateManager.setState('PLAYING');
                const player = this.engine.playerManager?.player;
                if (player?.controls) {
                    try { player.controls.lock(); } catch (e) {}
                }
            });
        }

        document.addEventListener('pointerlockchange', () => {
            const locked = document.pointerLockElement === document.body ||
                           document.pointerLockElement === this.engine.worldManager?.renderer?.domElement;
            if (locked) {
                if (!this.engine.stateManager.is('SCOPE')) {
                    this.engine.stateManager.setState('PLAYING');
                }
            } else {
                if (this.engine.stateManager.is('PLAYING') || this.engine.stateManager.is('SCOPE')) {
                    // Only pause if tablet is not open
                    if (!this.engine.tacticalTablet?.isOpen) {
                        this.engine.stateManager.setState('PAUSED');
                    }
                }
            }
        });
    }

    handleStateChange(state) {
        if (!this.elements.mainMenu) return;
        
        const showMenu = (el) => { if (el) el.classList.remove('hidden'); };
        const hideMenu = (el) => { if (el) el.classList.add('hidden'); };

        switch (state) {
            case 'MAIN_MENU':
                showMenu(this.elements.mainMenu);
                hideMenu(this.elements.pauseMenu);
                hideMenu(this.elements.hud);
                hideMenu(this.elements.crosshair);
                hideMenu(this.elements.scopeOverlay);
                break;
            case 'PAUSED':
                hideMenu(this.elements.mainMenu);
                showMenu(this.elements.pauseMenu);
                hideMenu(this.elements.scopeOverlay);
                hideMenu(this.elements.crosshair);
                break;
            case 'PLAYING':
                hideMenu(this.elements.mainMenu);
                hideMenu(this.elements.pauseMenu);
                showMenu(this.elements.hud);
                showMenu(this.elements.crosshair);
                hideMenu(this.elements.scopeOverlay);
                break;
            case 'SCOPE':
                hideMenu(this.elements.pauseMenu);
                hideMenu(this.elements.crosshair);
                showMenu(this.elements.scopeOverlay);
                break;
            case 'BULLET_CAM':
                hideMenu(this.elements.hud);
                hideMenu(this.elements.crosshair);
                hideMenu(this.elements.scopeOverlay);
                document.body.classList.add('kill-cam-active');
                break;
        }
        
        if (state !== 'BULLET_CAM') {
            document.body.classList.remove('kill-cam-active');
        }
    }

    updateWind({ speed, direction }) {
        if (this.elements.windSpeed) this.elements.windSpeed.innerText = speed.toFixed(1);
        if (this.elements.windArrow) {
            this.elements.windArrow.style.display = 'inline-block';
            this.elements.windArrow.style.transform = `rotate(${direction}deg)`;
        }
        if (this.elements.windDir) {
            this.elements.windDir.style.transform = `translate(-50%, -50%) rotate(${direction}deg)`;
        }
    }

    updateWeapon(weapon) {
        if (!weapon) return;
        const rawName = typeof weapon === 'string' ? weapon : weapon.name || 'INSAS SNIPER';
        if (this.elements.weaponName) {
            const cleanName = rawName.replace(/\s*\([^)]*\)/gi, '').toUpperCase();
            this.elements.weaponName.innerText = cleanName;
        }
        const badgeEl = document.querySelector('.suppressor-badge');
        if (badgeEl) {
            const isSuppressed = typeof weapon === 'object' ? weapon.suppressed : true;
            badgeEl.innerText = isSuppressed ? '(SUPPRESSED)' : '';
            badgeEl.style.display = isSuppressed ? 'inline-block' : 'none';
        }
    }

    updateAmmo({ current, total }) {
        if (this.elements.ammoCurrent) {
            this.elements.ammoCurrent.innerText = String(current).padStart(2, '0');
        }
        if (this.elements.ammoTotal) {
            this.elements.ammoTotal.innerText = String(total).padStart(2, '0');
        }
    }

    updateHealth(percent) {
        if (this.elements.healthFill) this.elements.healthFill.style.width = `${percent}%`;
    }

    updateCompass(rotationY) {
        if (!this.elements.compassStrip) return;
        let deg = Math.round(THREE.MathUtils.radToDeg(rotationY)) % 360;
        if (deg < 0) deg += 360;
        let offset = (deg / 360) * 100;
        this.elements.compassStrip.style.transform = `translateX(${-offset}%)`;

        // Telemetry heading degree
        const headingEl = document.getElementById('telemetry-heading');
        if (headingEl) {
            const formattedDeg = String(deg).padStart(3, '0');
            headingEl.innerText = `${formattedDeg}°`;
        }
    }

    updateAlertIcon(level) {
        if (!this.elements.alertIcon) return;
        this.elements.alertIcon.className = `alert-icon ${level}`;

        // Update the text-based alert level indicator
        const alertTexts = {
            calm:       'LOW',
            suspicious: 'SUSPICIOUS',
            detected:   'AREA ALERT',
            alerted:    'LOCKDOWN',
        };
        const alertColors = {
            calm:       '#e6edf3',
            suspicious: '#eab308',
            detected:   '#f97316',
            alerted:    '#ef4444',
        };

        const textEl = document.getElementById('alert-level-text');
        if (textEl) {
            textEl.innerText = alertTexts[level] || 'LOW';
            textEl.style.color = alertColors[level] || '#e6edf3';
        }
    }

    showHitMarker() {
        if (!this.elements.hitMarker) return;
        this.elements.hitMarker.classList.remove('hidden');
        setTimeout(() => this.elements.hitMarker.classList.add('hidden'), 300);
        this.playTacticalBeep(1200, 0.04);
    }
    
    toggleTacticalHUD() {
        if (this.elements.hud) {
            this.elements.hud.classList.toggle('hidden');
            this.playTacticalBeep(800, 0.05);
        }
    }

    playTacticalBeep(freq = 880, duration = 0.05) {
        try {
            const ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (!window.audioCtx) window.audioCtx = ctx;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    flashObjectiveTicker() {
        if (this.elements.objectiveGroup) {
            this.elements.objectiveGroup.classList.remove('hud-fade-out');
        }
        if (this.objectiveTickerTimer) {
            clearTimeout(this.objectiveTickerTimer);
        }
        this.objectiveTickerTimer = setTimeout(() => {
            if (this.elements.objectiveGroup) {
                this.elements.objectiveGroup.classList.add('hud-fade-out');
            }
        }, 8000);
    }

    // Called from GameEngine.update() to keep fatigue/stamina bar and optic telemetry live
    update() {
        const player = this.engine.playerManager?.player;
        if (!player) return;

        // 3D Helmet Visor Inertial Sway Animation
        this.currentSwayX += (this.targetSwayX - this.currentSwayX) * 0.12;
        this.currentSwayY += (this.targetSwayY - this.currentSwayY) * 0.12;
        this.targetSwayX *= 0.92;
        this.targetSwayY *= 0.92;

        if (this.elements.hud) {
            this.elements.hud.style.transform = `rotateY(${this.currentSwayX.toFixed(2)}deg) rotateX(${(-this.currentSwayY).toFixed(2)}deg)`;
        }

        // Stamina bar
        const staminaFill = document.getElementById('stamina-fill');
        if (staminaFill) {
            const pct = (player.stamina / player.maxStamina) * 100;
            staminaFill.style.width = pct + '%';
            if (pct < 20) {
                staminaFill.style.background = 'linear-gradient(to right, #7f1d1d, #ef4444)';
            } else if (pct < 50) {
                staminaFill.style.background = 'linear-gradient(to right, #92400e, #f59e0b)';
            } else {
                staminaFill.style.background = 'linear-gradient(to right, #1d4ed8, #60a5fa)';
            }
        }

        // Injury status
        const injuryEl = document.getElementById('injury-status');
        if (injuryEl) {
            injuryEl.style.display = player.isLimping ? 'block' : 'none';
        }

        // Dynamic Pitch Elevation angle calculation for Scope HUD
        const camera = this.engine.worldManager?.camera;
        if (camera) {
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            const pitchDeg = (Math.asin(dir.y) * (180 / Math.PI)).toFixed(1);
            const elevEl = document.getElementById('telemetry-elev');
            if (elevEl) elevEl.innerText = (pitchDeg >= 0 ? '+' : '') + pitchDeg + '°';

            // Dynamic Latitude calculation based on player position (Z coord)
            const latEl = document.getElementById('telemetry-lat');
            if (latEl && player.position) {
                const baseLat = 34.2388;
                const offset = (player.position.z * 0.00001);
                const currentLat = (baseLat + offset).toFixed(4);
                latEl.innerText = `34°${Math.floor((currentLat % 1) * 60)}'N`;
            }
        }

        // Contextual Fading Logic
        let speed = 0;
        if (player.velocity) {
            speed = Math.sqrt(player.velocity.x * player.velocity.x + player.velocity.z * player.velocity.z);
        }

        const isMoving = speed > 0.2;
        const isDamaged = player.health < player.maxHealth;
        const isSprinting = player.stamina < 98;
        const isFiring = this.engine.weaponManager?.weapon?.state === 'FIRING' || this.engine.weaponManager?.weapon?.state === 'BOLT_ACTION' || this.engine.weaponManager?.weapon?.state === 'RELOADING';
        const isScoped = this.engine.stateManager.is('SCOPE');

        // Compass: show when unscoped
        const showCompass = !isScoped;
        if (this.elements.compassGroup) {
            this.elements.compassGroup.classList.toggle('hud-fade-out', !showCompass);
        }

        // Left Panel (Health, Stamina, Minimap): show when unscoped
        const showLeft = !isScoped;
        if (this.elements.bottomLeftGroup) {
            this.elements.bottomLeftGroup.classList.toggle('hud-fade-out', !showLeft);
        }

        // Right Panel (Weapon status): show when unscoped
        const showRight = !isScoped;
        if (this.elements.bottomRightGroup) {
            this.elements.bottomRightGroup.classList.toggle('hud-fade-out', !showRight);
        }

        // Alert group: show when unscoped
        const showAlert = !isScoped;
        if (this.elements.alertGroup) {
            this.elements.alertGroup.classList.toggle('hud-fade-out', !showAlert);
        }
    }
}


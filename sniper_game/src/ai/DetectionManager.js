export class DetectionManager {
    constructor(engine) {
        this.engine = engine;
        this.detectionLevel = 0; // 0 to 100
        this.state = 'SAFE';     // SAFE, SUSPICIOUS, DETECTED, ALERT

        this.elements = {
            container: document.getElementById('detection-container'),
            fill: document.getElementById('detection-fill'),
            text: document.getElementById('detection-text'),
            statusText: document.getElementById('detection-status-text')
        };

        this.cachedLevel = -1;
        this.cachedState = '';
    }

    update(dt) {
        let player = this.engine.worldManager.playerManager?.player;
        let guards = this.engine.aiManager?.guards || window.guards || [];

        if (!player || !guards || guards.length === 0) return;

        let maxGuardSuspicion = 0;
        let compoundAlerted = false;

        for (let guard of guards) {
            if (!guard || guard.state === 'DEAD') continue;

            maxGuardSuspicion = Math.max(maxGuardSuspicion, guard.suspicion || 0);

            if (guard.state === 'ALERT' || guard.state === 'COMBAT') {
                compoundAlerted = true;
                maxGuardSuspicion = 100;
            }
        }

        let targetLevel = maxGuardSuspicion;

        if (targetLevel > this.detectionLevel) {
            this.detectionLevel += (targetLevel - this.detectionLevel) * Math.min(1.0, 5.0 * dt);
        } else {
            this.detectionLevel -= 15.0 * dt;
            if (this.detectionLevel < 0) this.detectionLevel = 0;
        }

        this.detectionLevel = Math.max(0, Math.min(100, this.detectionLevel));

        // State Machine
        let newState = 'SAFE';
        if (this.detectionLevel >= 100 || compoundAlerted) {
            newState = 'ALERT';
            if (!compoundAlerted) {
                let playerPos = player.camera.position.clone();
                for (let g of guards) {
                    if (g && g.state !== 'DEAD' && g.state !== 'COMBAT') {
                        g.triggerAlert(playerPos);
                    }
                }
            }
        } else if (this.detectionLevel >= 50) {
            newState = 'DETECTED';
        } else if (this.detectionLevel > 0) {
            newState = 'SUSPICIOUS';
        }

        this.state = newState;
        this.updateHUD();

        // Emit compound alert level for UIManager alert icon
        const cssClass = {
            'SAFE': 'calm', 'SUSPICIOUS': 'suspicious', 'DETECTED': 'detected', 'ALERT': 'alerted'
        }[newState] || 'calm';
        if (cssClass !== this._lastAlertClass) {
            this._lastAlertClass = cssClass;
            if (window.gameEngine) {
                window.gameEngine.eventBus.emit('COMPOUND_ALERT_LEVEL_CHANGED', cssClass);
            }
        }
    }

    updateHUD() {
        let levelInt = Math.round(this.detectionLevel);

        if (this.cachedLevel === levelInt && this.cachedState === this.state) return;
        this.cachedLevel = levelInt;
        this.cachedState = this.state;

        if (!this.elements.fill) {
            this.elements.container = document.getElementById('detection-container');
            this.elements.fill = document.getElementById('detection-fill');
            this.elements.text = document.getElementById('detection-text');
            this.elements.statusText = document.getElementById('detection-status-text');
        }

        if (this.elements.fill) {
            this.elements.fill.style.width = `${levelInt}%`;
        }

        if (this.elements.container) {
            this.elements.container.className = `detection-container ${this.state.toLowerCase()}`;
        }

        if (this.elements.statusText) {
            this.elements.statusText.innerText = this.state;
        }

        if (this.elements.text) {
            let filledBlocks = Math.floor(levelInt / 10);
            let emptyBlocks = 10 - filledBlocks;
            let bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
            this.elements.text.innerText = `${bar} ${levelInt}%`;
        }
    }
}

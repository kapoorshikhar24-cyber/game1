export class BallisticsManager {
    constructor(engine) {
        this.engine = engine;
        this.ballistics = null;
    }

    init(scene) {
        this.ballistics = new window.Ballistics(scene, this.engine.eventBus);
        this.engine.eventBus.emit('WIND_UPDATED', {
            speed: this.ballistics.windVector.length(),
            direction: this.ballistics.windDirection
        });
    }

    update(dt) {
        if (this.ballistics) {
            let player = this.engine.playerManager?.player;
            let guards = window.guards || [];
            let levelTargets = this.engine.worldManager?.level?.targets || [];
            let allTargets = guards.concat(levelTargets);
            this.ballistics.update(dt, player, allTargets);

            // Real-time Scope Rangefinder calculation
            if (player && player.camera) {
                let range = this.ballistics.calculateRangeFromCamera(player.camera);
                let rangeEl = document.getElementById('target-range');
                if (rangeEl) {
                    rangeEl.innerText = range ? Math.round(range) : '---';
                }
            }
        }
    }
}

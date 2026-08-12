export class PlayerManager {
    constructor(engine) {
        this.engine = engine;
        this.player = null;
    }

    init(camera, domElement) {
        this.player = new window.Player(camera, domElement);
    }

    update(dt) {
        if (!this.player) return;
        
        let state = this.engine.stateManager.getCurrentState();
        if (state === 'PLAYING' || state === 'SCOPE') {
            let levelTargets = this.engine.worldManager?.level?.targets || [];
            this.player.update(dt, levelTargets);
        }
    }
}

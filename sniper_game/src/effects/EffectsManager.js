import { SnowSystem } from './SnowSystem.js';

export class EffectsManager {
    constructor(engine) {
        this.engine = engine;
        this.snowSystem = null;
    }

    init(scene, camera) {
        this.snowSystem = new SnowSystem(scene, camera);
    }

    update(dt) {
        if (this.snowSystem) {
            this.snowSystem.update(dt);
        }
    }
}

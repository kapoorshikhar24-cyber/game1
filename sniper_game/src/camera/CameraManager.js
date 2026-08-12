import { BulletCamera } from './BulletCamera.js';

export class CameraManager {
    constructor(engine) {
        this.engine = engine;
        this.bulletCamera = new BulletCamera(engine);
    }

    triggerKillCam(bullet, targetPos, customConfig) {
        this.bulletCamera.trigger(bullet, targetPos, customConfig);
    }

    notifyImpact(point) {
        this.bulletCamera.notifyImpact(point);
    }

    update(dt) {
        this.bulletCamera.update(dt);
    }
}

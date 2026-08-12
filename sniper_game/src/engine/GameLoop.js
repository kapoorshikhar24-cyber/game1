export class GameLoop {
    constructor(engine) {
        this.engine = engine;
        this.isRunning = false;
        this.frameId = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.loop(performance.now());
    }

    stop() {
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
        }
    }

    loop(currentTime) {
        if (!this.isRunning) return;
        
        this.frameId = requestAnimationFrame((time) => this.loop(time));
        
        let dt = this.engine.timeManager.update(currentTime);
        
        if (dt > 0) {
            this.engine.update(dt);
        }
        
        this.engine.render();
    }
}

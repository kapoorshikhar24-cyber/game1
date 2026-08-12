export class PerformanceManager {
    constructor(engine) {
        this.engine = engine;
        this.frameCount = 0;
        this.fps = 0;
        this.lastTime = performance.now();
        
        // Pools
        this.bulletPool = [];
        this.decalPool = [];
    }

    update(currentTime) {
        this.frameCount++;
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Optionally emit or display FPS in debug mode
            // this.engine.eventBus.emit('FPS_UPDATED', this.fps);
        }
    }
}

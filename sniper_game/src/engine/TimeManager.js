export class TimeManager {
    constructor() {
        this.timeScale = 1.0;
        this.lastTime = performance.now();
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.isPaused = false;
    }

    update(currentTime) {
        let dt = (currentTime - this.lastTime) / 1000.0;
        
        // Cap dt to prevent massive jumps if tab is inactive
        if (dt > 0.1) dt = 0.1;
        
        this.lastTime = currentTime;
        
        if (this.isPaused) {
            this.deltaTime = 0;
            return 0;
        }

        this.deltaTime = dt * this.timeScale;
        this.elapsedTime += this.deltaTime;
        
        return this.deltaTime;
    }

    setTimeScale(scale) {
        this.timeScale = scale;
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    }
}

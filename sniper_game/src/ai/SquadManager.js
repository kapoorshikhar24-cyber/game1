export class SquadManager {
    constructor(engine) {
        this.engine = engine;
        
        // Listen to alert propagation events
        this.engine.eventBus.on('GUARD_ALERTED', (guard) => this.propagateAlert(guard));
    }

    propagateAlert(sourceGuard) {
        let guards = this.engine.aiManager?.guards;
        if (!guards) return;
        
        let compoundAlerted = false;
        
        for (let other of guards) {
            if (other === sourceGuard || other.state === 'DEAD') continue;
            
            // If within 50m, they hear the shout/radio
            if (other.position.distanceTo(sourceGuard.position) < 50) {
                if (other.state !== 'ALERTED') {
                    other.investigateTarget = sourceGuard.investigateTarget || sourceGuard.position.clone();
                    other.state = 'INVESTIGATING';
                    other.suspicion = 100; // Trigger alert next frame
                }
            }
            if (other.state === 'ALERTED') compoundAlerted = true;
        }
        
        // Notify UI
        this.engine.eventBus.emit('COMPOUND_ALERT_LEVEL_CHANGED', compoundAlerted ? 'alerted' : 'investigating');
    }
}

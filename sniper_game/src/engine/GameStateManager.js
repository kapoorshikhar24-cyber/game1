export class GameStateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        
        this.STATES = {
            MENU: 'MENU',
            MAIN_MENU: 'MAIN_MENU',
            MISSION_SELECT: 'MISSION_SELECT',
            MISSION_BRIEFING: 'MISSION_BRIEFING',
            LOADING: 'LOADING',
            PLAYING: 'PLAYING',
            PAUSED: 'PAUSED',
            SCOPE: 'SCOPE',
            BULLET_CAM: 'BULLET_CAM',
            MISSION_COMPLETE: 'MISSION_COMPLETE',
            MISSION_FAILED: 'MISSION_FAILED',
            RESULTS: 'RESULTS'
        };
        
        this.currentState = this.STATES.MAIN_MENU;
        this.previousState = null;
    }

    setState(newState, data = null) {
        if (this.currentState === newState) return;
        if (!Object.values(this.STATES).includes(newState)) {
            console.error(`Invalid state: ${newState}`);
            return;
        }

        this.previousState = this.currentState;
        this.currentState = newState;
        
        this.eventBus.emit('STATE_CHANGED', {
            previous: this.previousState,
            current: this.currentState,
            data: data
        });
    }

    getCurrentState() {
        return this.currentState;
    }

    is(state) {
        return this.currentState === state;
    }
}

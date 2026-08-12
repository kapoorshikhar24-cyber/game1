export class InputManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.keys = {};
        this.mouse = { x: 0, y: 0, leftDown: false, rightDown: false };
        
        this.initListeners();
    }

    initListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.eventBus.emit('KEY_DOWN', e.code);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.eventBus.emit('KEY_UP', e.code);
        });

        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.leftDown = true;
            if (e.button === 2) this.mouse.rightDown = true;
            this.eventBus.emit('MOUSE_DOWN', e.button);
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.leftDown = false;
            if (e.button === 2) this.mouse.rightDown = false;
            this.eventBus.emit('MOUSE_UP', e.button);
        });
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    isKeyDown(code) {
        return !!this.keys[code];
    }
}

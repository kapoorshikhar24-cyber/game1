export class WeaponManager {
    constructor(engine) {
        this.engine = engine;
        this.weapon = null;
        
        this.engine.eventBus.on('MOUSE_DOWN', (button) => this.handleMouse(button));
        this.engine.eventBus.on('KEY_DOWN', (key) => this.handleKeyDown(key));
        this.engine.eventBus.on('KEY_UP', (key) => this.handleKeyUp(key));
    }

    init(camera, ballisticsSystem) {
        this.weapon = new window.Weapon(camera, ballisticsSystem);
    }

    handleMouse(button) {
        if (!this.engine.stateManager.is('PLAYING') && !this.engine.stateManager.is('SCOPE')) return;
        if (!this.weapon) return;
        
        if (button === 2) {
            this.toggleScope();
        } else if (button === 0) {
            this.weapon.fire();
        }
    }

    toggleScope() {
        if (!this.weapon) return;
        this.weapon.toggleScope();
        this.engine.stateManager.setState(this.weapon.isScoped ? 'SCOPE' : 'PLAYING');
    }

    handleKeyDown(key) {
        if (!this.weapon) return;
        
        if (key === 'ShiftLeft') {
            this.weapon.holdBreath(true);
        } else if (key === 'KeyF') {
            if (this.engine.stateManager.is('PLAYING') || this.engine.stateManager.is('SCOPE')) {
                this.toggleScope();
            }
        } else if (key === 'KeyQ') {
            this.weapon.switchWeapon();
            this.engine.eventBus.emit('WEAPON_CHANGED', this.weapon.weapons[this.weapon.currentWeaponIdx]);
        } else if (key === 'KeyR') {
            this.weapon.reload();
            this.engine.eventBus.emit('WEAPON_RELOAD', this.weapon.weapons[this.weapon.currentWeaponIdx]);
        } else if (key === 'KeyE') {
            this.engine.eventBus.emit('INTERACT', { player: this.engine.playerManager?.player });
        }
    }

    handleKeyUp(key) {
        if (!this.weapon) return;
        if (key === 'ShiftLeft') this.weapon.holdBreath(false);
    }

    update(dt) {
        if (this.weapon) {
            this.weapon.update(dt);
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.inputHandler = new InputHandler(this.canvas, this);
        
        this.units = [];
        this.isShiftPressed = false;

        this.uiPanel = document.getElementById('selection-panel');
        this.uiUnitName = document.getElementById('unit-name');
        this.uiUnitType = document.getElementById('unit-type');
        this.uiUnitHp = document.getElementById('unit-hp');
        this.uiUnitStatus = document.getElementById('unit-status');

        this.init();
    }

    init() {
        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Spawn friendly units
        this.spawnUnit(200, 200, 'Infantry (Ghatak)', 'friendly');
        this.spawnUnit(250, 200, 'Infantry (Ghatak)', 'friendly');
        this.spawnUnit(200, 250, 'Infantry (Ghatak)', 'friendly');
        this.spawnUnit(400, 300, 'Tank (Arjun MBT)', 'friendly');
        this.spawnUnit(400, 400, 'Tank (Arjun MBT)', 'friendly');
        this.spawnUnit(600, 200, 'Helicopter (Prachand)', 'friendly');

        // Spawn hostile units
        for (let i = 0; i < 5; i++) {
            this.spawnUnit(800 + Math.random() * 100, 300 + Math.random() * 200, 'Rogue Militia', 'hostile');
        }
        for (let i = 0; i < 2; i++) {
            this.spawnUnit(900 + Math.random() * 100, 100 + Math.random() * 200, 'Rogue Militia', 'hostile');
        }

        document.addEventListener('keydown', e => {
            if(e.key === 'Shift') this.isShiftPressed = true;
        });
        document.addEventListener('keyup', e => {
            if(e.key === 'Shift') this.isShiftPressed = false;
        });

        this.loop();
    }

    resize() {
        this.renderer.resize(window.innerWidth, window.innerHeight);
    }

    spawnUnit(x, y, type, faction = 'friendly') {
        this.units.push(new Unit(x, y, type, faction));
    }

    update() {
        this.units.forEach(unit => unit.update(this));
        
        // Remove dead units
        this.units = this.units.filter(unit => unit.hp > 0);
    }

    updateUIPanel(lastUnit, count) {
        if (count === 0) {
            this.uiPanel.classList.add('hidden');
        } else if (count === 1 && lastUnit) {
            this.uiPanel.classList.remove('hidden');
            this.uiUnitName.innerText = `UNIT ${lastUnit.id.toUpperCase()}`;
            this.uiUnitType.innerText = lastUnit.type;
            this.uiUnitHp.innerText = `${Math.ceil(lastUnit.hp)}/${lastUnit.maxHp}`;
            this.uiUnitStatus.innerText = (lastUnit.targetX !== null) ? 'MOVING' : (lastUnit.attackTarget ? 'ENGAGING' : 'IDLE');
        } else {
            this.uiPanel.classList.remove('hidden');
            this.uiUnitName.innerText = 'MULTIPLE UNITS';
            this.uiUnitType.innerText = 'Mixed Group';
            this.uiUnitHp.innerText = '-';
            this.uiUnitStatus.innerText = `${count} Selected`;
        }
    }

    // Refresh UI status for single selected unit
    refreshUI() {
        const selectedUnits = this.units.filter(u => u.selected);
        if(selectedUnits.length === 1) {
            const u = selectedUnits[0];
            this.uiUnitHp.innerText = `${Math.max(0, Math.ceil(u.hp))}/${u.maxHp}`;
            this.uiUnitStatus.innerText = (u.targetX !== null) ? 'MOVING' : (u.attackTarget ? 'ENGAGING' : 'IDLE');
        }
    }

    loop() {
        this.update();
        this.refreshUI();
        this.renderer.draw(this, this.inputHandler);
        requestAnimationFrame(() => this.loop());
    }
}

// Start game
window.onload = () => {
    new Game();
};

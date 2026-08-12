class GameManager {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = CONFIG.GRID_WIDTH * CONFIG.TILE_SIZE;
        this.canvas.height = CONFIG.GRID_HEIGHT * CONFIG.TILE_SIZE;
        
        this.map = new Map(CONFIG.GRID_WIDTH, CONFIG.GRID_HEIGHT);
        this.units = [];
        this.unitIdCounter = 0;
        
        this.currentTurn = 1;
        this.currentPhase = CONFIG.TEAMS.PLAYER;
        
        this.selectedUnit = null;
        this.validMoves = [];
        this.validAttacks = [];
        
        this.initUI();
        this.spawnInitialUnits();
        this.setupInput();
        
        this.gameLoop();
    }

    initUI() {
        this.ui = {
            turnCounter: document.getElementById('turn-counter'),
            turnPhase: document.getElementById('turn-phase'),
            objectiveInfo: document.getElementById('objective-info'),
            noSelection: document.getElementById('no-selection'),
            unitDetails: document.getElementById('unit-details'),
            name: document.getElementById('ui-unit-name'),
            hpFill: document.getElementById('ui-hp-fill'),
            hpText: document.getElementById('ui-hp-text'),
            mp: document.getElementById('ui-mp'),
            attack: document.getElementById('ui-attack'),
            range: document.getElementById('ui-range'),
            defense: document.getElementById('ui-defense'),
            btnMove: document.getElementById('btn-move'),
            btnAttack: document.getElementById('btn-attack'),
            btnCapture: document.getElementById('btn-capture'),
            btnEndTurn: document.getElementById('btn-end-turn')
        };

        this.ui.btnEndTurn.addEventListener('click', () => this.endTurn());
        
        // Capture Action
        this.ui.btnCapture.addEventListener('click', () => {
            if (this.selectedUnit && this.canCapture(this.selectedUnit)) {
                this.selectedUnit.mp = 0;
                this.selectedUnit.hasAttacked = true; // Consumes action
                this.checkVictory(true); // true indicates a base was captured
                this.updateUI();
                this.draw();
            }
        });
        
        this.updateObjectiveUI();
    }
    
    updateObjectiveUI() {
        // Find recon
        let recon = this.units.find(u => u.team === CONFIG.TEAMS.PLAYER && u.name === 'Recon');
        let reconStatus = recon ? `<span style="color:#4ade80">(Alive)</span>` : `<span style="color:#ef4444">(KIA)</span>`;
        
        this.ui.objectiveInfo.innerHTML = `
            <strong>Mission 01: Capture the Valley</strong><br>
            Primary: Capture Enemy Base<br>
            Secondary: Keep Recon Alive ${reconStatus}
        `;
    }

    canCapture(unit) {
        if (!unit || unit.name !== 'Infantry' || unit.team !== this.currentPhase || unit.mp === 0) return false;
        let terrain = this.map.getTile(unit.x, unit.y);
        // Can capture if standing on an enemy base
        // In Mission 01, Enemy base is at (12, 6)
        if (terrain === CONFIG.TERRAIN.BASE && unit.x > 5) {
            return true;
        }
        return false;
    }

    // ... (skipping unchanged code for spawnInitialUnits, etc) ...

    destroyUnit(unit) {
        this.units = this.units.filter(u => u.id !== unit.id);
        if (this.selectedUnit === unit) {
            this.clearSelection();
        }
        this.updateObjectiveUI(); // Update recon status if it died
        this.checkVictory(false);
    }

    checkVictory(baseCaptured = false) {
        if (baseCaptured) {
            this.showScreen("VICTORY", "Enemy Base Captured!");
            return;
        }
        
        let enemies = this.units.filter(u => u.team === CONFIG.TEAMS.ENEMY);
        let players = this.units.filter(u => u.team === CONFIG.TEAMS.PLAYER);
        
        // Only trigger victory on elimination if we want, but objective is base capture.
        // If all enemies die, maybe we still win.
        if (enemies.length === 0) {
            this.showScreen("VICTORY", "All enemy forces destroyed!");
        } else if (players.length === 0) {
            this.showScreen("DEFEAT", "All player forces destroyed.");
        }
    }
    
    showScreen(title, desc) {
        document.getElementById('screen-overlay').classList.remove('hidden');
        document.getElementById('screen-title').innerText = title;
        document.getElementById('screen-desc').innerText = desc;
        
        // Include secondary objective status on victory
        if (title === "VICTORY") {
            let recon = this.units.find(u => u.team === CONFIG.TEAMS.PLAYER && u.name === 'Recon');
            let bonus = recon ? "<br><br><span style='color:#4ade80;font-size:16px'>★ Secondary Objective Complete (Recon Survived)</span>" : "<br><br><span style='color:#ef4444;font-size:16px'>☆ Secondary Objective Failed (Recon KIA)</span>";
            document.getElementById('screen-desc').innerHTML += bonus;
        }
        
        document.getElementById('btn-restart').onclick = () => {
            location.reload();
        };
    }

    calculateValidActions() {
        this.validMoves = [];
        this.validAttacks = [];
        
        if (!this.selectedUnit || this.selectedUnit.team !== this.currentPhase) return;

        // Dijkstra's Algorithm for Movement Range
        let distances = Array(this.map.height).fill(null).map(() => Array(this.map.width).fill(Infinity));
        distances[this.selectedUnit.y][this.selectedUnit.x] = 0;
        
        let queue = [{ x: this.selectedUnit.x, y: this.selectedUnit.y, cost: 0 }];
        const dirs = [{dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}];

        while (queue.length > 0) {
            // Sort to process lowest cost first
            queue.sort((a, b) => a.cost - b.cost);
            let current = queue.shift();

            if (current.cost > distances[current.y][current.x]) continue;

            for (let dir of dirs) {
                let nx = current.x + dir.dx;
                let ny = current.y + dir.dy;

                if (nx >= 0 && nx < this.map.width && ny >= 0 && ny < this.map.height) {
                    let tile = this.map.getTile(nx, ny);
                    let occupant = this.getUnitAt(nx, ny);
                    
                    // Cannot move through enemy units
                    if (occupant && occupant.team !== this.selectedUnit.team) continue;

                    let nextCost = current.cost + tile.moveCost;
                    
                    if (nextCost <= this.selectedUnit.mp && nextCost < distances[ny][nx]) {
                        distances[ny][nx] = nextCost;
                        queue.push({ x: nx, y: ny, cost: nextCost });
                    }
                }
            }
        }

        // Populate validMoves based on distances
        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                if (distances[y][x] > 0 && distances[y][x] <= this.selectedUnit.mp) {
                    // Final tile must be empty
                    if (!this.getUnitAt(x, y)) {
                        this.validMoves.push({x, y});
                    }
                }
                
                // Attacks are still based on Manhattan distance, ignoring terrain blockers (like indirect fire)
                let dist = Math.abs(x - this.selectedUnit.x) + Math.abs(y - this.selectedUnit.y);
                if (dist > 0 && dist <= this.selectedUnit.range && !this.selectedUnit.hasAttacked) {
                    let target = this.getUnitAt(x, y);
                    if (target && target.team !== this.selectedUnit.team) {
                        this.validAttacks.push({x, y});
                    }
                }
            }
        }
    }

    updateUI() {
        if (this.selectedUnit) {
            this.ui.noSelection.classList.add('hidden');
            this.ui.unitDetails.classList.remove('hidden');
            
            this.ui.name.innerText = this.selectedUnit.name;
            this.ui.name.style.color = CONFIG.COLORS[this.selectedUnit.team];
            
            this.ui.hpText.innerText = `${this.selectedUnit.hp}/${this.selectedUnit.maxHp}`;
            this.ui.hpFill.style.width = `${(this.selectedUnit.hp / this.selectedUnit.maxHp) * 100}%`;
            
            this.ui.mp.innerText = `${this.selectedUnit.mp}/${this.selectedUnit.maxMp}`;
            this.ui.attack.innerText = this.selectedUnit.attackPower;
            this.ui.range.innerText = this.selectedUnit.range;
            this.ui.defense.innerText = this.selectedUnit.defense;
            
            let isPlayer = this.selectedUnit.team === CONFIG.TEAMS.PLAYER;
            this.ui.btnMove.disabled = !isPlayer || this.selectedUnit.mp === 0 || this.validMoves.length === 0;
            this.ui.btnAttack.disabled = !isPlayer || this.selectedUnit.hasAttacked || this.validAttacks.length === 0;
            this.ui.btnCapture.disabled = !isPlayer || !this.canCapture(this.selectedUnit);
            
        } else {
            this.ui.noSelection.classList.remove('hidden');
            this.ui.unitDetails.classList.add('hidden');
            this.ui.btnMove.disabled = true;
            this.ui.btnAttack.disabled = true;
            this.ui.btnCapture.disabled = true;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map
        this.map.draw(this.ctx);
        
        // Draw highlights
        if (this.selectedUnit && this.selectedUnit.team === this.currentPhase) {
            this.validMoves.forEach(m => {
                this.ctx.fillStyle = CONFIG.COLORS.highlightMove;
                this.ctx.fillRect(m.x * CONFIG.TILE_SIZE, m.y * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            });
            this.validAttacks.forEach(a => {
                this.ctx.fillStyle = CONFIG.COLORS.highlightAttack;
                this.ctx.fillRect(a.x * CONFIG.TILE_SIZE, a.y * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            });
            
            // Draw selection box
            this.ctx.strokeStyle = CONFIG.COLORS.selectedLine;
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(this.selectedUnit.x * CONFIG.TILE_SIZE, this.selectedUnit.y * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
        }

        // Draw units
        this.units.forEach(u => u.draw(this.ctx));
    }

    gameLoop() {
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start game
window.onload = () => {
    window.game = new GameManager();
};

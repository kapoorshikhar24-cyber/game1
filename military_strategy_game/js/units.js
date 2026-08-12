class Unit {
    constructor(id, team, x, y) {
        this.id = id;
        this.team = team;
        this.x = x;
        this.y = y;
        
        // Base stats (overridden by children)
        this.name = 'Unit';
        this.maxHp = 100;
        this.hp = 100;
        this.maxMp = 4;
        this.mp = 4; // Movement points
        this.attackPower = 25;
        this.defense = 10;
        this.range = 1; // Tiles
        
        this.hasAttacked = false;
    }

    resetTurn() {
        this.mp = this.maxMp;
        this.hasAttacked = false;
    }

    draw(ctx) {
        // Draw base unit shape (circle)
        ctx.beginPath();
        ctx.arc(
            this.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, 
            this.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, 
            CONFIG.TILE_SIZE / 3, 
            0, Math.PI * 2
        );
        ctx.fillStyle = CONFIG.COLORS[this.team];
        ctx.fill();
        
        // Dark outline if hasn't acted, light if acted
        ctx.strokeStyle = (this.mp === 0 && this.hasAttacked) ? '#555' : '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw HP bar
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x * CONFIG.TILE_SIZE + 5, this.y * CONFIG.TILE_SIZE + 5, CONFIG.TILE_SIZE - 10, 4);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(this.x * CONFIG.TILE_SIZE + 5, this.y * CONFIG.TILE_SIZE + 5, (CONFIG.TILE_SIZE - 10) * hpPercent, 4);
        
        // Draw Unit initial text
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name.charAt(0), this.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, this.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2 + 4);
    }
}

class Infantry extends Unit {
    constructor(id, team, x, y) {
        super(id, team, x, y);
        this.name = 'Infantry';
        this.maxHp = 100;
        this.hp = 100;
        this.maxMp = 3;
        this.mp = 3;
        this.attackPower = 20;
        this.defense = 15;
        this.range = 1;
    }
}

class Tank extends Unit {
    constructor(id, team, x, y) {
        super(id, team, x, y);
        this.name = 'Tank';
        this.maxHp = 200;
        this.hp = 200;
        this.maxMp = 5;
        this.mp = 5;
        this.attackPower = 40;
        this.defense = 30;
        this.range = 2;
    }
}

class Artillery extends Unit {
    constructor(id, team, x, y) {
        super(id, team, x, y);
        this.name = 'Artillery';
        this.maxHp = 80;
        this.hp = 80;
        this.maxMp = 2;
        this.mp = 2;
        this.attackPower = 50;
        this.defense = 5;
        this.range = 4;
    }
}

class Recon extends Unit {
    constructor(id, team, x, y) {
        super(id, team, x, y);
        this.name = 'Recon';
        this.maxHp = 60;
        this.hp = 60;
        this.maxMp = 7;
        this.mp = 7;
        this.attackPower = 10;
        this.defense = 5;
        this.range = 1;
    }
}

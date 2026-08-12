class Unit {
    constructor(x, y, type, faction = 'friendly') {
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.type = type;
        this.faction = faction;
        this.selected = false;
        
        this.targetX = null;
        this.targetY = null;
        
        // Combat stats
        this.attackTarget = null;
        this.lastAttackTime = 0;
        
        this.setupStats();
        this.maxHp = this.hp;
    }

    setupStats() {
        if (this.faction === 'hostile') {
            this.speed = 1.0;
            this.radius = 10;
            this.color = '#ef4444'; // Red
            this.hp = 150;
            this.attackRange = 100;
            this.damage = 10;
            this.attackRate = 1000; // ms
            return;
        }

        switch(this.type) {
            case 'Infantry (Ghatak)':
                this.speed = 1.5;
                this.radius = 8;
                this.color = '#4ade80';
                this.hp = 100;
                this.attackRange = 120;
                this.damage = 15;
                this.attackRate = 800;
                break;
            case 'Tank (Arjun MBT)':
                this.speed = 0.8;
                this.radius = 16;
                this.color = '#3b82f6';
                this.hp = 500;
                this.attackRange = 200;
                this.damage = 50;
                this.attackRate = 2000;
                break;
            case 'Helicopter (Prachand)':
                this.speed = 2.5;
                this.radius = 12;
                this.color = '#f59e0b';
                this.hp = 250;
                this.attackRange = 150;
                this.damage = 25;
                this.attackRate = 500;
                break;
            default:
                this.speed = 1;
                this.radius = 10;
                this.color = '#ffffff';
                this.hp = 100;
                this.attackRange = 100;
                this.damage = 10;
                this.attackRate = 1000;
        }
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.attackTarget = null; // Clear attack target when moving manually
    }

    takeDamage(amount) {
        this.hp -= amount;
    }

    update(game) {
        // Auto-engage logic
        if (!this.attackTarget || this.attackTarget.hp <= 0) {
            this.attackTarget = null;
            // Find nearest enemy in range
            let nearestEnemy = null;
            let minDist = this.attackRange;

            game.units.forEach(other => {
                if (other.faction !== this.faction && other.hp > 0) {
                    const dist = Math.hypot(other.x - this.x, other.y - this.y);
                    if (dist <= minDist) {
                        minDist = dist;
                        nearestEnemy = other;
                    }
                }
            });
            if (nearestEnemy) {
                this.attackTarget = nearestEnemy;
            }
        }

        // Perform attack
        if (this.attackTarget) {
            const now = Date.now();
            const distToTarget = Math.hypot(this.attackTarget.x - this.x, this.attackTarget.y - this.y);
            
            if (distToTarget <= this.attackRange) {
                if (now - this.lastAttackTime > this.attackRate) {
                    this.attackTarget.takeDamage(this.damage);
                    this.lastAttackTime = now;
                    game.renderer.addAttackEffect(this.x, this.y, this.attackTarget.x, this.attackTarget.y, this.color);
                }
            } else {
                this.attackTarget = null; // out of range
            }
        }

        // Movement
        if (this.targetX !== null && this.targetY !== null) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist > this.speed) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            } else {
                this.x = this.targetX;
                this.y = this.targetY;
                this.targetX = null;
                this.targetY = null;
            }
        }
    }
}

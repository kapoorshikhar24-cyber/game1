class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.clickFeedbacks = [];
        this.attackEffects = []; // {x1, y1, x2, y2, color, life}
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    addClickFeedback(x, y) {
        this.clickFeedbacks.push({ x, y, radius: 0, alpha: 1 });
    }

    addAttackEffect(x1, y1, x2, y2, color) {
        this.attackEffects.push({ x1, y1, x2, y2, color, life: 1.0 });
    }

    draw(game, inputHandler) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.drawUnits(game.units);
        this.drawAttackEffects();
        this.drawClickFeedbacks();

        if (inputHandler.isDragging) {
            this.drawSelectionBox(inputHandler);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        const gridSize = 50;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawUnitShape(unit) {
        this.ctx.save();
        this.ctx.translate(unit.x, unit.y);
        
        // Calculate rotation if moving or attacking
        let angle = 0;
        if (unit.attackTarget) {
            angle = Math.atan2(unit.attackTarget.y - unit.y, unit.attackTarget.x - unit.x);
        } else if (unit.targetX !== null) {
            angle = Math.atan2(unit.targetY - unit.y, unit.targetX - unit.x);
        }
        this.ctx.rotate(angle);

        this.ctx.fillStyle = unit.color;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;

        if (unit.faction === 'hostile') {
            // Hostile: Diamond shape
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0);
            this.ctx.lineTo(0, 10);
            this.ctx.lineTo(-10, 0);
            this.ctx.lineTo(0, -10);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        } else if (unit.type.includes('Tank')) {
            // Tank chassis
            this.ctx.fillRect(-12, -10, 24, 20);
            this.ctx.strokeRect(-12, -10, 24, 20);
            // Tank turret
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 8, 0, Math.PI*2);
            this.ctx.fillStyle = '#1e3a8a';
            this.ctx.fill();
            this.ctx.stroke();
            // Barrel
            this.ctx.fillRect(0, -2, 18, 4);
            this.ctx.strokeRect(0, -2, 18, 4);
        } else if (unit.type.includes('Helicopter')) {
            // Heli body
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.stroke();
            // Tail
            this.ctx.fillRect(-18, -2, 10, 4);
            // Rotor (animated)
            this.ctx.save();
            const time = Date.now() / 50;
            this.ctx.rotate(time);
            this.ctx.beginPath();
            this.ctx.moveTo(-16, 0);
            this.ctx.lineTo(16, 0);
            this.ctx.moveTo(0, -16);
            this.ctx.lineTo(0, 16);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.restore();
        } else {
            // Infantry Chevron
            this.ctx.beginPath();
            this.ctx.moveTo(8, 0);
            this.ctx.lineTo(-6, -6);
            this.ctx.lineTo(-2, 0);
            this.ctx.lineTo(-6, 6);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawUnits(units) {
        units.forEach(unit => {
            // Draw path line if moving
            if (unit.targetX !== null && unit.targetY !== null && unit.faction === 'friendly') {
                this.ctx.beginPath();
                this.ctx.moveTo(unit.x, unit.y);
                this.ctx.lineTo(unit.targetX, unit.targetY);
                this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            // Draw unit selection ring
            if (unit.selected && unit.faction === 'friendly') {
                this.ctx.beginPath();
                this.ctx.arc(unit.x, unit.y, unit.radius + 6, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#00ff88';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            this.drawUnitShape(unit);

            // Draw Health Bar if damaged
            if (unit.hp < unit.maxHp) {
                const hpPercent = Math.max(0, unit.hp / unit.maxHp);
                this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
                this.ctx.fillRect(unit.x - 10, unit.y - unit.radius - 12, 20, 4);
                this.ctx.fillStyle = unit.faction === 'friendly' ? '#00ff88' : '#ef4444';
                this.ctx.fillRect(unit.x - 10, unit.y - unit.radius - 12, 20 * hpPercent, 4);
            }
        });
    }

    drawAttackEffects() {
        for (let i = this.attackEffects.length - 1; i >= 0; i--) {
            let eff = this.attackEffects[i];
            
            this.ctx.beginPath();
            this.ctx.moveTo(eff.x1, eff.y1);
            this.ctx.lineTo(eff.x2, eff.y2);
            this.ctx.strokeStyle = eff.color;
            this.ctx.lineWidth = 2 * eff.life;
            this.ctx.stroke();

            eff.life -= 0.1;

            if (eff.life <= 0) {
                this.attackEffects.splice(i, 1);
            }
        }
    }

    drawSelectionBox(input) {
        const x = Math.min(input.dragStartX, input.mouseX);
        const y = Math.min(input.dragStartY, input.mouseY);
        const w = Math.abs(input.mouseX - input.dragStartX);
        const h = Math.abs(input.mouseY - input.dragStartY);

        this.ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, w, h);
    }

    drawClickFeedbacks() {
        for (let i = this.clickFeedbacks.length - 1; i >= 0; i--) {
            let fb = this.clickFeedbacks[i];
            
            this.ctx.beginPath();
            this.ctx.arc(fb.x, fb.y, fb.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(0, 255, 136, ${fb.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            fb.radius += 1.5;
            fb.alpha -= 0.05;

            if (fb.alpha <= 0) {
                this.clickFeedbacks.splice(i, 1);
            }
        }
    }
}

class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.mouseX = 0;
        this.mouseY = 0;

        this.setupListeners();
    }

    setupListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.isDragging = true;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            } else if (e.button === 2) { // Right click
                this.handleRightClick(e.clientX, e.clientY);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Left click
                this.isDragging = false;
                this.handleSelection();
            }
        });

        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    handleSelection() {
        const minX = Math.min(this.dragStartX, this.mouseX);
        const maxX = Math.max(this.dragStartX, this.mouseX);
        const minY = Math.min(this.dragStartY, this.mouseY);
        const maxY = Math.max(this.dragStartY, this.mouseY);

        let selectedCount = 0;
        let lastSelectedUnit = null;

        this.game.units.forEach(unit => {
            if (unit.faction !== 'friendly') {
                unit.selected = false;
                return;
            }
            // Check if point selection or box selection
            if (Math.abs(maxX - minX) < 5 && Math.abs(maxY - minY) < 5) {
                // Point selection
                const dist = Math.hypot(unit.x - this.mouseX, unit.y - this.mouseY);
                if (dist <= unit.radius + 5) {
                    unit.selected = true;
                    selectedCount++;
                    lastSelectedUnit = unit;
                } else {
                    if (!this.game.isShiftPressed) {
                        unit.selected = false;
                    }
                }
            } else {
                // Box selection
                if (unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY) {
                    unit.selected = true;
                    selectedCount++;
                    lastSelectedUnit = unit;
                } else {
                    if (!this.game.isShiftPressed) {
                        unit.selected = false;
                    }
                }
            }
        });

        this.game.updateUIPanel(lastSelectedUnit, selectedCount);
    }

    handleRightClick(x, y) {
        let selectedUnits = this.game.units.filter(u => u.selected);
        
        // Simple formation logic (offset destinations slightly so they don't stack)
        const cols = Math.ceil(Math.sqrt(selectedUnits.length));
        const spacing = 30;

        selectedUnits.forEach((unit, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            const offsetX = (col - (cols-1)/2) * spacing;
            const offsetY = (row - (cols-1)/2) * spacing;
            
            unit.setTarget(x + offsetX, y + offsetY);
        });

        if(selectedUnits.length > 0) {
            this.game.renderer.addClickFeedback(x, y);
        }
    }
}

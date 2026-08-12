class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = []; // 2D array of terrain IDs
        this.generateMap();
    }

    generateMap() {
        const R = CONFIG.TERRAIN.ROAD;
        const F = CONFIG.TERRAIN.FOREST;
        const M = CONFIG.TERRAIN.MOUNTAIN;
        const C = CONFIG.TERRAIN.CITY;
        const W = CONFIG.TERRAIN.RIVER; // W for Water/River
        const B = CONFIG.TERRAIN.BASE;
        const G = CONFIG.TERRAIN.ROAD; // Plain ground/road for now

        // Mission 01: Capture the Valley (15x10)
        // A valley flanked by mountains with a river crossing
        const layout = [
            [M, M, M, M, M, M, G, R, R, R, F, F, M, M, M],
            [M, M, M, M, M, M, G, R, C, R, R, R, R, R, M],
            [M, M, B, R, R, R, R, R, G, F, M, M, M, M, M],
            [M, M, R, M, M, M, G, W, W, G, M, M, M, M, M],
            [M, M, R, M, M, M, G, W, W, G, M, M, M, M, M],
            [F, F, R, R, R, F, F, W, W, G, G, G, R, R, F],
            [M, M, M, M, M, G, G, W, W, C, R, R, B, R, F],
            [M, M, M, M, M, G, G, W, W, G, G, F, M, M, M],
            [M, M, M, M, M, M, R, R, R, R, F, F, M, M, M],
            [M, M, M, M, M, M, F, F, F, F, F, M, M, M, M]
        ];

        for (let y = 0; y < this.height; y++) {
            let row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(layout[y][x] || G);
            }
            this.grid.push(row);
        }
    }

    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        }
        return null;
    }

    draw(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let terrain = this.grid[y][x];
                ctx.fillStyle = terrain.color;
                ctx.fillRect(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                
                // Draw grid lines
                ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                ctx.strokeRect(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                
                // Draw Base indicator
                if (terrain === CONFIG.TERRAIN.BASE) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(x * CONFIG.TILE_SIZE + 10, y * CONFIG.TILE_SIZE + 10, CONFIG.TILE_SIZE - 20, CONFIG.TILE_SIZE - 20);
                }
            }
        }
    }
}

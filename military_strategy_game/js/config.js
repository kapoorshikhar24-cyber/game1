const CONFIG = {
    TILE_SIZE: 50,
    GRID_WIDTH: 15,
    GRID_HEIGHT: 10,
    
    // Terrain types
    TERRAIN: {
        ROAD: { id: 0, color: '#4b5563', name: 'Road', moveCost: 1, defBonus: 0 },
        FOREST: { id: 1, color: '#166534', name: 'Forest', moveCost: 2, defBonus: 20 },
        MOUNTAIN: { id: 2, color: '#374151', name: 'Mountain', moveCost: 3, defBonus: 30 },
        CITY: { id: 3, color: '#9ca3af', name: 'City', moveCost: 1, defBonus: 15 },
        RIVER: { id: 4, color: '#2563eb', name: 'River', moveCost: 99, defBonus: -10 },
        BASE: { id: 5, color: '#b91c1c', name: 'Base', moveCost: 1, defBonus: 25, isObjective: true }
    },
    
    TEAMS: {
        PLAYER: 'player',
        ENEMY: 'enemy'
    },
    
    COLORS: {
        player: '#3b82f6', // Blue
        enemy: '#ef4444', // Red
        highlightMove: 'rgba(74, 222, 128, 0.4)', // Green
        highlightAttack: 'rgba(239, 68, 68, 0.4)', // Red
        selectedLine: '#ffffff'
    }
};

import { GameEngine } from './engine/GameEngine.js';
import { Level } from './world/Level.js';
import { Ballistics } from './ballistics/Ballistics.js';
import { Weapon } from './weapons/Weapon.js';
import { Player } from './player/Player.js';
import { Guard } from './ai/Guard.js';

// --- Difficulty Configs ---
const DIFFICULTY_CONFIGS = {
    ROOKIE: {
        visionMultiplier: 0.7,
        suspicionRate: 0.6,
        alertRadiusMultiplier: 0.8,
        guardDamage: 5,
        playerMaxHealth: 150,
        windErrorMargin: 0,
        showTrajectoryGuide: true,
        showTacticalHUD: true,
        scoreMultiplier: 1.0,
        label: 'ROOKIE'
    },
    REGULAR: {
        visionMultiplier: 1.0,
        suspicionRate: 1.0,
        alertRadiusMultiplier: 1.0,
        guardDamage: 10,
        playerMaxHealth: 100,
        windErrorMargin: 0,
        showTrajectoryGuide: false,
        showTacticalHUD: true,
        scoreMultiplier: 2.0,
        label: 'REGULAR'
    },
    ELITE: {
        visionMultiplier: 1.4,
        suspicionRate: 1.8,
        alertRadiusMultiplier: 1.3,
        guardDamage: 20,
        playerMaxHealth: 80,
        windErrorMargin: 0,
        showTrajectoryGuide: false,
        showTacticalHUD: false,
        scoreMultiplier: 4.0,
        label: 'ELITE'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Attach legacy classes to window for managers to instantiate
    window.Level = Level;
    window.Ballistics = Ballistics;
    window.Weapon = Weapon;
    window.Player = Player;
    window.Guard = Guard;

    // --- Difficulty Button Logic ---
    let selectedDiff = 'REGULAR';
    const diffBtns = document.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            diffBtns.forEach(b => {
                b.style.borderColor = '';
                b.style.color = '';
                b.classList.remove('selected');
            });
            btn.style.borderColor = '#d97706';
            btn.style.color = '#d97706';
            btn.classList.add('selected');
            selectedDiff = btn.dataset.diff || 'REGULAR';
        });
    });

    // Apply chosen difficulty before engine boots
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.CurrentDifficulty = DIFFICULTY_CONFIGS[selectedDiff] || DIFFICULTY_CONFIGS.REGULAR;
            // Apply health to player after engine init
            setTimeout(() => {
                const player = window.gameEngine?.playerManager?.player;
                if (player) {
                    player.health = window.CurrentDifficulty.playerMaxHealth;
                    player.maxHealth = window.CurrentDifficulty.playerMaxHealth;
                    const hpEl = document.getElementById('health-fill');
                    if (hpEl) hpEl.style.width = '100%';
                }
            }, 200);
        }, { once: true }); // fire only once to not interfere with UIManager's listener
    }

    // Create the global engine instance
    window.gameEngine = new GameEngine();

    // Define global proxy objects for backward compatibility with existing legacy scripts
    window.stats = {
        shotsFired: 0,
        shotsHit: 0,
        undetectedKills: 0,
        longestKill: 0,
        wasDetected: false
    };

    window.CurrentDifficulty = DIFFICULTY_CONFIGS.REGULAR;

    window.isGameOver = false;
    window.guards = [];

    // Boot the engine
    window.gameEngine.init();
});

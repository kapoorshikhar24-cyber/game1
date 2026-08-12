import { EventBus } from './EventBus.js';
import { GameStateManager } from './GameStateManager.js';
import { TimeManager } from './TimeManager.js';
import { InputManager } from './InputManager.js';
import { GameLoop } from './GameLoop.js';
import { PerformanceManager } from './PerformanceManager.js';
import { SaveManager } from './SaveManager.js';
import { AssetManager } from './AssetManager.js';

import { WorldManager } from '../world/WorldManager.js';
import { PlayerManager } from '../player/PlayerManager.js';
import { WeaponManager } from '../weapons/WeaponManager.js';
import { BallisticsManager } from '../ballistics/BallisticsManager.js';
import { UIManager } from '../ui/UIManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { MissionManager } from '../missions/MissionManager.js';
import { ObjectiveManager } from '../missions/ObjectiveManager.js';
import { CombatManager } from '../combat/CombatManager.js';
import { AIManager } from '../ai/AIManager.js';
import { SquadManager } from '../ai/SquadManager.js';
import { CameraManager } from '../camera/CameraManager.js';
import { EffectsManager } from '../effects/EffectsManager.js';
import { RealisticsManager } from '../effects/RealisticsManager.js';
import { DetectionManager } from '../ai/DetectionManager.js';

// New campaign & voice systems
import { CampaignManager } from '../campaign/CampaignManager.js';
import { VoiceSystem } from '../missions/VoiceSystem.js';
import { TacticalTablet } from '../ui/TacticalTablet.js';
import { CampaignScreen } from '../ui/CampaignScreen.js';

export class GameEngine {
    constructor() {
        // Core Systems
        this.eventBus = new EventBus();
        this.stateManager = new GameStateManager(this.eventBus);
        this.timeManager = new TimeManager();
        this.inputManager = new InputManager(this.eventBus);
        
        // Data Managers
        this.performanceManager = new PerformanceManager(this);
        this.saveManager = new SaveManager(this);
        this.assetManager = new AssetManager(this);
        
        // Functional Managers
        this.worldManager = new WorldManager(this);
        this.playerManager = new PlayerManager(this);
        this.weaponManager = new WeaponManager(this);
        this.ballisticsManager = new BallisticsManager(this);
        this.uiManager = new UIManager(this);
        this.audioManager = new AudioManager(this);
        this.missionManager = new MissionManager(this);
        this.objectiveManager = new ObjectiveManager(this);
        this.combatManager = new CombatManager(this);
        this.aiManager = new AIManager(this);
        this.squadManager = new SquadManager(this);
        this.cameraManager = new CameraManager(this);
        this.effectsManager = new EffectsManager(this);
        this.realisticsManager = new RealisticsManager(this);
        this.detectionManager = new DetectionManager(this);

        // Campaign & Story Systems
        this.campaignManager = new CampaignManager(this);
        this.voiceSystem = new VoiceSystem(this);
        this.tacticalTablet = new TacticalTablet(this);
        this.campaignScreen = new CampaignScreen(this);
        
        this.loop = new GameLoop(this);
    }

    init() {
        console.log('GameEngine initialized — Elite Sniper: Shadows of India');
        
        // Setup initial world and legacy bindings
        this.playerManager.init(this.worldManager.camera, this.worldManager.renderer.domElement);
        this.ballisticsManager.init(this.worldManager.scene);
        this.weaponManager.init(this.worldManager.camera, this.ballisticsManager.ballistics);
        this.aiManager.init(this.worldManager.scene);
        this.missionManager.initMission();

        // Init snow system and realism effects with scene + camera
        this.effectsManager.init(this.worldManager.scene, this.worldManager.camera);
        this.realisticsManager.init(this.worldManager.scene, this.worldManager.camera);

        // Wire VoiceSystem to Mission 1 data
        const currentMission = this.campaignManager.getCurrentMission();
        if (currentMission) {
            this.voiceSystem.setMission(currentMission);
            this.tacticalTablet.setMission(currentMission);
        }

        // Wire CampaignScreen to campaign manager missions
        this.campaignScreen.setMissions(this.campaignManager.missions);

        // Hook radio dialogue into VoiceSystem comms log and tactical tablet
        this._hookRadioToTablet();

        this._missionStarted = false;
        this.eventBus.on('STATE_CHANGED', (data) => {
            if (data.current === 'PLAYING' && !this._missionStarted) {
                this._missionStarted = true;
                this.missionManager.startMission();
                if (this.audioManager) this.audioManager.updateAmbientWind(4);
            }
        });

        // Campaign: unlock next mission on complete
        this.eventBus.on('MISSION_COMPLETE', () => {
            this.campaignManager.onMissionComplete({ choice: this.missionManager.playerChoice });
            this.campaignScreen.setMissions(this.campaignManager.missions);
        });

        // Force the game into main menu state
        this.stateManager.setState('MAIN_MENU');
        
        this.loop.start();
    }

    _hookRadioToTablet() {
        // Intercept speak calls to log them in the tablet
        const origSpeak = this.missionManager.radioSystem.speak.bind(this.missionManager.radioSystem);
        this.missionManager.radioSystem.speak = (speaker, text, duration, color) => {
            origSpeak(speaker, text, duration, color);
            // Log to tactical tablet
            this.tacticalTablet._logComms({ speaker, text, color });
        };
    }

    update(dt) {
        this.performanceManager.update(performance.now());
        
        if (this.stateManager.is('PLAYING') || this.stateManager.is('SCOPE') || this.stateManager.is('BULLET_CAM')) {
            this.playerManager.update(dt);
            this.weaponManager.update(dt);
            this.ballisticsManager.update(dt);
            this.aiManager.update(dt);
            this.cameraManager.update(dt);
            this.effectsManager.update(dt);
            this.realisticsManager.update(dt);
            this.detectionManager.update(dt);
            this.missionManager.update(dt);
            this.voiceSystem.update(dt);
            this.uiManager.update();
        }
    }

    render() {
        this.worldManager.render();
    }
}

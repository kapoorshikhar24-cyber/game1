import { ExtractionSystem } from './ExtractionSystem.js';
import { StoryCinematic } from './StoryCinematic.js';
import { TargetIdentification } from './TargetIdentification.js';
import { RadioDialogueSystem } from './RadioDialogueSystem.js';

export const OPERATION_TRISHUL_SHADOW = {
    id: "op_trishul_shadow",
    title: "OPERATION: TRISHUL SHADOW",
    chapter: "CHAPTER 1 — THE FIRST SIGNAL",
    location: "NORTHERN INDIA, HIMALAYAN BORDER SECTOR",
    briefing: "Observe remote mountain valley settlement. Determine who is operating inside the compound. Locate Hostile Commander KABIR and investigate the disappearance of local informant TARA.",
    primaryObjectives: [
        { id: "reach_obs_point", title: "Reach Observation Point", desc: "Move forward through mountain corridor to overwatch ridge.", targetPos: new THREE.Vector3(0, 24, -40), radius: 15.0, completed: false },
        { id: "establish_overwatch", title: "Establish Overwatch", desc: "Equip sniper scope and observe enemy compound activity.", completed: false },
        { id: "identify_target", title: "Confirm Target: Kabir", desc: "Scope in on compound and identify Kabir (Dark Field Jacket).", completed: false },
        { id: "investigate_tara", title: "Determine Tara's Presence", desc: "Observe missing informant Tara entering the compound.", completed: false },
        { id: "make_decision", title: "Tactical Choice", desc: "Decide whether to eliminate Kabir or continue observation.", completed: false },
        { id: "reach_extraction", title: "Reach Extraction Point", desc: "Relocate on foot through valley to secondary extraction beacon [732m].", targetPos: new THREE.Vector3(0, 1.8, 80), radius: 8.0, completed: false }
    ],
    optionalObjectives: [
        { id: "inspect_patrol_vehicle", title: "Inspect Abandoned Patrol Vehicle", desc: "Examine patrol vehicle near forest path for military intelligence.", completed: false, failed: false },
        { id: "remain_undetected", title: "Ghost Reconnaissance", desc: "Complete extraction without being spotted by enemy search patrols.", completed: true, failed: false }
    ],
    failureConditions: [
        { id: "player_killed", title: "Captain Arjun Rathore Killed in Action" }
    ]
};

export class MissionManager {
    constructor(engine) {
        this.engine = engine;
        this.currentMission = null;
        this.phase = 'PHASE 01 — APPROACH';
        this.state = 'BRIEFING'; // BRIEFING, ACTIVE, EXTRACTION, COMPLETE, FAILED

        this.extractionSystem = new ExtractionSystem(engine);
        this.storyCinematic = new StoryCinematic(engine);
        this.targetScanner = new TargetIdentification(engine);
        this.radioSystem = new RadioDialogueSystem(engine);

        this.playerChoice = null; // 'OPTION_A' (Take Shot) or 'OPTION_B' (Observe & Track)
        this.taraSequenceTriggered = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.engine.eventBus.on('ALL_PRIMARY_OBJECTIVES_COMPLETE', () => {
            this.setPhase('PHASE 05 — EXTRACTION');
            this.setState('EXTRACTION');
            this.extractionSystem.activateExtraction();
        });

        this.engine.eventBus.on('TARGET_CONFIRMED', () => {
            this.setPhase('PHASE 03 — RECONNAISSANCE');
            this.triggerTaraSequence();
        });

        this.engine.eventBus.on('TARGET_HIT', (hit) => {
            if (hit.guard && hit.guard.isVIP) {
                this.radioSystem.speak("HAVILDAR IMRAN KHAN", "Direct hit on Kabir! Enemy compound entering Alert Level 01!", 4.0, "#ef4444");
                this.engine.objectiveManager.completeObjectiveById('make_decision');
                this.setPhase('PHASE 04 — ALERT & RELOCATION');
                this.triggerCompoundAlert();
            }
        });

        this.engine.eventBus.on('COMPOUND_ALERT_LEVEL_CHANGED', (level) => {
            if (level === 'alerted') {
                this.engine.objectiveManager.failOptionalObjective('remain_undetected');
            }
        });

        this.engine.eventBus.on('PLAYER_HEALTH_CHANGED', (pct) => {
            if (pct <= 0) {
                this.failMission('Captain Arjun Rathore Killed in Action');
            }
        });
    }

    initMission(missionData = OPERATION_TRISHUL_SHADOW) {
        this.currentMission = JSON.parse(JSON.stringify(missionData));
        this.state = 'BRIEFING';
        this.setPhase('PHASE 01 — APPROACH');

        let scene = this.engine.worldManager.scene;
        let extractionPos = new THREE.Vector3(0, 0, 80);
        this.extractionSystem.init(scene, extractionPos);

        this.engine.objectiveManager.loadObjectives(
            this.currentMission.primaryObjectives,
            this.currentMission.optionalObjectives
        );

        this.engine.eventBus.emit('MISSION_LOADED', this.currentMission);
    }

    startMission() {
        this.setState('ACTIVE');
        this.setPhase('PHASE 01 — APPROACH');
        this.storyCinematic.play();
    }

    setPhase(phaseName) {
        this.phase = phaseName;
        let phaseEl = document.getElementById('mission-phase-text');
        if (phaseEl) {
            phaseEl.innerText = phaseName;
        }

        let hudTitle = document.getElementById('hud-operation-title');
        if (hudTitle) {
            hudTitle.innerText = `${this.currentMission.title} | ${phaseName}`;
        }
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;

        this.engine.eventBus.emit('MISSION_STATE_CHANGED', { state: this.state, mission: this.currentMission });

        let statusEl = document.getElementById('mission-status');
        if (statusEl) {
            statusEl.innerText = this.state;
        }

        if (this.state === 'COMPLETE') {
            this.setPhase('PHASE 06 — RESULTS');
            // Notify campaign manager
            this.engine.eventBus.emit('MISSION_COMPLETE', { choice: this.playerChoice });
            this.showDebrief(true);
        } else if (this.state === 'FAILED') {
            this.setPhase('PHASE 06 — RESULTS');
            this.showDebrief(false);
        }
    }

    failMission(reason) {
        if (this.state === 'COMPLETE' || this.state === 'FAILED') return;
        this.setState('FAILED');
    }

    triggerTaraSequence() {
        if (this.taraSequenceTriggered) return;
        this.taraSequenceTriggered = true;

        setTimeout(() => {
            this.radioSystem.speak("CAPTAIN ARJUN RATHORE", "Tara? That's... impossible.", 3.0, "#60a5fa");
        }, 1500);

        setTimeout(() => {
            this.radioSystem.speak("LT. MEERA NAIR", "She was reported missing three months ago.", 2.5, "#f472b6");
        }, 5000);

        setTimeout(() => {
            this.radioSystem.speak("LT. MEERA NAIR", "Which means someone found her first. Determine why Tara is inside the compound.", 5.0, "#f472b6");
            this.engine.objectiveManager.completeObjectiveById('investigate_tara');
            this.showTacticalChoiceModal();
        }, 8000);
    }

    showTacticalChoiceModal() {
        if (document.getElementById('decision-modal')) return;

        let div = document.createElement('div');
        div.id = 'decision-modal';
        div.style.cssText = `
            position: absolute;
            top: 30%; left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(4, 8, 6, 0.95);
            border: 2px solid #eab308;
            padding: 24px 36px;
            border-radius: 6px;
            color: #fff;
            font-family: 'Share Tech Mono', monospace;
            z-index: 70;
            box-shadow: 0 0 40px rgba(234, 179, 8, 0.4);
            text-align: center;
            max-width: 540px;
        `;
        div.innerHTML = `
            <div style="color: #eab308; font-size: 0.85rem; letter-spacing: 3px; margin-bottom: 6px;">TACTICAL DECISION REQUIRED</div>
            <h2 style="font-size: 1.8rem; margin: 0 0 12px 0; color: #fff; letter-spacing: 2px;">MAJOR VIKRAM SINGH: "Rathore, you have your target."</h2>
            <p style="font-size: 0.9rem; color: #9ca3af; margin-bottom: 20px; line-height: 1.5;">
                Tara is handing Kabir a small data device. Kabir is standing in overwatch range. How do you proceed?
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="btn-choice-a" class="btn" style="background: rgba(239,68,68,0.2); border-color: #ef4444; color: #ef4444; padding: 12px 20px; font-size: 0.95rem;">
                    OPTION A<br><span style="font-size:0.8rem; color:#fff;">TAKE THE SHOT</span>
                </button>
                <button id="btn-choice-b" class="btn" style="background: rgba(34,197,94,0.2); border-color: #22c55e; color: #22c55e; padding: 12px 20px; font-size: 0.95rem;">
                    OPTION B<br><span style="font-size:0.8rem; color:#fff;">CONTINUE OBSERVATION</span>
                </button>
            </div>
        `;

        document.getElementById('game-container').appendChild(div);

        document.getElementById('btn-choice-a').onclick = () => this.handlePlayerChoice('OPTION_A');
        document.getElementById('btn-choice-b').onclick = () => this.handlePlayerChoice('OPTION_B');
    }

    handlePlayerChoice(choice) {
        this.playerChoice = choice;
        const modal = document.getElementById('decision-modal');
        if (modal) modal.remove();

        this.engine.objectiveManager.completeObjectiveById('make_decision');
        // Track choice in campaign manager
        this.engine.eventBus.emit('PLAYER_CHOICE_MADE', { choice });

        if (choice === 'OPTION_A') {
            this.radioSystem.speak("CAPTAIN ARJUN RATHORE", "Taking the shot.", 2.5, "#60a5fa");
        } else {
            this.radioSystem.speak("LT. MEERA NAIR", "Tara handed Kabir a small data device. He's moving out — track him and extract!", 5.0, "#f472b6");
            setTimeout(() => {
                this.radioSystem.speak("HAVILDAR IMRAN KHAN", "And compound just went active. Move, Arjun!", 3.0, "#34d399");
            }, 5500);
            this.triggerCompoundAlert();
        }
    }

    triggerCompoundAlert() {
        let alertBanner = document.getElementById('masking-alert');
        if (alertBanner) {
            alertBanner.innerHTML = "ALERT LEVEL 01 — HOSTILE SEARCH PATROLS ACTIVATED";
            alertBanner.style.borderColor = "#ef4444";
            alertBanner.style.color = "#ef4444";
            alertBanner.classList.remove('hidden');
        }

        let guards = window.guards || [];
        let pPos = this.engine.worldManager.playerManager?.player?.camera?.position;
        guards.forEach(g => {
            if (g && g.state !== 'DEAD' && !g.isTara) g.triggerAlert(pPos);
        });

        this.engine.eventBus.emit('COMPOUND_ALERT_LEVEL_CHANGED', 'alerted');
    }

    update(dt) {
        this.storyCinematic.update(dt);

        if (this.state !== 'ACTIVE' && this.state !== 'EXTRACTION') return;

        this.targetScanner.update(dt);

        let player = this.engine.worldManager.playerManager?.player;
        if (!player || !player.camera) return;

        let playerPos = player.camera.position.clone();
        let currentObj = this.engine.objectiveManager.getCurrentObjective();

        // Objective 1: Reach observation point
        if (currentObj && currentObj.id === 'reach_obs_point') {
            if (playerPos.z < -8) {
                this.engine.objectiveManager.completeObjectiveById('reach_obs_point');
                this.setPhase('PHASE 02 — RECONNAISSANCE');
                this.radioSystem.speak("HAVILDAR IMRAN KHAN", "Welcome to the neighborhood. Three buildings, one radio tower. Observe the compound — find Kabir.", 5.0, "#34d399");
                setTimeout(() => {
                    this.radioSystem.speak("LT. MEERA NAIR", "We're looking for Kabir. Dark jacket. Tall. Usually has two guards with him.", 4.5, "#f472b6");
                }, 6000);
            }
        }

        // Abandoned Vehicle Intel Check
        if (playerPos.distanceTo(new THREE.Vector3(8, 1.8, 55)) < 6.0) {
            const opt = this.currentMission.optionalObjectives.find(o => o.id === 'inspect_patrol_vehicle');
            if (opt && !opt.completed) {
                this.engine.objectiveManager.completeObjectiveById('inspect_patrol_vehicle');
                this.radioSystem.speak("LT. MEERA NAIR", "Patrol vehicle inspected. Damaged radio equipment, empty medical supplies, torn map... This belonged to the missing patrol.", 5.5, "#f472b6");
                // Emit intel to tactical tablet
                this.engine.eventBus.emit('INTEL_COLLECTED', {
                    title: 'PATROL VEHICLE INSPECTION',
                    text: 'Damaged radio equipment found. Medical supplies removed. Torn tactical map recovered. Vehicle belongs to the missing patrol unit. Someone removed the radio before abandoning it.',
                });
            }
        }

        // Objective 2: Establish overwatch (Scope in at observation point)
        if (currentObj && currentObj.id === 'establish_overwatch') {
            if (this.engine.weaponManager?.weapon?.isScoped) {
                this.engine.objectiveManager.completeObjectiveById('establish_overwatch');
                this.setPhase('PHASE 03 — TARGET IDENTIFICATION');
                this.radioSystem.speak("HAVILDAR IMRAN KHAN", "Eyes on the compound. Take your time. Let him come to you.", 4.0, "#34d399");
                setTimeout(() => {
                    this.radioSystem.speak("LT. MEERA NAIR", "Kabir is height approximately 1.8 metres. Dark field jacket. Travels with two armed guards at all times.", 5.0, "#f472b6");
                }, 5000);
            }
        }

        // Objective 6: Extraction Check
        if (this.state === 'EXTRACTION') {
            let reached = this.extractionSystem.update(dt, playerPos);
            if (reached) {
                this.engine.objectiveManager.completeObjectiveById('reach_extraction');
                this.setState('COMPLETE');
            }
        }

        this.updateObjectiveMarker(player, currentObj);
    }

    updateObjectiveMarker(player, currentObj) {
        let markerEl = document.getElementById('objective-marker');
        if (!markerEl) return;

        if (!currentObj || !currentObj.targetPos) {
            markerEl.classList.add('hidden');
            return;
        }

        let targetPos = currentObj.targetPos.clone();
        targetPos.project(player.camera);

        if (targetPos.z < 1) {
            markerEl.classList.remove('hidden');
            let x = (targetPos.x * 0.5 + 0.5) * 100;
            let y = (targetPos.y * -0.5 + 0.5) * 100;
            markerEl.style.left = `${x}%`;
            markerEl.style.top = `${y}%`;

            let titleEl = document.getElementById('objective-title-tag');
            if (titleEl && currentObj.title) {
                titleEl.innerText = currentObj.title.toUpperCase();
            }

            let dist = Math.round(player.camera.position.distanceTo(currentObj.targetPos));
            let distEl = document.getElementById('objective-dist');
            if (distEl) distEl.innerText = `${dist} M`;
            
            let hudDistEl = document.querySelector('.hud-obj-distance');
            if (hudDistEl) hudDistEl.innerText = `${dist} M`;

            // Depth Occlusion Raycast
            let occluded = false;
            if (this.engine.worldManager && this.engine.worldManager.scene) {
                const start = player.camera.position.clone();
                const end = currentObj.targetPos.clone();
                const direction = new THREE.Vector3().subVectors(end, start).normalize();
                const distVal = start.distanceTo(end);

                if (distVal > 1.0) {
                    const raycaster = new THREE.Raycaster(start, direction, 0.1, distVal - 0.5);
                    const intersects = raycaster.intersectObjects(this.engine.worldManager.scene.children, true);
                    for (let hit of intersects) {
                        if (hit.object.userData?.isGuard || hit.object.userData?.isHead || hit.object.userData?.isTara || hit.object.type.includes('Light')) {
                            continue;
                        }
                        occluded = true;
                        break;
                    }
                }
            }
            markerEl.classList.toggle('marker-occluded', occluded);
        } else {
            markerEl.classList.add('hidden');
        }
    }

    showDebrief(isSuccess) {
        let feedbackEl = document.getElementById('feedback');
        if (!feedbackEl) return;

        let stats = window.stats || { shotsFired: 1, shotsHit: 1, longestKill: 486, undetectedKills: 1 };
        let accuracy = Math.round((stats.shotsHit / Math.max(1, stats.shotsFired)) * 100);

        let title = isSuccess ? "MISSION COMPLETE" : "OPERATION FAILED";
        let color = isSuccess ? "#4b6b4e" : "#ef4444";
        let subColor = isSuccess ? "#e09b3e" : "#9ca3af";

        feedbackEl.innerHTML = `
            <div class="mil-panel" style="background: rgba(12, 17, 21, 0.96) !important; border: 1px solid rgba(255,255,255,0.15) !important; padding: 36px 40px; border-radius: 6px; text-align: center; color: #fff; max-width: 680px; margin: 0 auto; box-shadow: 0 20px 60px rgba(0,0,0,0.95); font-family: 'Share Tech Mono', monospace; pointer-events: auto;">
                <div class="mil-corner top-l"></div><div class="mil-corner top-r"></div>
                <div class="mil-corner bot-l"></div><div class="mil-corner bot-r"></div>
                <div class="mil-serial">GARUDA-5 // C4I DEBRIEF SYSTEM</div>
                
                <div style="color: ${subColor}; font-size: 0.85rem; letter-spacing: 4px; margin-bottom: 6px;">OPERATION TRISHUL SHADOW</div>
                <h1 style="color: ${color}; font-size: 2.5rem; margin: 0 0 20px 0; letter-spacing: 3px; text-shadow: 0 0 20px rgba(75, 107, 78, 0.4);">${title}</h1>
                
                <!-- Performance Metrics Grid -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; text-align: center;">
                    <div style="background: rgba(20, 27, 34, 0.8); border: 1px solid rgba(255,255,255,0.1); padding: 12px 8px; border-radius: 4px;">
                        <div style="font-size: 0.65rem; color: #8b949e; letter-spacing: 1px;">PRIMARY OBJECTIVE</div>
                        <div style="font-size: 1.1rem; color: #4b6b4e; font-weight: bold; margin-top: 4px; letter-spacing: 1px;">COMPLETE</div>
                    </div>
                    <div style="background: rgba(20, 27, 34, 0.8); border: 1px solid rgba(255,255,255,0.1); padding: 12px 8px; border-radius: 4px;">
                        <div style="font-size: 0.65rem; color: #8b949e; letter-spacing: 1px;">INTELLIGENCE</div>
                        <div style="font-size: 1.1rem; color: #e09b3e; font-weight: bold; margin-top: 4px; letter-spacing: 1px;">82%</div>
                    </div>
                    <div style="background: rgba(20, 27, 34, 0.8); border: 1px solid rgba(255,255,255,0.1); padding: 12px 8px; border-radius: 4px;">
                        <div style="font-size: 0.65rem; color: #8b949e; letter-spacing: 1px;">DETECTION</div>
                        <div style="font-size: 1.1rem; color: #4b6b4e; font-weight: bold; margin-top: 4px; letter-spacing: 1px;">LOW</div>
                    </div>
                    <div style="background: rgba(20, 27, 34, 0.8); border: 1px solid rgba(255,255,255,0.1); padding: 12px 8px; border-radius: 4px;">
                        <div style="font-size: 0.65rem; color: #8b949e; letter-spacing: 1px;">TEAM STATUS</div>
                        <div style="font-size: 1.1rem; color: #4b6b4e; font-weight: bold; margin-top: 4px; letter-spacing: 1px;">SAFE</div>
                    </div>
                </div>

                <!-- Intelligence Analysis -->
                <div style="background: rgba(14, 20, 25, 0.9); border: 1px solid rgba(224, 155, 62, 0.3); padding: 16px; border-radius: 4px; margin-bottom: 24px; text-align: left; font-size: 0.88rem; line-height: 1.6; color: #e6edf3;">
                    <div style="color: #e09b3e; font-size: 0.75rem; letter-spacing: 2px; font-weight: bold; margin-bottom: 8px;">INTELLIGENCE RECOVERED</div>
                    <div style="color: #8b949e; margin-bottom: 12px;">&gt; The missing relay was deliberately disabled.</div>
                    
                    <div style="color: #e09b3e; font-size: 0.75rem; letter-spacing: 2px; font-weight: bold; margin-bottom: 8px;">NEW INFORMATION</div>
                    <div style="color: #8b949e;">&gt; Someone was monitoring military response times.</div>
                </div>

                <!-- Next Unlock Notice -->
                ${isSuccess ? `
                <div style="background: rgba(75, 107, 78, 0.15); border: 1px solid #4b6b4e; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
                    <div style="color: #4b6b4e; font-size: 0.8rem; letter-spacing: 3px; font-weight: bold;">MISSION 02 UNLOCKED</div>
                    <div style="color: #fff; font-size: 1.2rem; letter-spacing: 2px; margin-top: 4px;">THE SILENT PASS</div>
                </div>
                ` : ''}

                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button onclick="location.reload()" class="btn" style="font-size: 1rem; padding: 12px 28px;">REPLAY MISSION</button>
                    ${isSuccess ? `<button onclick="window.gameEngine.campaignScreen.open(window.gameEngine.campaignManager.missions); document.getElementById('feedback').classList.add('hidden');" class="btn" style="font-size: 1rem; padding: 12px 28px; background: #4b6b4e; border-color: #4b6b4e; color: #fff;">CONTINUE CAMPAIGN</button>` : ''}
                </div>
            </div>
        `;
        feedbackEl.classList.remove('hidden');
    }
}


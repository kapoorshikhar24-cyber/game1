/**
 * CampaignManager.js
 * Manages campaign progress, mission unlocking, choice tracking, and localStorage persistence.
 */

import { CAMPAIGN_MISSIONS, CAMPAIGN_META } from './CampaignData.js';

const SAVE_KEY = 'elite_sniper_campaign_v1';

export class CampaignManager {
    constructor(engine) {
        this.engine = engine;
        this.missions = JSON.parse(JSON.stringify(CAMPAIGN_MISSIONS)); // Deep copy
        this.meta = CAMPAIGN_META;
        this.currentMissionIndex = 0;
        this.campaignStarted = false;

        this.loadProgress();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // When a mission completes, unlock the next one
        this.engine.eventBus.on('MISSION_COMPLETE', (data) => {
            this.onMissionComplete(data);
        });

        // Track player choices
        this.engine.eventBus.on('PLAYER_CHOICE_MADE', (data) => {
            const mission = this.missions[this.currentMissionIndex];
            if (mission) {
                mission.playerChoice = data.choice;
                this.saveProgress();
            }
        });
    }

    getCurrentMission() {
        return this.missions[this.currentMissionIndex] || null;
    }

    getMissionById(id) {
        return this.missions.find(m => m.id === id) || null;
    }

    getUnlockedMissions() {
        return this.missions.filter(m => m.unlocked);
    }

    getCompletedMissions() {
        return this.missions.filter(m => m.completed);
    }

    startMission(index) {
        if (index < 0 || index >= this.missions.length) return false;
        const mission = this.missions[index];
        if (!mission.unlocked) return false;

        this.currentMissionIndex = index;
        this.campaignStarted = true;
        this.engine.eventBus.emit('CAMPAIGN_MISSION_START', { mission, index });
        return true;
    }

    onMissionComplete(data) {
        const mission = this.missions[this.currentMissionIndex];
        if (!mission) return;

        mission.completed = true;
        if (data && data.choice) mission.playerChoice = data.choice;

        // Apply consequence branching logic to future missions
        this.applyDecisionConsequences();

        // Unlock next mission
        const nextIndex = this.currentMissionIndex + 1;
        if (nextIndex < this.missions.length) {
            this.missions[nextIndex].unlocked = true;
        }

        this.saveProgress();
        this.engine.eventBus.emit('CAMPAIGN_MISSION_COMPLETE', {
            mission,
            nextMissionIndex: nextIndex < this.missions.length ? nextIndex : null,
        });
    }

    applyDecisionConsequences() {
        const m1 = this.getMissionById('M01');
        const m3 = this.getMissionById('M03');
        const m5 = this.getMissionById('M05');

        if (m1 && m1.completed) {
            if (m1.playerChoice === 'OPTION_A') {
                // Shoot Kabir branch -> Consequence A: Kabir disappears earlier, Tara harder to locate
                if (m3) {
                    m3.briefing[0] = 'Infiltrate terminal following Kabir\'s abrupt elimination in Mission 01.';
                    m3.storyBeats.opening[0].line = 'Inside terminal. With Kabir eliminated, their fallback protocols activated early.';
                }
                if (m5) {
                    m5.briefing[0] = 'Locate Tara in remote village. With Kabir gone, she is hiding deeper in the mountains.';
                    m5.storyBeats.opening[0].line = 'Tara... you\'re alive. After I shot Kabir, your trail almost went cold.';
                }
            } else if (m1.playerChoice === 'OPTION_B') {
                // Observe Kabir branch -> Consequence B: Kabir escapes, extra intel recovered
                if (m3) {
                    m3.briefing[0] = 'Infiltrate terminal using extra tracking telemetry gathered from observing Kabir.';
                    m3.storyBeats.opening[0].line = 'Inside terminal. The telemetry we gathered while observing Kabir brought us straight here.';
                }
                if (m5) {
                    m5.briefing[0] = 'Locate Tara in remote village. Kabir is active nearby at the hidden communications hub.';
                    m5.storyBeats.opening[0].line = 'Tara. You\'re alive. Kabir led me to this sector after I held fire at the compound.';
                }
            }
        }
    }

    getChoiceHistory() {
        return this.missions.map(m => ({
            id: m.id,
            codename: m.codename,
            completed: m.completed,
            choice: m.playerChoice,
        }));
    }

    // Determine final ending based on accumulated choices
    determineFinalEnding() {
        const choices = this.getChoiceHistory();
        let aggressiveCount = 0;
        let protectiveCount = 0;

        for (const c of choices) {
            if (!c.choice) continue;
            if (c.choice === 'OPTION_A' || c.choice === 'ENDING_B') aggressiveCount++;
            if (c.choice === 'OPTION_B' || c.choice === 'ENDING_C') protectiveCount++;
        }

        if (aggressiveCount > protectiveCount) return 'ENDING_B';
        if (protectiveCount > aggressiveCount) return 'ENDING_C';
        return 'ENDING_A';
    }

    // ─── Persistence ──────────────────────────────────────────────────────────

    saveProgress() {
        try {
            const saveData = {
                version: this.meta.version,
                currentMissionIndex: this.currentMissionIndex,
                missions: this.missions.map(m => ({
                    id: m.id,
                    unlocked: m.unlocked,
                    completed: m.completed,
                    playerChoice: m.playerChoice,
                })),
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        } catch (e) {
            console.warn('[CampaignManager] Failed to save progress:', e);
        }
    }

    loadProgress() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!data || !data.missions) return;

            for (const saved of data.missions) {
                const mission = this.missions.find(m => m.id === saved.id);
                if (mission) {
                    mission.unlocked = saved.unlocked;
                    mission.completed = saved.completed;
                    mission.playerChoice = saved.playerChoice;
                }
            }
            this.currentMissionIndex = data.currentMissionIndex || 0;
            console.log('[CampaignManager] Progress loaded.');
        } catch (e) {
            console.warn('[CampaignManager] Failed to load progress:', e);
        }
    }

    resetProgress() {
        try {
            localStorage.removeItem(SAVE_KEY);
        } catch (e) {}
        // Re-initialize
        this.missions = JSON.parse(JSON.stringify(CAMPAIGN_MISSIONS));
        this.currentMissionIndex = 0;
        this.campaignStarted = false;
    }
}

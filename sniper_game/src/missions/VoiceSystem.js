/**
 * VoiceSystem.js
 * Contextual, event-driven voice dialogue dispatcher.
 * Queues lines per character, plays them through RadioDialogueSystem,
 * and handles idle/reaction triggers.
 */

import { CHARACTERS } from '../campaign/CampaignData.js';

export class VoiceSystem {
    constructor(engine) {
        this.engine = engine;
        this.queue = [];             // { char, line, delay }
        this.isPlaying = false;
        this.currentTimeout = null;
        this.idleTimer = 0;
        this.idleThreshold = 45;     // seconds before "idle" lines trigger
        this.lastPlayerActivity = 0;
        this.currentMissionData = null;
        this.firedBeats = new Set(); // Track which story beats have fired

        this.setupEventListeners();
    }

    setMission(missionData) {
        this.currentMissionData = missionData;
        this.firedBeats.clear();
    }

    // ─── Event Listeners ──────────────────────────────────────────────────────

    setupEventListeners() {
        const bus = this.engine.eventBus;

        bus.on('PLAYER_MOVED',         () => this.resetIdleTimer());
        bus.on('PLAYER_SCOPED',        () => this.onPlayerScoped());
        bus.on('TARGET_CONFIRMED',     () => this.onTargetConfirmed());
        bus.on('TARA_APPEARED',        () => this.onTaraAppeared());
        bus.on('COMPOUND_ALERT_LEVEL_CHANGED', (lvl) => this.onAlertChanged(lvl));
        bus.on('PLAYER_HEALTH_CHANGED', (pct) => this.onPlayerInjured(pct));
        bus.on('PLAYER_EXTRACTED',     () => this.onExtracted());
    }

    resetIdleTimer() {
        this.idleTimer = 0;
        this.lastPlayerActivity = performance.now();
    }

    // ─── Story Beat Playback ──────────────────────────────────────────────────

    /**
     * Play a named story beat (array of { char, line, delay })
     * Each beat can only fire once per mission.
     */
    playBeat(beatName) {
        if (!this.currentMissionData || this.firedBeats.has(beatName)) return;
        const beats = this.currentMissionData.storyBeats?.[beatName];
        if (!beats || beats.length === 0) return;

        this.firedBeats.add(beatName);
        for (const entry of beats) {
            this.scheduleSpeak(entry.char, entry.line, entry.delay);
        }
    }

    /**
     * Queue a list of lines immediately (for programmatic use)
     */
    playLines(lines) {
        for (const entry of lines) {
            this.scheduleSpeak(entry.char, entry.line, entry.delay || 0);
        }
    }

    scheduleSpeak(charKey, line, delayMs) {
        setTimeout(() => {
            this.speak(charKey, line);
        }, delayMs);
    }

    /**
     * Speak a single line through RadioDialogueSystem.
     * charKey is a key from CHARACTERS (e.g., 'IMRAN', 'MEERA').
     */
    speak(charKey, line) {
        const charInfo = CHARACTERS[charKey] || CHARACTERS.SYSTEM;
        const radio = this.engine.missionManager?.radioSystem;
        if (!radio) return;

        // Estimate duration from line length (min 2.5s, max 7s)
        const duration = Math.min(7.0, Math.max(2.5, line.length * 0.065));
        radio.speak(charInfo.name, line, duration, charInfo.color);
    }

    // ─── Contextual Reaction Lines ────────────────────────────────────────────

    onPlayerScoped() {
        if (!this.currentMissionData) return;
        const lines = this.currentMissionData.contextualLines?.scopeZoomMax;
        if (lines && lines.length > 0 && !this.firedBeats.has('scopeZoomMax_contextual')) {
            this.firedBeats.add('scopeZoomMax_contextual');
            const pick = lines[Math.floor(Math.random() * lines.length)];
            this.speak(pick.char, pick.line);
        }
    }

    onTargetConfirmed() {
        this.playBeat('targetConfirmed');
        // Slight delay then trigger Tara
        setTimeout(() => {
            this.engine.eventBus.emit('TARA_APPEARED');
        }, 5000);
    }

    onTaraAppeared() {
        this.playBeat('taraAppears');
    }

    onAlertChanged(level) {
        if (level === 'alerted' || level === 'detected') {
            this.playBeat('compoundAlert');
            const lines = this.currentMissionData?.contextualLines?.enemyAlerted;
            if (lines && !this.firedBeats.has('enemyAlerted_contextual')) {
                this.firedBeats.add('enemyAlerted_contextual');
                const pick = lines[Math.floor(Math.random() * lines.length)];
                setTimeout(() => this.speak(pick.char, pick.line), 3500);
            }
        }
    }

    onPlayerInjured(hpPct) {
        if (hpPct < 50 && !this.firedBeats.has('injuredLow')) {
            this.firedBeats.add('injuredLow');
            const lines = this.currentMissionData?.contextualLines?.playerInjured;
            if (lines) {
                const pick = lines[Math.floor(Math.random() * lines.length)];
                this.speak(pick.char, pick.line);
            }
        }
    }

    onExtracted() {
        this.playBeat('extractionReached');
    }

    // ─── Update Loop ──────────────────────────────────────────────────────────

    update(dt) {
        this.idleTimer += dt;

        if (this.idleTimer > this.idleThreshold) {
            this.idleTimer = 0;
            this.triggerIdleLine();
        }
    }

    triggerIdleLine() {
        if (!this.currentMissionData) return;
        const lines = this.currentMissionData.contextualLines?.playerIdleTooLong;
        if (!lines || lines.length === 0) return;

        // Rotate through lines
        if (!this._idleLineIndex) this._idleLineIndex = 0;
        const pick = lines[this._idleLineIndex % lines.length];
        this._idleLineIndex++;
        this.speak(pick.char, pick.line);
    }
}

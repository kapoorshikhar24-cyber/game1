export class AudioManager {
    constructor(engine) {
        this.engine = engine;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Volume Categories
        this.volumes = {
            MASTER: 1.0,
            SFX: 1.0,
            WEAPON: 1.0,
            ENVIRONMENT: 0.7,
            UI: 1.0,
            VOICE: 1.0,
            MUSIC: 0.8
        };

        // Category Gain Nodes
        this.gains = {};
        this.initGainNodes();

        // Noise Buffer Cache
        this.noiseBuffers = {};
        this.initNoiseBuffers();

        // Ambient Wind Loop
        this.windSource = null;
        this.windGain = null;

        this.setupEventListeners();
    }

    initGainNodes() {
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volumes.MASTER, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);

        const categories = ['SFX', 'WEAPON', 'ENVIRONMENT', 'UI', 'VOICE', 'MUSIC'];
        for (let cat of categories) {
            let gainNode = this.audioCtx.createGain();
            gainNode.gain.setValueAtTime(this.volumes[cat], this.audioCtx.currentTime);
            gainNode.connect(this.masterGain);
            this.gains[cat] = gainNode;
        }
    }

    setVolume(category, value) {
        let val = Math.max(0, Math.min(1, value));
        this.volumes[category] = val;

        if (category === 'MASTER' && this.masterGain) {
            this.masterGain.gain.setValueAtTime(val, this.audioCtx.currentTime);
        } else if (this.gains[category]) {
            this.gains[category].gain.setValueAtTime(val, this.audioCtx.currentTime);
        }
    }

    initNoiseBuffers() {
        const sr = this.audioCtx.sampleRate;
        const dur = 2.0;
        const buffer = this.audioCtx.createBuffer(1, sr * dur, sr);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < sr * dur; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffers['white'] = buffer;
    }

    ensureContext() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    setupEventListeners() {
        this.engine.eventBus.on('WEAPON_FIRED', (data) => this.playWeaponFire(data.position, data.weapon));
        this.engine.eventBus.on('BOLT_CYCLE_START', () => this.playBoltAction());
        this.engine.eventBus.on('WEAPON_RELOAD_START', () => this.playReload());
        this.engine.eventBus.on('SURFACE_HIT', (data) => this.playBulletImpact(data.point, data.matType));
        this.engine.eventBus.on('BULLET_IMPACT', (data) => this.playBulletImpact(data.point, 'flesh'));
        this.engine.eventBus.on('GUARD_ALERTED', (data) => this.playEnemyAlert(data.position));
        this.engine.eventBus.on('MISSION_COMPLETED', () => this.playMissionComplete());
        this.engine.eventBus.on('WIND_UPDATED', (data) => this.updateAmbientWind(data.speed));
    }

    createPanner(pos) {
        if (!pos) return null;
        let panner = this.audioCtx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 8;
        panner.maxDistance = 250;
        panner.rolloffFactor = 1;
        panner.setPosition(pos.x, pos.y, pos.z);
        return panner;
    }

    playWeaponFire(position, weapon) {
        this.ensureContext();

        let isSuppressed = weapon ? weapon.name.includes("Suppressed") : false;

        const src = this.audioCtx.createBufferSource();
        src.buffer = this.noiseBuffers['white'];

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = isSuppressed ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(isSuppressed ? 700 : 1800, this.audioCtx.currentTime);

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(isSuppressed ? 0.35 : 1.6, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + (isSuppressed ? 0.2 : 0.45));

        src.connect(filter);

        let panner = this.createPanner(position);
        if (panner) {
            filter.connect(panner);
            panner.connect(this.gains.WEAPON);
        } else {
            filter.connect(this.gains.WEAPON);
        }

        src.start();
        src.stop(this.audioCtx.currentTime + 0.45);
    }

    playBoltAction() {
        this.ensureContext();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.audioCtx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.gains.WEAPON);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.15);
    }

    playReload() {
        this.ensureContext();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, this.audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(180, this.audioCtx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.gains.WEAPON);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.25);
    }

    playBulletImpact(position, matType = 'stone') {
        this.ensureContext();

        const src = this.audioCtx.createBufferSource();
        src.buffer = this.noiseBuffers['white'];

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = matType === 'flesh' ? 'lowpass' : 'highpass';
        filter.frequency.setValueAtTime(matType === 'flesh' ? 400 : 2500, this.audioCtx.currentTime);

        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.12);

        src.connect(filter);
        let panner = this.createPanner(position);
        if (panner) {
            filter.connect(panner);
            panner.connect(this.gains.SFX);
        } else {
            filter.connect(this.gains.SFX);
        }

        src.start();
        src.stop(this.audioCtx.currentTime + 0.12);
    }

    playBulletFlyby(position) {
        this.ensureContext();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.audioCtx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

        osc.connect(gain);
        let panner = this.createPanner(position);
        if (panner) {
            gain.connect(panner);
            panner.connect(this.gains.SFX);
        } else {
            gain.connect(this.gains.SFX);
        }

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.08);
    }

    playEnemyAlert(position) {
        this.ensureContext();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(650, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

        osc.connect(gain);
        let panner = this.createPanner(position);
        if (panner) {
            gain.connect(panner);
            panner.connect(this.gains.VOICE);
        } else {
            gain.connect(this.gains.VOICE);
        }

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.2);
    }

    playUISound(type = 'click') {
        this.ensureContext();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(type === 'click' ? 1200 : 800, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.gains.UI);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.04);
    }

    playMissionComplete() {
        this.ensureContext();

        let notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            let osc = this.audioCtx.createOscillator();
            let gain = this.audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + idx * 0.12);

            gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + idx * 0.12 + 0.4);

            osc.connect(gain);
            gain.connect(this.gains.MUSIC);

            osc.start(this.audioCtx.currentTime + idx * 0.12);
            osc.stop(this.audioCtx.currentTime + idx * 0.12 + 0.4);
        });
    }

    updateAmbientWind(windSpeed = 5) {
        if (!this.windGain) {
            this.ensureContext();
            const src = this.audioCtx.createBufferSource();
            src.buffer = this.noiseBuffers['white'];
            src.loop = true;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, this.audioCtx.currentTime);

            this.windGain = this.audioCtx.createGain();
            this.windGain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);

            src.connect(filter);
            filter.connect(this.windGain);
            this.windGain.connect(this.gains.ENVIRONMENT);

            src.start();
            this.windSource = src;
        }

        let targetGain = Math.min(0.4, 0.05 + windSpeed * 0.02);
        this.windGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.5);
    }
}

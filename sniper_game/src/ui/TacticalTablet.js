/**
 * TacticalTablet.js
 * In-game tactical device with 5 tabs:
 *   MAP | INTELLIGENCE | OBJECTIVES | TARGET | COMMS
 * Toggle with [T]. Styled as a physical device.
 */

export class TacticalTablet {
    constructor(engine) {
        this.engine = engine;
        this.isOpen = false;
        this.activeTab = 'OBJECTIVES';
        this.intelLog = [];      // Collected intel items
        this.commsLog = [];      // All radio transmissions
        this.el = null;
        this.missionData = null;
        this.objectivesCache = { primary: [], optional: [] };

        this._buildUI();
        this._setupEvents();
        this._injectStyles();
    }

    setMission(missionData) {
        this.missionData = missionData;
        this.intelLog = [];
        this.commsLog = [];
        this._refreshAllTabs();
    }

    // ─── Event Listeners ─────────────────────────────────────────────────────

    _setupEvents() {
        const bus = this.engine.eventBus;

        bus.on('OBJECTIVE_COMPLETED', (data) => this._onObjectiveUpdate(data));
        bus.on('OBJECTIVE_FAILED',    (data) => this._onObjectiveUpdate(data));
        bus.on('INTEL_COLLECTED',     (item) => this._addIntel(item));
        bus.on('RADIO_SPOKEN',        (entry) => this._logComms(entry));

        // [T] key
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyT' && this.engine.stateManager?.is('PLAYING')) {
                this.toggle();
            }
        });
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        if (!this.el) return;
        this.isOpen = true;
        this.el.style.display = 'flex';
        requestAnimationFrame(() => {
            this.el.style.opacity = '1';
            this.el.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        this._refreshAllTabs();
        this._playOpenSound();

        // Pause player look (not movement)
        const player = this.engine.playerManager?.player;
        if (player && player.controls) player.controls.unlock();
    }

    close() {
        if (!this.el) return;
        this.isOpen = false;
        this.el.style.opacity = '0';
        this.el.style.transform = 'translate(-50%, -50%) scale(0.96)';
        this._playCloseSound();
        setTimeout(() => {
            if (!this.isOpen && this.el) this.el.style.display = 'none';
        }, 300);

        // Re-lock controls
        const player = this.engine.playerManager?.player;
        if (player && player.controls) {
            try { player.controls.lock(); } catch(e) {}
        }
    }

    _playOpenSound() {
        try {
            const ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (!window.audioCtx) window.audioCtx = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;

            // Chime 1
            const osc1 = ctx.createOscillator();
            const g1 = ctx.createGain();
            osc1.type = 'sine'; osc1.frequency.setValueAtTime(600, now); osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
            g1.gain.setValueAtTime(0.08, now); g1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc1.connect(g1); g1.connect(ctx.destination);
            osc1.start(now); osc1.stop(now + 0.08);

            // Chime 2
            const osc2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            osc2.type = 'sine'; osc2.frequency.setValueAtTime(1200, now + 0.05); osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
            g2.gain.setValueAtTime(0.08, now + 0.05); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc2.connect(g2); g2.connect(ctx.destination);
            osc2.start(now + 0.05); osc2.stop(now + 0.14);
        } catch(e) {}
    }

    _playCloseSound() {
        try {
            const ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (!window.audioCtx) window.audioCtx = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(1400, now); osc.frequency.exponentialRampToValueAtTime(500, now + 0.09);
            g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.connect(g); g.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.09);
        } catch(e) {}
    }

    _playTabSound() {
        try {
            const ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            if (!window.audioCtx) window.audioCtx = ctx;
            if (ctx.state === 'suspended') ctx.resume();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(950, now);
            g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(g); g.connect(ctx.destination);
            osc.start(now); osc.stop(now + 0.04);
        } catch(e) {}
    }


    // ─── UI Construction ──────────────────────────────────────────────────────

    _buildUI() {
        const div = document.createElement('div');
        div.id = 'tactical-tablet';
        div.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.96);
            width: min(820px, 92vw);
            height: min(580px, 88vh);
            background: #0a100d;
            border: 2px solid #1e3a2a;
            border-radius: 16px;
            box-shadow:
                0 0 0 1px #0f1f16,
                0 0 60px rgba(0,0,0,0.95),
                inset 0 1px 0 rgba(255,255,255,0.04);
            display: none;
            flex-direction: column;
            font-family: 'Share Tech Mono', monospace;
            z-index: 200;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            overflow: hidden;
        `;

        div.innerHTML = `
            <!-- Device Header -->
            <div style="
                background: linear-gradient(180deg, #0d1a12 0%, #0a1210 100%);
                border-bottom: 1px solid #1e3a2a;
                padding: 10px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                        width: 32px; height: 32px;
                        background: #0f2018;
                        border: 1px solid #22c55e;
                        border-radius: 6px;
                        display: flex; align-items: center; justify-content: center;
                    ">
                        <svg viewBox="0 0 16 16" width="18" height="18">
                            <circle cx="8" cy="8" r="6" fill="none" stroke="#22c55e" stroke-width="1.2"/>
                            <line x1="8" y1="2" x2="8" y2="14" stroke="#22c55e" stroke-width="0.8"/>
                            <line x1="2" y1="8" x2="14" y2="8" stroke="#22c55e" stroke-width="0.8"/>
                        </svg>
                    </div>
                    <div>
                        <div style="color: #22c55e; font-size: 0.65rem; letter-spacing: 3px; opacity: 0.7;">GARUDA-5 TACTICAL SYSTEMS</div>
                        <div id="tablet-mission-title" style="color: #fff; font-size: 0.82rem; letter-spacing: 2px;">OPERATION: TRISHUL SHADOW</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="text-align: right;">
                        <div style="color: #22c55e; font-size: 0.62rem; letter-spacing: 2px;" id="tablet-phase">PHASE 01 — APPROACH</div>
                        <div style="color: #9ca3af; font-size: 0.62rem;" id="tablet-status">STATUS: ACTIVE</div>
                    </div>
                    <button id="tablet-close-btn" style="
                        background: rgba(239,68,68,0.15);
                        border: 1px solid rgba(239,68,68,0.4);
                        color: #ef4444;
                        font-family: 'Share Tech Mono', monospace;
                        font-size: 0.7rem;
                        padding: 4px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        letter-spacing: 1px;
                    ">[ T ] CLOSE</button>
                </div>
            </div>

            <!-- Tab Bar -->
            <div id="tablet-tab-bar" style="
                display: flex;
                background: #090e0c;
                border-bottom: 1px solid #1e3a2a;
                flex-shrink: 0;
            ">
                ${['MAP','INTELLIGENCE','OBJECTIVES','TARGET','COMMS'].map(tab => `
                    <button class="tablet-tab" data-tab="${tab}" style="
                        flex: 1;
                        background: none;
                        border: none;
                        border-bottom: 2px solid transparent;
                        color: #4b5563;
                        font-family: 'Share Tech Mono', monospace;
                        font-size: 0.7rem;
                        letter-spacing: 2px;
                        padding: 10px 4px;
                        cursor: pointer;
                        transition: color 0.2s, border-color 0.2s;
                    ">${tab}</button>
                `).join('')}
            </div>

            <!-- Tab Content -->
            <div id="tablet-content" style="
                flex: 1;
                overflow: auto;
                padding: 0;
                position: relative;
            ">
                <!-- MAP tab -->
                <div id="tab-MAP" class="tablet-panel" style="display:none; padding: 20px;">
                    ${this._buildMapPanel()}
                </div>

                <!-- INTELLIGENCE tab -->
                <div id="tab-INTELLIGENCE" class="tablet-panel" style="display:none; padding: 20px;">
                    <div id="intel-list" style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="color: #4b5563; font-size: 0.8rem; text-align: center; padding: 30px;">
                            No intelligence collected yet.<br>
                            <span style="opacity:0.6;">Investigate highlighted objects to gather intel.</span>
                        </div>
                    </div>
                </div>

                <!-- OBJECTIVES tab -->
                <div id="tab-OBJECTIVES" class="tablet-panel" style="display:none; padding: 20px;">
                    <div style="color: #f59e0b; font-size: 0.7rem; letter-spacing: 3px; margin-bottom: 14px;">PRIMARY OBJECTIVES</div>
                    <div id="tablet-primary-objectives" style="display: flex; flex-direction: column; gap: 8px;"></div>
                    <div style="color: #4b5563; font-size: 0.7rem; letter-spacing: 3px; margin: 20px 0 14px 0;">OPTIONAL OBJECTIVES</div>
                    <div id="tablet-optional-objectives" style="display: flex; flex-direction: column; gap: 8px;"></div>
                </div>

                <!-- TARGET tab -->
                <div id="tab-TARGET" class="tablet-panel" style="display:none; padding: 20px;">
                    ${this._buildTargetPanel()}
                </div>

                <!-- COMMS tab -->
                <div id="tab-COMMS" class="tablet-panel" style="display:none; padding: 20px;">
                    <div style="color: #22c55e; font-size: 0.7rem; letter-spacing: 3px; margin-bottom: 14px;">TRANSMISSION LOG — CURRENT MISSION</div>
                    <div id="comms-log" style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="color: #4b5563; font-size: 0.8rem; text-align: center; padding: 20px;">
                            No transmissions recorded yet.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Device Footer -->
            <div style="
                background: #090e0c;
                border-top: 1px solid #1e3a2a;
                padding: 7px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            ">
                <div style="color: #374151; font-size: 0.62rem; letter-spacing: 2px;">
                    CAPT. ARJUN RATHORE · RECON UNIT
                </div>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 4px #22c55e;"></div>
                    <div style="color: #22c55e; font-size: 0.6rem; letter-spacing: 2px;">SECURE COMMS ACTIVE</div>
                </div>
                <div style="color: #374151; font-size: 0.62rem;">
                    GARUDA-5 v2.1
                </div>
            </div>
        `;

        (document.getElementById('game-container') || document.body).appendChild(div);
        this.el = div;

        // Close button
        div.querySelector('#tablet-close-btn').addEventListener('click', () => this.close());

        // Tab clicks
        div.querySelectorAll('.tablet-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Set initial active tab
        this.switchTab('OBJECTIVES');
    }

    switchTab(tabName) {
        if (this.activeTab !== tabName && this.isOpen) {
            this._playTabSound();
        }
        this.activeTab = tabName;

        document.querySelectorAll('.tablet-tab').forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            btn.style.color = isActive ? '#22c55e' : '#4b5563';
            btn.style.borderBottomColor = isActive ? '#22c55e' : 'transparent';
            btn.style.background = isActive ? 'rgba(34,197,94,0.06)' : 'none';
        });


        document.querySelectorAll('.tablet-panel').forEach(panel => {
            panel.style.display = panel.id === `tab-${tabName}` ? 'block' : 'none';
        });

        if (tabName === 'OBJECTIVES') this._refreshObjectives();
        if (tabName === 'TARGET') this._refreshTarget();
        if (tabName === 'MAP') this._refreshMap();
    }

    // ─── Tab content builders ─────────────────────────────────────────────────

    _buildMapPanel() {
        return `
            <div style="color: #f59e0b; font-size: 0.7rem; letter-spacing: 3px; margin-bottom: 16px;">TACTICAL AREA MAP</div>
            <div style="
                position: relative;
                background: #050e08;
                border: 1px solid #1e3a2a;
                border-radius: 8px;
                height: 340px;
                overflow: hidden;
            ">
                <!-- Grid overlay -->
                <div style="
                    position: absolute; inset: 0;
                    background-image:
                        linear-gradient(rgba(34,197,94,0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(34,197,94,0.05) 1px, transparent 1px);
                    background-size: 40px 40px;
                "></div>
                <!-- Compass -->
                <div style="position:absolute; top:10px; right:12px; color:#22c55e; font-size:0.65rem; opacity:0.7; text-align:center;">
                    N<br>↑
                </div>
                <!-- Map content label -->
                <div id="map-canvas-container" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
                    <div id="map-elements" style="position:relative; width:100%; height:100%;">
                        <!-- Dynamic markers injected here -->
                        <!-- Player marker (updated in _refreshMap) -->
                        <div id="map-player-dot" style="
                            position:absolute; left:50%; top:75%;
                            width:10px; height:10px;
                            background:#60a5fa; border-radius:50%;
                            box-shadow: 0 0 8px #60a5fa;
                            transform: translate(-50%, -50%);
                        " title="Your Position"></div>
                        <!-- Compound marker -->
                        <div style="
                            position:absolute; left:50%; top:20%;
                            transform:translate(-50%,-50%);
                            text-align:center;
                        ">
                            <div style="width:14px;height:14px;background:rgba(239,68,68,0.3);border:1px solid #ef4444;border-radius:2px;margin:auto;"></div>
                            <div style="color:#ef4444;font-size:0.55rem;margin-top:3px;letter-spacing:1px;">COMPOUND</div>
                        </div>
                        <!-- Extraction marker -->
                        <div style="
                            position:absolute; left:50%; top:92%;
                            transform:translate(-50%,-50%);
                            text-align:center;
                        ">
                            <div style="width:12px;height:12px;background:rgba(34,197,94,0.2);border:1px solid #22c55e;border-radius:50%;margin:auto;"></div>
                            <div style="color:#22c55e;font-size:0.55rem;margin-top:3px;letter-spacing:1px;">EXTRACT</div>
                        </div>
                    </div>
                </div>
                <!-- Scale bar -->
                <div style="position:absolute;bottom:10px;left:14px;display:flex;align-items:center;gap:6px;">
                    <div style="width:40px;height:2px;background:#22c55e;opacity:0.5;"></div>
                    <div style="color:#22c55e;font-size:0.6rem;opacity:0.6;">100m</div>
                </div>
            </div>
            <div style="margin-top:12px; display:flex; gap:20px; font-size:0.65rem; color:#4b5563;">
                <span><span style="color:#60a5fa;">●</span> Your Position</span>
                <span><span style="color:#ef4444;">■</span> Enemy Compound</span>
                <span><span style="color:#22c55e;">●</span> Extraction</span>
                <span><span style="color:#f59e0b;">◇</span> Objective</span>
            </div>
        `;
    }

    _buildTargetPanel() {
        return `
            <div id="target-panel-content">
                <div style="color: #4b5563; font-size: 0.8rem; text-align: center; padding: 40px;">
                    No target profile loaded.
                </div>
            </div>
        `;
    }

    _refreshObjectives() {
        const primEl = document.getElementById('tablet-primary-objectives');
        const optEl  = document.getElementById('tablet-optional-objectives');
        if (!primEl || !optEl) return;

        const om = this.engine.objectiveManager;
        const primary  = om?.objectives?.primary  || [];
        const optional = om?.objectives?.optional || [];

        primEl.innerHTML = primary.map(obj => this._objectiveRow(obj, false)).join('') ||
            '<div style="color:#4b5563;font-size:0.8rem;">No primary objectives.</div>';

        optEl.innerHTML = optional.map(obj => this._objectiveRow(obj, true)).join('') ||
            '<div style="color:#4b5563;font-size:0.8rem;">No optional objectives.</div>';
    }

    _objectiveRow(obj, isOptional) {
        const done   = obj.completed;
        const failed = obj.failed;
        let icon  = '□';
        let color = '#9ca3af';
        if (done && !failed)   { icon = '✓'; color = '#22c55e'; }
        if (failed)            { icon = '✗'; color = '#ef4444'; }

        return `
            <div style="
                display: flex; align-items: flex-start; gap: 12px;
                padding: 10px 12px;
                background: rgba(255,255,255,0.02);
                border: 1px solid ${done && !failed ? '#1a3028' : failed ? '#3a1818' : '#1a2020'};
                border-left: 3px solid ${color};
                border-radius: 4px;
                opacity: ${failed ? '0.6' : '1'};
            ">
                <span style="color:${color}; font-size: 1rem; flex-shrink:0; margin-top:1px;">${icon}</span>
                <div>
                    <div style="color: ${done && !failed ? '#22c55e' : failed ? '#ef4444' : '#e5e7eb'}; font-size: 0.8rem; letter-spacing: 1px;">
                        ${isOptional ? '<span style="color:#f59e0b; font-size:0.65rem;">[OPTIONAL]</span> ' : ''}${obj.title}
                    </div>
                    <div style="color: #6b7280; font-size: 0.72rem; margin-top: 3px; line-height: 1.4;">${obj.desc || ''}</div>
                </div>
            </div>
        `;
    }

    _refreshTarget() {
        const el = document.getElementById('target-panel-content');
        if (!el) return;

        const profile = this.missionData?.targetProfile;
        if (!profile) {
            el.innerHTML = '<div style="color:#4b5563;font-size:0.8rem;padding:40px;text-align:center;">No target profile loaded.</div>';
            return;
        }

        const threatColors = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e', CRITICAL: '#dc2626', UNKNOWN: '#9ca3af' };
        const tc = threatColors[profile.threat] || '#9ca3af';
        const statusColors = { 'ACTIVE': '#ef4444', 'LOCATED': '#f59e0b', 'NEUTRALIZED': '#22c55e', 'MISSING': '#9ca3af' };
        const sc = statusColors[profile.status?.split(' ')[0]] || '#9ca3af';

        el.innerHTML = `
            <div style="color: #f59e0b; font-size: 0.7rem; letter-spacing: 3px; margin-bottom: 16px;">TARGET INTELLIGENCE FILE</div>
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <!-- Target Card -->
                <div style="
                    background: #050e08;
                    border: 1px solid #1e3a2a;
                    border-radius: 8px;
                    padding: 20px;
                    flex: 1;
                    min-width: 200px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                ">
                    <!-- Silhouette placeholder -->
                    <div style="
                        position: relative;
                        width: 100px;
                        height: 120px;
                        overflow: hidden;
                        background: #05140b;
                        border: 1px solid #22c55e;
                        border-radius: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 16px;
                    ">
                        <!-- Scanning line -->
                        <div style="position: absolute; left: 0; right: 0; height: 2px; background: #22c55e; opacity: 0.8; box-shadow: 0 0 8px #22c55e; animation: scanLine 2.5s linear infinite; z-index: 3;"></div>
                        <!-- Crosshair overlay -->
                        <div style="position: absolute; width: 8px; height: 8px; border: 1px solid rgba(34,197,94,0.4); border-radius: 50%; z-index: 2;"></div>
                        <div style="position: absolute; width: 24px; height: 1px; background: rgba(34,197,94,0.3); z-index: 2;"></div>
                        <div style="position: absolute; width: 1px; height: 24px; background: rgba(34,197,94,0.3); z-index: 2;"></div>
                        
                        <svg viewBox="0 0 50 70" width="80" height="110" style="opacity: 0.85; position: relative; z-index: 1;">
                            <defs>
                                <radialGradient id="thermal-grad" cx="50%" cy="30%" r="50%">
                                    <stop offset="0%" stop-color="#ff3b30"/>
                                    <stop offset="45%" stop-color="#ffcc00"/>
                                    <stop offset="70%" stop-color="#34c759"/>
                                    <stop offset="100%" stop-color="#007aff"/>
                                </radialGradient>
                            </defs>
                            <path d="M25,5 C28,5 31,8 31,14 C31,20 28,23 25,23 C22,23 19,20 19,14 C19,8 22,5 25,5 Z" fill="url(#thermal-grad)"/>
                            <path d="M12,28 C15,24 20,24 25,24 C30,24 35,24 38,28 L42,65 H8 Z" fill="url(#thermal-grad)"/>
                            
                            <!-- Brackets -->
                            <path d="M5,15 L5,5 L15,5" fill="none" stroke="#22c55e" stroke-width="0.8"/>
                            <path d="M45,15 L45,5 L35,5" fill="none" stroke="#22c55e" stroke-width="0.8"/>
                            <path d="M5,55 L5,65 L15,65" fill="none" stroke="#22c55e" stroke-width="0.8"/>
                            <path d="M45,55 L45,65 L35,65" fill="none" stroke="#22c55e" stroke-width="0.8"/>
                        </svg>
                    </div>
                    <div style="text-align:center;">
                        <div style="color:#ef4444; font-size:1rem; letter-spacing:2px;">${profile.name}</div>
                        <div style="color:#9ca3af; font-size:0.7rem; margin-top:4px;">${profile.alias}</div>
                    </div>
                </div>

                <!-- Stats -->
                <div style="flex: 2; min-width: 260px; display: flex; flex-direction: column; gap: 10px;">
                    ${[
                        ['THREAT LEVEL', profile.threat, tc],
                        ['STATUS', profile.status, sc],
                    ].map(([label, value, color]) => `
                        <div style="
                            padding: 8px 12px;
                            background: rgba(255,255,255,0.02);
                            border: 1px solid #1e3a2a;
                            border-radius: 4px;
                            display: flex; justify-content: space-between; align-items: center;
                        ">
                            <span style="color:#4b5563; font-size:0.7rem; letter-spacing:2px;">${label}</span>
                            <span style="color:${color}; font-size:0.78rem; font-weight:bold;">${value}</span>
                        </div>
                    `).join('')}

                    <div style="
                        padding: 12px;
                        background: rgba(255,255,255,0.02);
                        border: 1px solid #1e3a2a;
                        border-radius: 4px;
                    ">
                        <div style="color:#4b5563; font-size:0.65rem; letter-spacing:2px; margin-bottom:6px;">DESCRIPTION</div>
                        <div style="color:#d1d5db; font-size:0.78rem; line-height:1.5;">${profile.description}</div>
                    </div>
                    <div style="
                        padding: 12px;
                        background: rgba(234,179,8,0.04);
                        border: 1px solid #3a2e00;
                        border-radius: 4px;
                    ">
                        <div style="color:#f59e0b; font-size:0.65rem; letter-spacing:2px; margin-bottom:6px;">ANALYST NOTES</div>
                        <div style="color:#d1d5db; font-size:0.78rem; line-height:1.5;">${profile.notes}</div>
                    </div>
                </div>
            </div>
        `;
    }

    _refreshMap() {
        const missionTitle = document.getElementById('tablet-mission-title');
        if (missionTitle && this.missionData) missionTitle.innerText = this.missionData.title;

        const phaseEl = document.getElementById('tablet-phase');
        if (phaseEl && this.engine.missionManager) {
            phaseEl.innerText = this.engine.missionManager.phase || '';
        }
    }

    _refreshAllTabs() {
        this._refreshObjectives();
        this._refreshTarget();
        this._refreshMap();
        this._refreshCommsLog();

        const missionTitle = document.getElementById('tablet-mission-title');
        if (missionTitle && this.missionData) missionTitle.innerText = this.missionData.title;
    }

    // ─── Intel & Comms Logging ─────────────────────────────────────────────────

    _addIntel(item) {
        this.intelLog.push({ ...item, timestamp: Date.now() });
        this._refreshIntelList();
    }

    _logComms(entry) {
        this.commsLog.push({ ...entry, timestamp: Date.now() });
        if (this.isOpen && this.activeTab === 'COMMS') {
            this._refreshCommsLog();
        }
    }

    _refreshIntelList() {
        if (!this.isOpen || this.activeTab !== 'INTELLIGENCE') return;
        const el = document.getElementById('intel-list');
        if (!el) return;
        if (this.intelLog.length === 0) {
            el.innerHTML = '<div style="color:#4b5563;font-size:0.8rem;text-align:center;padding:30px;">No intelligence collected yet.</div>';
            return;
        }
        el.innerHTML = this.intelLog.map(item => `
            <div style="
                padding: 12px;
                background: rgba(34,197,94,0.04);
                border: 1px solid #1a3028;
                border-left: 3px solid #22c55e;
                border-radius: 4px;
            ">
                <div style="color:#22c55e; font-size:0.72rem; letter-spacing:2px;">${item.title || 'INTEL'}</div>
                <div style="color:#d1d5db; font-size:0.78rem; margin-top:5px; line-height:1.4;">${item.text || ''}</div>
            </div>
        `).join('');
    }

    _refreshCommsLog() {
        const el = document.getElementById('comms-log');
        if (!el) return;
        if (this.commsLog.length === 0) {
            el.innerHTML = '<div style="color:#4b5563;font-size:0.8rem;text-align:center;padding:20px;">No transmissions recorded yet.</div>';
            return;
        }
        el.innerHTML = this.commsLog.map(entry => `
            <div style="
                padding: 8px 12px;
                background: rgba(255,255,255,0.02);
                border-bottom: 1px solid #1a2020;
            ">
                <div style="color:${entry.color || '#d97706'}; font-size:0.68rem; letter-spacing:2px;">${entry.speaker}</div>
                <div style="color:#d1d5db; font-size:0.8rem; margin-top:3px;">"${entry.text}"</div>
            </div>
        `).join('');
        // Scroll to bottom
        el.scrollTop = el.scrollHeight;
    }

    // ─── Objective event handlers ─────────────────────────────────────────────

    _onObjectiveUpdate() {
        if (this.isOpen && this.activeTab === 'OBJECTIVES') {
            this._refreshObjectives();
        }
    }

    // ─── Styles ──────────────────────────────────────────────────────────────

    _injectStyles() {
        if (document.getElementById('tablet-styles')) return;
        const style = document.createElement('style');
        style.id = 'tablet-styles';
        style.textContent = `
            #tactical-tablet ::-webkit-scrollbar { width: 4px; }
            #tactical-tablet ::-webkit-scrollbar-track { background: #0a100d; }
            #tactical-tablet ::-webkit-scrollbar-thumb { background: #1e3a2a; border-radius: 2px; }
            .tablet-tab:hover { color: #9ca3af !important; background: rgba(34,197,94,0.03) !important; }
            @keyframes scanLine {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
            }
        `;
        document.head.appendChild(style);
    }
}

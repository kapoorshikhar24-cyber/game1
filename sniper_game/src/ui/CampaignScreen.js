/**
 * CampaignScreen.js
 * Full-screen India campaign map with 10 mission selector.
 * Shown after Mission 1 completes, or via "CAMPAIGN" button on main menu.
 */

import { CAMPAIGN_MISSIONS } from '../campaign/CampaignData.js';

// Geographic positions on the India map (% from top-left of map container)
const MISSION_MAP_POS = [
    { top: '18%', left: '38%' }, // M01 — Himalayan
    { top: '14%', left: '42%' }, // M02 — Mountain Pass
    { top: '16%', left: '45%' }, // M03 — Relay Station
    { top: '22%', left: '36%' }, // M04 — Settlement
    { top: '42%', left: '22%' }, // M05 — Desert
    { top: '52%', left: '48%' }, // M06 — Urban
    { top: '55%', left: '52%' }, // M07 — Intel Compound
    { top: '36%', left: '74%' }, // M08 — Jungle NE
    { top: '48%', left: '38%' }, // M09 — Unknown
    { top: '50%', left: '42%' }, // M10 — Facility
];

export class CampaignScreen {
    constructor(engine) {
        this.engine = engine;
        this.isOpen = false;
        this.selectedMission = null;
        this.el = null;
        this.missions = null; // Set from CampaignManager

        this._buildUI();
        this._setupEvents();
    }

    setMissions(missions) {
        this.missions = missions;
        if (this.isOpen) this._refreshMissions();
    }

    open(missions) {
        if (missions) this.missions = missions;
        if (!this.el) return;
        this.isOpen = true;
        this.el.style.display = 'flex';
        requestAnimationFrame(() => {
            this.el.style.opacity = '1';
        });
        this._refreshMissions();
        this._selectMission(this.missions?.find(m => !m.completed && m.unlocked) || this.missions?.[0]);
    }

    close() {
        if (!this.el) return;
        this.isOpen = false;
        this.el.style.opacity = '0';
        setTimeout(() => {
            if (!this.isOpen && this.el) this.el.style.display = 'none';
        }, 350);
    }

    _setupEvents() {
        this.engine.eventBus.on('CAMPAIGN_MISSION_COMPLETE', () => {
            if (this.engine.campaignManager) {
                this.missions = this.engine.campaignManager.missions;
            }
        });
    }

    _buildUI() {
        const div = document.createElement('div');
        div.id = 'campaign-screen';
        div.style.cssText = `
            position: absolute;
            inset: 0;
            background: #040a06;
            display: none;
            flex-direction: column;
            font-family: 'Share Tech Mono', monospace;
            z-index: 150;
            opacity: 0;
            transition: opacity 0.35s ease;
        `;

        div.innerHTML = `
            <!-- Header -->
            <div style="
                background: linear-gradient(180deg, #060e08 0%, #040a06 100%);
                border-bottom: 1px solid #1e3a2a;
                padding: 16px 30px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            ">
                <div>
                    <div style="color:#22c55e; font-size:0.65rem; letter-spacing:4px; opacity:0.8;">GARUDA-5 CAMPAIGN OPERATIONS</div>
                    <div style="color:#fff; font-size:1.4rem; letter-spacing:4px; margin-top:2px;">ELITE SNIPER <span style="color:#f59e0b;">·</span> SHADOWS OF INDIA</div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;">
                    <div id="campaign-progress-text" style="color:#9ca3af;font-size:0.75rem;letter-spacing:2px;">0 / 10 MISSIONS COMPLETE</div>
                    <button id="campaign-back-btn" style="
                        background: rgba(30,58,42,0.4);
                        border: 1px solid #1e3a2a;
                        color: #9ca3af;
                        font-family: 'Share Tech Mono', monospace;
                        font-size: 0.72rem;
                        padding: 6px 14px;
                        border-radius: 4px;
                        cursor: pointer;
                        letter-spacing: 1px;
                    ">← MAIN MENU</button>
                </div>
            </div>

            <!-- Main content -->
            <div style="display:flex; flex:1; overflow:hidden;">

                <!-- India Map -->
                <div style="flex:1; position:relative; overflow:hidden;">
                    <!-- Map background (SVG India outline) -->
                    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                        ${this._buildIndiaSVG()}
                    </div>
                    <!-- Mission markers (injected by _refreshMissions) -->
                    <div id="campaign-markers" style="position:absolute;inset:0;"></div>
                    <!-- Scan line overlay -->
                    <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px);pointer-events:none;"></div>
                    <!-- Bottom label -->
                    <div style="position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:#1e3a2a;font-size:0.6rem;letter-spacing:3px;">THEATER OF OPERATIONS — INDIA</div>
                </div>

                <!-- Mission Briefing Panel -->
                <div id="campaign-briefing-panel" style="
                    width: 360px;
                    flex-shrink: 0;
                    background: #060e08;
                    border-left: 1px solid #1e3a2a;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                ">
                    <!-- No mission selected state -->
                    <div id="briefing-empty" style="flex:1;display:flex;align-items:center;justify-content:center;color:#1e3a2a;font-size:0.8rem;letter-spacing:2px;">
                        SELECT A MISSION
                    </div>
                    <!-- Mission detail (hidden until selected) -->
                    <div id="briefing-detail" style="display:none;flex-direction:column;height:100%;overflow-y:auto;">

                        <div style="padding:20px 20px 0 20px;flex-shrink:0;">
                            <div id="brief-chapter" style="color:#f59e0b;font-size:0.65rem;letter-spacing:3px;margin-bottom:4px;"></div>
                            <div id="brief-title" style="color:#fff;font-size:1.1rem;letter-spacing:2px;margin-bottom:4px;"></div>
                            <div id="brief-location" style="color:#4b5563;font-size:0.68rem;letter-spacing:2px;margin-bottom:16px;"></div>
                            <div id="brief-status-badge" style="
                                display:inline-block;padding:3px 10px;
                                border-radius:3px;font-size:0.65rem;letter-spacing:2px;margin-bottom:16px;
                            "></div>
                        </div>

                        <div style="border-top:1px solid #1e3a2a;padding:16px 20px;flex-shrink:0;">
                            <div style="color:#22c55e;font-size:0.65rem;letter-spacing:3px;margin-bottom:10px;">MISSION BRIEFING</div>
                            <div id="brief-text" style="color:#9ca3af;font-size:0.78rem;line-height:1.6;"></div>
                        </div>

                        <div style="border-top:1px solid #1e3a2a;padding:16px 20px;flex-shrink:0;">
                            <div style="color:#f59e0b;font-size:0.65rem;letter-spacing:3px;margin-bottom:10px;">OBJECTIVES</div>
                            <div id="brief-objectives" style="display:flex;flex-direction:column;gap:6px;font-size:0.75rem;color:#d1d5db;"></div>
                        </div>

                        <div style="flex:1;"></div>

                        <div style="padding:16px 20px;border-top:1px solid #1e3a2a;flex-shrink:0;">
                            <div id="brief-choice-history" style="margin-bottom:12px;"></div>
                            <button id="campaign-deploy-btn" style="
                                width:100%;
                                background: linear-gradient(135deg, #0f2018, #1a3a28);
                                border: 1px solid #22c55e;
                                color: #22c55e;
                                font-family: 'Share Tech Mono', monospace;
                                font-size: 0.9rem;
                                letter-spacing: 3px;
                                padding: 12px;
                                border-radius: 5px;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">DEPLOY</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="
                background:#040a06;
                border-top:1px solid #1e3a2a;
                padding:8px 30px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                flex-shrink:0;
            ">
                <div style="color:#1e3a2a;font-size:0.62rem;letter-spacing:2px;">CAPTAIN ARJUN RATHORE · RECONNAISSANCE UNIT</div>
                <div style="color:#1e3a2a;font-size:0.62rem;letter-spacing:2px;">GARUDA-5 OPERATIONS CENTER</div>
            </div>
        `;

        (document.getElementById('game-container') || document.body).appendChild(div);
        this.el = div;

        div.querySelector('#campaign-back-btn').addEventListener('click', () => {
            this.close();
            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) mainMenu.classList.remove('hidden');
        });

        div.querySelector('#campaign-deploy-btn').addEventListener('click', () => {
            if (this.selectedMission && this.selectedMission.unlocked) {
                this._deployMission(this.selectedMission);
            }
        });
    }

    _buildIndiaSVG() {
        // Simplified India outline SVG
        return `
        <svg viewBox="0 0 400 500" style="height:85%;opacity:0.12;" fill="none">
            <path d="M185 20 L210 18 L240 25 L270 30 L290 45 L305 55 L310 70 L320 80
                     L330 90 L325 105 L315 115 L300 120 L290 130 L295 145 L305 160
                     L310 175 L300 190 L285 205 L275 220 L265 235 L255 250 L245 265
                     L240 280 L235 295 L230 310 L225 325 L220 340 L215 355 L210 370
                     L205 385 L200 395 L195 405 L185 415 L180 425 L175 435 L170 445
                     L165 455 L160 462 L155 468 L152 475 L150 480
                     L145 475 L140 465 L138 455 L135 445 L130 435 L125 420
                     L120 405 L115 390 L110 375 L105 360 L100 345
                     L95 330 L90 315 L85 300 L80 285 L78 270
                     L80 255 L85 240 L90 225 L95 210 L100 195
                     L95 180 L85 170 L75 162 L65 155 L55 148
                     L50 138 L55 128 L65 120 L75 115
                     L80 105 L75 92 L80 80 L90 70
                     L100 60 L115 52 L130 45 L148 35 L165 25 L185 20 Z"
                  stroke="#22c55e" stroke-width="1.5" fill="rgba(34,197,94,0.05)"/>
            <!-- Kashmir -->
            <path d="M185 20 L175 15 L165 10 L155 12 L145 18 L140 28 L148 35 Z"
                  stroke="#22c55e" stroke-width="1" fill="rgba(34,197,94,0.03)"/>
        </svg>
        `;
    }

    _refreshMissions() {
        const markersEl = document.getElementById('campaign-markers');
        if (!markersEl || !this.missions) return;
        markersEl.innerHTML = '';

        const completed = this.missions.filter(m => m.completed).length;
        const progressEl = document.getElementById('campaign-progress-text');
        if (progressEl) progressEl.innerText = `${completed} / 10 MISSIONS COMPLETE`;

        this.missions.forEach((mission, i) => {
            const pos = MISSION_MAP_POS[i] || { top: '50%', left: '50%' };

            const marker = document.createElement('div');
            marker.style.cssText = `
                position: absolute;
                top: ${pos.top};
                left: ${pos.left};
                transform: translate(-50%, -50%);
                cursor: ${mission.unlocked ? 'pointer' : 'default'};
                text-align: center;
                z-index: 10;
            `;

            const dotColor = mission.completed ? '#22c55e'
                           : !mission.unlocked ? '#1e3a2a'
                           : '#f59e0b';
            const glowColor = mission.completed ? 'rgba(34,197,94,0.4)'
                            : !mission.unlocked ? 'transparent'
                            : 'rgba(245,158,11,0.4)';
            const label = mission.completed ? '✓' : !mission.unlocked ? '?' : `${i + 1}`;

            marker.innerHTML = `
                <div style="
                    width: 24px; height: 24px;
                    border-radius: 50%;
                    background: ${dotColor}22;
                    border: 2px solid ${dotColor};
                    box-shadow: 0 0 10px ${glowColor};
                    display: flex; align-items: center; justify-content: center;
                    color: ${dotColor}; font-size: 0.7rem;
                    transition: all 0.2s;
                    ${mission.unlocked && !mission.completed ? 'animation: markerPulse 2s infinite;' : ''}
                ">${label}</div>
                <div style="
                    color: ${dotColor};
                    font-size: 0.52rem;
                    letter-spacing: 1px;
                    margin-top: 3px;
                    white-space: nowrap;
                    opacity: ${mission.unlocked ? '0.9' : '0.3'};
                ">${i + 1}. ${mission.codename}</div>
            `;

            if (mission.unlocked) {
                marker.addEventListener('click', () => this._selectMission(mission));
                marker.addEventListener('mouseenter', () => {
                    marker.querySelector('div').style.transform = 'scale(1.2)';
                });
                marker.addEventListener('mouseleave', () => {
                    marker.querySelector('div').style.transform = 'scale(1)';
                });
            }

            markersEl.appendChild(marker);
        });

        // Inject pulse animation if not present
        if (!document.getElementById('marker-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'marker-pulse-style';
            style.textContent = `
                @keyframes markerPulse {
                    0%, 100% { box-shadow: 0 0 8px rgba(245,158,11,0.4); }
                    50% { box-shadow: 0 0 18px rgba(245,158,11,0.7); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    _selectMission(mission) {
        if (!mission) return;
        this.selectedMission = mission;

        const emptyEl = document.getElementById('briefing-empty');
        const detailEl = document.getElementById('briefing-detail');
        if (emptyEl) emptyEl.style.display = 'none';
        if (detailEl) detailEl.style.display = 'flex';

        const chapterEl  = document.getElementById('brief-chapter');
        const titleEl    = document.getElementById('brief-title');
        const locationEl = document.getElementById('brief-location');
        const statusEl   = document.getElementById('brief-status-badge');
        const textEl     = document.getElementById('brief-text');
        const objEl      = document.getElementById('brief-objectives');
        const deployBtn  = document.getElementById('campaign-deploy-btn');

        if (chapterEl)  chapterEl.innerText  = mission.chapter || '';
        if (titleEl)    titleEl.innerText    = mission.title;
        if (locationEl) locationEl.innerText = '📍 ' + (mission.location || '');

        if (statusEl) {
            if (mission.completed) {
                statusEl.innerText = '✓ COMPLETED';
                statusEl.style.background = 'rgba(34,197,94,0.15)';
                statusEl.style.color = '#22c55e';
                statusEl.style.border = '1px solid rgba(34,197,94,0.4)';
            } else if (!mission.unlocked) {
                statusEl.innerText = '⊘ LOCKED';
                statusEl.style.background = 'rgba(75,85,99,0.15)';
                statusEl.style.color = '#4b5563';
                statusEl.style.border = '1px solid rgba(75,85,99,0.3)';
            } else {
                statusEl.innerText = '▶ AVAILABLE';
                statusEl.style.background = 'rgba(245,158,11,0.15)';
                statusEl.style.color = '#f59e0b';
                statusEl.style.border = '1px solid rgba(245,158,11,0.4)';
            }
        }

        if (textEl && mission.briefing) {
            textEl.innerHTML = mission.briefing
                .map(line => `<div style="margin-bottom:6px;">› ${line}</div>`)
                .join('');
        }

        if (objEl && mission.primaryObjectives) {
            objEl.innerHTML = mission.primaryObjectives
                .map(obj => `
                    <div style="display:flex;gap:8px;align-items:flex-start;">
                        <span style="color:#22c55e;flex-shrink:0;">□</span>
                        <span style="color:#9ca3af;">${obj.title}</span>
                    </div>
                `).join('');
        }

        if (deployBtn) {
            if (!mission.unlocked) {
                deployBtn.disabled = true;
                deployBtn.innerText = '⊘ MISSION LOCKED';
                deployBtn.style.borderColor = '#1e3a2a';
                deployBtn.style.color = '#374151';
                deployBtn.style.cursor = 'not-allowed';
            } else if (mission.completed) {
                deployBtn.disabled = false;
                deployBtn.innerText = '↺ REPLAY MISSION';
                deployBtn.style.borderColor = '#22c55e';
                deployBtn.style.color = '#22c55e';
                deployBtn.style.cursor = 'pointer';
            } else {
                deployBtn.disabled = false;
                deployBtn.innerText = '▶ DEPLOY';
                deployBtn.style.borderColor = '#22c55e';
                deployBtn.style.color = '#22c55e';
                deployBtn.style.cursor = 'pointer';
            }
        }
    }

    _deployMission(mission) {
        if (!mission.unlocked) return;

        const index = CAMPAIGN_MISSIONS.findIndex(m => m.id === mission.id);
        if (index === -1) return;

        const started = this.engine.campaignManager?.startMission(index);
        if (started !== false) {
            this.close();
            // For Mission 1, use existing game flow
            if (mission.id === 'M01') {
                const startBtn = document.getElementById('btn-start');
                // Trigger the game engine start
                this.engine.stateManager?.setState('PLAYING');
                const player = this.engine.playerManager?.player;
                if (player?.controls) {
                    try { player.controls.lock(); } catch(e) {}
                }
            } else {
                // Future missions — show placeholder for now
                alert(`MISSION ${index + 1}: ${mission.title}\n\nThis mission will be available in the next update.`);
                this.open();
            }
        }
    }
}

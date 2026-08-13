/**
 * CampaignScreen.js
 * AAA Command Center Campaign Operations Screen.
 * Authentic Tactical Military UI for Elite Sniper: Shadows of India.
 */

import { CAMPAIGN_MISSIONS } from '../campaign/CampaignData.js';

// Geographic map node coordinates (% from map container edges)
const MISSION_MAP_POS = [
    { top: '21%', left: '37.5%', region: 'JAMMU & KASHMIR', state: 'JK' }, // M01 — Trishul Shadow
    { top: '28%', left: '42.5%', region: 'HIMACHAL PRADESH', state: 'HP' }, // M02 — Lost Patrol
    { top: '31%', left: '46.0%', region: 'UTTARAKHAND', state: 'UK' }, // M03 — Echo Under Snow
    { top: '39%', left: '39.0%', region: 'PUNJAB / HARYANA', state: 'PB' }, // M04 — Whiteout
    { top: '48%', left: '37.0%', region: 'RAJASTHAN DESERT', state: 'RJ' }, // M05 — The Informant
    { top: '56%', left: '45.0%', region: 'MADHYA PRADESH', state: 'MP' }, // M06 — Broken Chain
    { top: '65%', left: '48.0%', region: 'MAHARASHTRA', state: 'MH' }, // M07 — Shadow Network
    { top: '45%', left: '81.0%', region: 'ARUNACHAL PRADESH', state: 'AR' }, // M08 — Last Signal
    { top: '74%', left: '44.0%', region: 'TELANGANA / AP', state: 'TS' }, // M09 — Trishul Command
    { top: '83%', left: '46.0%', region: 'INDIAN OCEAN SECTOR', state: 'IO' }, // M10 — Shadows of India
];

export class CampaignScreen {
    constructor(engine) {
        this.engine = engine;
        this.isOpen = false;
        this.selectedMission = null;
        this.el = null;
        this.missions = null;
        this.activeTab = 'MAP';

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
        
        // Default to active unlocked mission or M01
        const defaultMission = this.missions?.find(m => !m.completed && m.unlocked) || this.missions?.[0];
        this._selectMission(defaultMission);
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
        this.engine.eventBus?.on('CAMPAIGN_MISSION_COMPLETE', () => {
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
            background: #030706;
            display: none;
            flex-direction: column;
            font-family: 'Share Tech Mono', monospace;
            z-index: 150;
            opacity: 0;
            transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none;
            overflow: hidden;
            color: #d1d5db;
        `;

        div.innerHTML = `
            <!-- Background Tactical Vignette & Grid -->
            <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, rgba(6,16,12,0.6) 0%, rgba(2,5,4,0.95) 100%);pointer-events:none;"></div>
            <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,0.015) 2px, rgba(0,255,100,0.015) 4px);pointer-events:none;"></div>

            <!-- TOP COMMAND BAR -->
            <div style="
                background: linear-gradient(180deg, rgba(8,16,12,0.95) 0%, rgba(4,8,6,0.9) 100%);
                border-bottom: 1px solid rgba(34,197,94,0.25);
                padding: 12px 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
                box-shadow: 0 4px 20px rgba(0,0,0,0.8);
                z-index: 20;
            ">
                <!-- Left Insignia & Title -->
                <div style="display:flex; align-items:center; gap:16px;">
                    <div style="
                        width: 36px; height: 36px;
                        border: 1px solid rgba(245,158,11,0.5);
                        background: rgba(245,158,11,0.1);
                        display: flex; align-items: center; justify-content: center;
                        color: #f59e0b; font-size: 1.2rem;
                        box-shadow: 0 0 12px rgba(245,158,11,0.2);
                        clip-path: polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%);
                    ">⚔</div>
                    <div>
                        <div style="color:#22c55e; font-size:0.65rem; letter-spacing:4px; opacity:0.9; display:flex; align-items:center; gap:8px;">
                            <span>GARUDA-5 CAMPAIGN OPERATIONS</span>
                            <span style="color:#4b5563;">|</span>
                            <span style="color:#9ca3af;">CAPTAIN ARJUN RATHORE</span>
                        </div>
                        <div style="color:#ffffff; font-size:1.3rem; font-weight:bold; letter-spacing:4px; margin-top:1px; text-shadow:0 0 10px rgba(255,255,255,0.2);">
                            ELITE SNIPER <span style="color:#f59e0b;">·</span> SHADOWS OF INDIA
                        </div>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div style="display:flex; gap:6px; background:rgba(6,12,9,0.8); padding:4px; border:1px solid rgba(34,197,94,0.2); border-radius:4px;">
                    <button id="tab-map" class="campaign-tab-btn active" style="
                        background: rgba(34,197,94,0.15); border: 1px solid #22c55e; color: #22c55e;
                        font-family: inherit; font-size: 0.7rem; letter-spacing: 2px; padding: 6px 16px; border-radius: 3px; cursor: pointer; transition: all 0.2s;
                    ">☩ CAMPAIGN MAP</button>
                    <button id="tab-missions" class="campaign-tab-btn" style="
                        background: transparent; border: 1px solid transparent; color: #6b7280;
                        font-family: inherit; font-size: 0.7rem; letter-spacing: 2px; padding: 6px 16px; border-radius: 3px; cursor: pointer; transition: all 0.2s;
                    ">📋 MISSIONS</button>
                    <button id="tab-intel" class="campaign-tab-btn" style="
                        background: transparent; border: 1px solid transparent; color: #6b7280;
                        font-family: inherit; font-size: 0.7rem; letter-spacing: 2px; padding: 6px 16px; border-radius: 3px; cursor: pointer; transition: all 0.2s;
                    ">☆ INTEL</button>
                </div>

                <!-- Status & Back button -->
                <div style="display:flex; gap:20px; align-items:center;">
                    <div style="text-align:right;">
                        <div style="color:#6b7280; font-size:0.6rem; letter-spacing:2px;">OPERATIONS STATUS</div>
                        <div style="color:#22c55e; font-size:0.75rem; letter-spacing:2px; font-weight:bold; display:flex; align-items:center; gap:6px; justify-content:flex-end;">
                            <span style="width:7px; height:7px; border-radius:50%; background:#22c55e; box-shadow:0 0 8px #22c55e; display:inline-block; animation: pulseGlow 1.5s infinite;"></span>
                            OPERATIONAL
                        </div>
                    </div>
                    <button id="campaign-back-btn" style="
                        background: rgba(15,23,19,0.8);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: #cbd5e1;
                        font-family: 'Share Tech Mono', monospace;
                        font-size: 0.72rem;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        letter-spacing: 2px;
                        transition: all 0.2s;
                    ">✖ EXIT MAP</button>
                </div>
            </div>

            <!-- MAIN CONTENT AREA -->
            <div style="display:flex; flex:1; position:relative; overflow:hidden; z-index:10;">

                <!-- LEFT SIDEBAR: MISSION LIST SELECTOR -->
                <div style="
                    width: 280px;
                    flex-shrink: 0;
                    background: rgba(4, 9, 7, 0.85);
                    border-right: 1px solid rgba(34,197,94,0.2);
                    display: flex;
                    flex-direction: column;
                    z-index: 15;
                    backdrop-filter: blur(10px);
                ">
                    <!-- Progress Header -->
                    <div style="padding: 16px 18px; border-bottom: 1px solid rgba(34,197,94,0.15); background: rgba(0,0,0,0.3);">
                        <div style="color: #9ca3af; font-size: 0.65rem; letter-spacing: 2px; margin-bottom: 6px;">CAMPAIGN PROGRESS</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                            <span id="campaign-progress-text" style="color: #ffffff; font-weight: bold; font-size: 0.85rem; letter-spacing: 1px;">0 / 10 COMPLETED</span>
                            <span id="campaign-progress-pct" style="color: #22c55e; font-size: 0.8rem; font-weight: bold;">0%</span>
                        </div>
                        <div style="height: 6px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 3px; overflow: hidden; position: relative;">
                            <div id="campaign-progress-bar" style="height:100%; width:0%; background: linear-gradient(90deg, #15803d, #22c55e); box-shadow:0 0 10px #22c55e; transition: width 0.5s;"></div>
                        </div>
                    </div>

                    <!-- Mission List Scroll -->
                    <div id="campaign-mission-list" style="flex:1; overflow-y:auto; padding: 10px; display:flex; flex-direction:column; gap:6px;">
                        <!-- Injected by _refreshMissions -->
                    </div>

                    <div style="padding:12px; border-top:1px solid rgba(34,197,94,0.15); background:rgba(0,0,0,0.4);">
                        <button id="btn-campaign-briefing-doc" style="
                            width:100%; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.3); color:#22c55e;
                            padding:8px; font-family:inherit; font-size:0.68rem; letter-spacing:2px; border-radius:3px; cursor:pointer;
                        ">📑 VIEW CAMPAIGN BRIEFING</button>
                    </div>
                </div>

                <!-- CENTER AREA: TACTICAL MAP CONTAINER -->
                <div style="flex:1; position:relative; overflow:hidden; background:#020604; display:flex; align-items:center; justify-content:center;">
                    
                    <!-- Tactical Map Canvas Wrapper -->
                    <div id="map-viewport" style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                        
                        <!-- Satellite Map Background Image -->
                        <div style="
                            position: absolute; inset: 0;
                            background-image: url('/assets/campaign_map_bg.png');
                            background-size: contain;
                            background-position: center;
                            background-repeat: no-repeat;
                            filter: brightness(0.95) contrast(1.05);
                        "></div>

                        <!-- Scanline & Vignette Overlay -->
                        <div style="position:absolute; inset:0; background:radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 60%, rgba(2,5,4,0.7) 100%); pointer-events:none;"></div>
                        <div style="position:absolute; inset:0; background:repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px); pointer-events:none;"></div>

                        <!-- Tactical SVG Connection Lines -->
                        <svg id="campaign-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:5;">
                            <!-- Connection Path lines injected by _refreshMissions -->
                        </svg>

                        <!-- Mission Markers Container -->
                        <div id="campaign-markers" style="position:absolute; inset:0; z-index:10; pointer-events:auto;"></div>
                    </div>
                </div>

                <!-- RIGHT SIDEBAR: AAA MISSION BRIEFING CARD -->
                <div id="campaign-briefing-panel" style="
                    width: 380px;
                    flex-shrink: 0;
                    background: rgba(5, 12, 9, 0.92);
                    border-left: 1px solid rgba(34,197,94,0.25);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    z-index: 15;
                    box-shadow: -4px 0 25px rgba(0,0,0,0.8);
                    backdrop-filter: blur(12px);
                ">
                    <!-- Empty State -->
                    <div id="briefing-empty" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#4b5563; font-size:0.8rem; letter-spacing:3px; gap:10px;">
                        <span style="font-size:2rem; opacity:0.3;">🎯</span>
                        <span>SELECT TARGET OPERATION</span>
                    </div>

                    <!-- Mission Detail Screen -->
                    <div id="briefing-detail" style="display:none; flex-direction:column; height:100%; overflow:hidden;">
                        
                        <!-- Header Banner & Image Preview -->
                        <div style="position:relative; height:140px; flex-shrink:0; overflow:hidden; border-bottom:1px solid rgba(34,197,94,0.2);">
                            <div id="brief-img" style="
                                width:100%; height:100%;
                                background-size:cover; background-position:center;
                                filter: brightness(0.65) contrast(1.1);
                                transform: scale(1.05);
                                transition: all 0.4s;
                            "></div>
                            <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(5,12,9,0.2) 0%, rgba(5,12,9,0.95) 100%);"></div>
                            
                            <div style="position:absolute; top:12px; left:16px; right:16px; display:flex; justify-content:space-between; align-items:flex-start;">
                                <div id="brief-chapter" style="color:#f59e0b; font-size:0.62rem; letter-spacing:3px; font-weight:bold; background:rgba(0,0,0,0.6); padding:2px 8px; border-radius:3px; border:1px solid rgba(245,158,11,0.3);">CHAPTER 1</div>
                                <div id="brief-status-badge" style="padding:2px 10px; border-radius:3px; font-size:0.62rem; letter-spacing:2px; font-weight:bold;"></div>
                            </div>

                            <div style="position:absolute; bottom:12px; left:16px; right:16px;">
                                <div id="brief-title" style="color:#ffffff; font-size:1.25rem; font-weight:bold; letter-spacing:2px; text-shadow:0 2px 8px rgba(0,0,0,0.8);">OPERATION TRISHUL SHADOW</div>
                                <div id="brief-location" style="color:#9ca3af; font-size:0.68rem; letter-spacing:1px; margin-top:2px;">📍 HIMALAYAN BORDER SECTOR, NORTHERN INDIA</div>
                            </div>
                        </div>

                        <!-- Scrollable Mission Info -->
                        <div style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:16px;">
                            
                            <!-- Tactical Intel Block -->
                            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(34,197,94,0.15); padding:12px; border-radius:4px;">
                                <div style="color:#22c55e; font-size:0.62rem; letter-spacing:3px; margin-bottom:8px; font-weight:bold; display:flex; align-items:center; gap:6px;">
                                    <span>📡 MISSION BRIEFING</span>
                                </div>
                                <div id="brief-text" style="color:#cbd5e1; font-size:0.75rem; line-height:1.6;"></div>
                            </div>

                            <!-- Primary Objectives -->
                            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(245,158,11,0.15); padding:12px; border-radius:4px;">
                                <div style="color:#f59e0b; font-size:0.62rem; letter-spacing:3px; margin-bottom:10px; font-weight:bold; display:flex; align-items:center; gap:6px;">
                                    <span>🎯 TACTICAL OBJECTIVES</span>
                                </div>
                                <div id="brief-objectives" style="display:flex; flex-direction:column; gap:8px;"></div>
                            </div>

                            <!-- Weather & Environmental Conditions -->
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                                <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); padding:8px 10px; border-radius:4px;">
                                    <div style="color:#6b7280; font-size:0.58rem; letter-spacing:1px;">ENVIRONMENT</div>
                                    <div id="brief-env" style="color:#e2e8f0; font-size:0.72rem; margin-top:2px; font-weight:bold;">SNOW / FOG</div>
                                </div>
                                <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); padding:8px 10px; border-radius:4px;">
                                    <div style="color:#6b7280; font-size:0.58rem; letter-spacing:1px;">RECOMMENDED WEAPON</div>
                                    <div id="brief-weapon" style="color:#f59e0b; font-size:0.72rem; margin-top:2px; font-weight:bold;">VICRO SVD 7.62</div>
                                </div>
                            </div>

                        </div>

                        <!-- Action Footer Button -->
                        <div style="padding:16px; border-top:1px solid rgba(34,197,94,0.2); background:rgba(4,9,7,0.95); flex-shrink:0;">
                            <button id="campaign-deploy-btn" style="
                                width: 100%;
                                background: linear-gradient(135deg, #15803d, #166534);
                                border: 1px solid #22c55e;
                                color: #ffffff;
                                font-family: 'Share Tech Mono', monospace;
                                font-size: 0.95rem;
                                font-weight: bold;
                                letter-spacing: 4px;
                                padding: 14px;
                                border-radius: 4px;
                                cursor: pointer;
                                transition: all 0.25s;
                                box-shadow: 0 4px 15px rgba(34,197,94,0.3);
                                text-shadow: 0 1px 3px rgba(0,0,0,0.8);
                            ">▶ RESUME OPERATION</button>
                            <div style="text-align:center; margin-top:8px;">
                                <span style="color:#6b7280; font-size:0.58rem; letter-spacing:1px;">PRESS DEPLOY TO LOCK IN LOADOUT AND ENGAGE</span>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <!-- BOTTTOM TELEMETRY & COMMAND STATUS FOOTER -->
            <div style="
                background: #030705;
                border-top: 1px solid rgba(34,197,94,0.2);
                padding: 6px 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
                font-size: 0.65rem;
                color: #6b7280;
                z-index: 20;
            ">
                <div style="display:flex; gap:24px; align-items:center;">
                    <div>SECTOR: <span style="color:#22c55e;">IN-HQ-NORTH</span></div>
                    <div>ENCRYPTION: <span style="color:#22c55e;">AES-256 SECURE</span></div>
                    <div>SATELLITE LINK: <span style="color:#22c55e;">ONLINE (99.8%)</span></div>
                </div>
                <div style="color:#4b5563; letter-spacing:2px;">
                    "IN THE SHADOWS WE OPERATE, SO INDIA STAYS SAFE"
                </div>
            </div>
        `;

        (document.getElementById('game-container') || document.body).appendChild(div);
        this.el = div;

        // Button listeners
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

        div.querySelector('#btn-campaign-briefing-doc')?.addEventListener('click', () => {
            alert("CAMPAIGN OVERVIEW:\n\nCaptain Arjun Rathore leads GARUDA-5 against 'The Architect' across 10 tactical combat sectors in India. Clear objectives sector-by-sector to neutralize the rogue network.");
        });

        // Tab switching handlers
        const tabs = div.querySelectorAll('.campaign-tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => {
                    t.style.background = 'transparent';
                    t.style.borderColor = 'transparent';
                    t.style.color = '#6b7280';
                });
                const target = e.currentTarget;
                target.style.background = 'rgba(34,197,94,0.15)';
                target.style.borderColor = '#22c55e';
                target.style.color = '#22c55e';
            });
        });
    }

    _buildIndiaSVG() {
        return `
        <svg viewBox="0 0 600 700" style="height:92%; max-width:95%; opacity:0.85; filter: drop-shadow(0 0 15px rgba(34,197,94,0.15));" fill="none">
            <!-- Grid Lines -->
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,197,94,0.06)" stroke-width="1"/>
                </pattern>
                <radialGradient id="mapGlow" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stop-color="rgba(34,197,94,0.12)" />
                    <stop offset="100%" stop-color="rgba(4,10,7,0)" />
                </radialGradient>
            </defs>
            
            <rect width="600" height="700" fill="url(#grid)" />
            <rect width="600" height="700" fill="url(#mapGlow)" />

            <!-- India Map Topographic Outline -->
            <path d="M260 40 L285 35 L320 45 L350 55 L385 75 L405 90 L415 110 L430 125
                     L445 140 L440 165 L425 180 L405 190 L390 205 L400 230 L415 250
                     L425 275 L410 300 L385 325 L370 350 L355 375 L340 400 L325 425
                     L315 450 L305 475 L295 500 L285 525 L275 545 L265 565 L255 580
                     L245 595 L235 608 L230 615 L220 605 L210 585 L200 565 L190 545
                     L180 520 L170 490 L160 460 L150 430 L140 400 L130 370 L125 340
                     L130 310 L140 285 L150 260 L140 235 L120 220 L100 205 L80 190
                     L70 175 L80 160 L95 145 L110 135 L120 120 L110 100 L120 85
                     L135 70 L155 55 L180 45 L210 40 Z"
                  stroke="#22c55e" stroke-width="2" stroke-dasharray="none" fill="rgba(20,50,35,0.25)" />

            <!-- Detailed State Borders & Topography lines -->
            <path d="M260 40 L245 65 L260 90 L290 105 L310 125 L300 150 L270 160 L240 150 L220 120 L230 85 Z" stroke="rgba(34,197,94,0.3)" stroke-width="1" fill="rgba(34,197,94,0.04)" />
            <path d="M220 120 L180 135 L150 165 L160 195 L200 210 L240 180 L240 150 Z" stroke="rgba(34,197,94,0.2)" stroke-width="1" fill="rgba(34,197,94,0.02)" />
            <path d="M200 210 L160 230 L140 280 L180 320 L230 310 L250 250 Z" stroke="rgba(34,197,94,0.2)" stroke-width="1" fill="rgba(34,197,94,0.02)" />
            <path d="M250 250 L230 310 L270 360 L330 350 L350 290 L300 260 Z" stroke="rgba(34,197,94,0.25)" stroke-width="1" fill="rgba(34,197,94,0.03)" />
            <path d="M400 230 L460 210 L520 220 L550 250 L520 280 L450 275 L415 250 Z" stroke="rgba(34,197,94,0.3)" stroke-width="1" fill="rgba(34,197,94,0.05)" />

            <!-- Strategic Range Circles -->
            <circle cx="260" cy="140" r="80" stroke="rgba(245,158,11,0.15)" stroke-width="1" stroke-dasharray="4 4" fill="none" />
            <circle cx="260" cy="140" r="140" stroke="rgba(245,158,11,0.08)" stroke-width="1" stroke-dasharray="6 6" fill="none" />

            <!-- Compass Marker -->
            <g transform="translate(520, 80)">
                <circle cx="0" cy="0" r="28" stroke="rgba(34,197,94,0.4)" stroke-width="1" fill="none" />
                <line x1="0" y1="-34" x2="0" y2="34" stroke="rgba(34,197,94,0.4)" stroke-width="1" />
                <line x1="-34" y1="0" x2="34" y2="0" stroke="rgba(34,197,94,0.4)" stroke-width="1" />
                <text x="-4" y="-12" fill="#22c55e" font-size="10" font-weight="bold">N</text>
            </g>
        </svg>
        `;
    }

    _refreshMissions() {
        const markersEl = document.getElementById('campaign-markers');
        const listEl = document.getElementById('campaign-mission-list');
        const pathSvg = document.getElementById('campaign-path-svg');
        if (!markersEl || !this.missions) return;

        markersEl.innerHTML = '';
        if (listEl) listEl.innerHTML = '';

        const completedCount = this.missions.filter(m => m.completed).length;
        const totalCount = this.missions.length;
        const pct = Math.round((completedCount / totalCount) * 100);

        const progressText = document.getElementById('campaign-progress-text');
        const progressPct = document.getElementById('campaign-progress-pct');
        const progressBar = document.getElementById('campaign-progress-bar');
        
        if (progressText) progressText.innerText = `${completedCount} / ${totalCount} COMPLETED`;
        if (progressPct) progressPct.innerText = `${pct}%`;
        if (progressBar) progressBar.style.width = `${pct}%`;

        // Render Sidebar Mission List Items
        this.missions.forEach((mission, i) => {
            if (!listEl) return;
            const isSelected = this.selectedMission?.id === mission.id;

            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px 12px;
                border-radius: 4px;
                border: 1px solid ${isSelected ? '#22c55e' : mission.unlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'};
                background: ${isSelected ? 'rgba(34,197,94,0.15)' : mission.unlocked ? 'rgba(15,23,19,0.6)' : 'rgba(8,12,10,0.4)'};
                cursor: ${mission.unlocked ? 'pointer' : 'default'};
                opacity: ${mission.unlocked ? '1' : '0.45'};
                transition: all 0.2s;
                display: flex; align-items: center; justify-content: space-between;
            `;

            const statusSymbol = mission.completed ? '<span style="color:#22c55e;">✓</span>' 
                               : !mission.unlocked ? '<span style="color:#4b5563;">🔒</span>'
                               : '<span style="color:#f59e0b; animation: pulseGlow 1.5s infinite;">▶</span>';

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="font-weight:bold; font-size:0.75rem; color:${mission.completed ? '#22c55e' : mission.unlocked ? '#ffffff' : '#6b7280'};">
                        ${String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                        <div style="color:${isSelected ? '#ffffff' : '#d1d5db'}; font-size:0.72rem; font-weight:bold; letter-spacing:1px;">
                            ${mission.title}
                        </div>
                        <div style="color:#6b7280; font-size:0.58rem; letter-spacing:1px;">
                            ${MISSION_MAP_POS[i]?.region || 'SECTOR'}
                        </div>
                    </div>
                </div>
                <div>${statusSymbol}</div>
            `;

            if (mission.unlocked) {
                item.addEventListener('click', () => this._selectMission(mission));
            }

            listEl.appendChild(item);
        });

        // Render Connection Path SVG Lines between consecutive missions
        if (pathSvg) {
            let pathD = '';
            for (let i = 0; i < this.missions.length - 1; i++) {
                const currentPos = MISSION_MAP_POS[i];
                const nextPos = MISSION_MAP_POS[i + 1];
                if (currentPos && nextPos) {
                    const x1 = parseFloat(currentPos.left);
                    const y1 = parseFloat(currentPos.top);
                    const x2 = parseFloat(nextPos.left);
                    const y2 = parseFloat(nextPos.top);
                    pathD += `M ${x1} ${y1} L ${x2} ${y2} `;
                }
            }
            pathSvg.innerHTML = `
                <path d="${pathD}" stroke="rgba(34,197,94,0.3)" stroke-width="0.3" stroke-dasharray="0.8 0.8" fill="none" />
            `;
        }

        // Render Map Markers
        this.missions.forEach((mission, i) => {
            const pos = MISSION_MAP_POS[i] || { top: '50%', left: '50%' };
            const isSelected = this.selectedMission?.id === mission.id;

            const marker = document.createElement('div');
            marker.style.cssText = `
                position: absolute;
                top: ${pos.top};
                left: ${pos.left};
                transform: translate(-50%, -50%);
                cursor: ${mission.unlocked ? 'pointer' : 'default'};
                z-index: ${isSelected ? '25' : '10'};
            `;

            const dotColor = mission.completed ? '#22c55e'
                           : !mission.unlocked ? '#374151'
                           : '#f59e0b';
            
            const glowColor = mission.completed ? 'rgba(34,197,94,0.6)'
                            : !mission.unlocked ? 'transparent'
                            : 'rgba(245,158,11,0.7)';

            const label = mission.completed ? '✓' : !mission.unlocked ? '🔒' : `${i + 1}`;

            marker.innerHTML = `
                <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
                    <!-- Pulse ring for active mission -->
                    ${mission.unlocked && !mission.completed ? `
                        <div style="
                            position:absolute; width:36px; height:36px; top:-6px; left:-6px;
                            border-radius:50%; border:1px solid #f59e0b;
                            animation: pingRing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                        "></div>
                    ` : ''}
                    
                    <!-- Marker Core Pin -->
                    <div class="map-node-pin" style="
                        width: 26px; height: 26px;
                        border-radius: 50%;
                        background: ${isSelected ? '#ffffff' : 'rgba(5, 12, 9, 0.95)'};
                        border: 2px solid ${dotColor};
                        box-shadow: 0 0 14px ${glowColor};
                        display: flex; align-items: center; justify-content: center;
                        color: ${isSelected ? '#000000' : dotColor}; font-weight: bold; font-size: 0.72rem;
                        transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
                    ">${label}</div>

                    <!-- Marker Label -->
                    <div style="
                        background: rgba(4, 9, 7, 0.88);
                        border: 1px solid ${isSelected ? '#22c55e' : 'rgba(255,255,255,0.15)'};
                        color: ${isSelected ? '#22c55e' : '#e2e8f0'};
                        font-size: 0.58rem;
                        font-weight: bold;
                        letter-spacing: 1px;
                        padding: 2px 6px;
                        border-radius: 3px;
                        margin-top: 4px;
                        white-space: nowrap;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.8);
                        opacity: ${mission.unlocked ? '1' : '0.5'};
                    ">${String(i + 1).padStart(2, '0')}. ${mission.codename}</div>
                </div>
            `;

            if (mission.unlocked) {
                marker.addEventListener('click', () => this._selectMission(mission));
                marker.addEventListener('mouseenter', () => {
                    const pin = marker.querySelector('.map-node-pin');
                    if (pin) pin.style.transform = 'scale(1.3)';
                });
                marker.addEventListener('mouseleave', () => {
                    const pin = marker.querySelector('.map-node-pin');
                    if (pin && this.selectedMission?.id !== mission.id) {
                        pin.style.transform = 'scale(1)';
                    }
                });
            }

            markersEl.appendChild(marker);
        });

        // Add Animations
        if (!document.getElementById('campaign-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'campaign-custom-styles';
            style.textContent = `
                @keyframes pingRing {
                    75%, 100% { transform: scale(1.6); opacity: 0; }
                }
                @keyframes pulseGlow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
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

        // Update elements
        const imgEl      = document.getElementById('brief-img');
        const chapterEl  = document.getElementById('brief-chapter');
        const titleEl    = document.getElementById('brief-title');
        const locationEl = document.getElementById('brief-location');
        const statusEl   = document.getElementById('brief-status-badge');
        const textEl     = document.getElementById('brief-text');
        const objEl      = document.getElementById('brief-objectives');
        const envEl      = document.getElementById('brief-env');
        const weaponEl   = document.getElementById('brief-weapon');
        const deployBtn  = document.getElementById('campaign-deploy-btn');

        if (imgEl) {
            imgEl.style.backgroundImage = `url('/assets/login_screen_full.png')`;
        }

        if (chapterEl)  chapterEl.innerText  = mission.chapter || 'TACTICAL OPERATION';
        if (titleEl)    titleEl.innerText    = mission.title;
        if (locationEl) locationEl.innerText = '📍 ' + (mission.location || 'CLASSIFIED SECTOR');

        if (statusEl) {
            if (mission.completed) {
                statusEl.innerText = '✓ COMPLETED';
                statusEl.style.background = 'rgba(34,197,94,0.2)';
                statusEl.style.color = '#22c55e';
                statusEl.style.border = '1px solid #22c55e';
            } else if (!mission.unlocked) {
                statusEl.innerText = '🔒 LOCKED';
                statusEl.style.background = 'rgba(75,85,99,0.2)';
                statusEl.style.color = '#9ca3af';
                statusEl.style.border = '1px solid #4b5563';
            } else {
                statusEl.innerText = '▶ ACTIVE OPERATION';
                statusEl.style.background = 'rgba(245,158,11,0.2)';
                statusEl.style.color = '#f59e0b';
                statusEl.style.border = '1px solid #f59e0b';
            }
        }

        if (textEl && mission.briefing) {
            textEl.innerHTML = mission.briefing
                .map(line => `<div style="margin-bottom:6px; display:flex; gap:6px;"><span style="color:#22c55e;">›</span><span>${line}</span></div>`)
                .join('');
        }

        if (objEl && mission.primaryObjectives) {
            objEl.innerHTML = mission.primaryObjectives
                .map(obj => `
                    <div style="display:flex; gap:8px; align-items:flex-start; font-size:0.73rem;">
                        <span style="color:#22c55e; flex-shrink:0;">[ ]</span>
                        <span style="color:#e2e8f0;">${obj.title}</span>
                    </div>
                `).join('');
        }

        if (envEl) {
            envEl.innerText = mission.environment?.id || 'SNOW / HIGH ALTITUDE';
        }

        if (weaponEl) {
            weaponEl.innerText = mission.recommendedWeapon || 'DRAGUNOV SVD / VICRO-7';
        }

        if (deployBtn) {
            if (!mission.unlocked) {
                deployBtn.disabled = true;
                deployBtn.innerText = '🔒 SECTOR LOCKED';
                deployBtn.style.background = '#1f2937';
                deployBtn.style.borderColor = '#374151';
                deployBtn.style.color = '#6b7280';
                deployBtn.style.cursor = 'not-allowed';
                deployBtn.style.boxShadow = 'none';
            } else if (mission.completed) {
                deployBtn.disabled = false;
                deployBtn.innerText = '↺ REPLAY OPERATION';
                deployBtn.style.background = 'linear-gradient(135deg, #15803d, #166534)';
                deployBtn.style.borderColor = '#22c55e';
                deployBtn.style.color = '#22c55e';
                deployBtn.style.cursor = 'pointer';
                deployBtn.style.boxShadow = '0 4px 15px rgba(34,197,94,0.3)';
            } else {
                deployBtn.disabled = false;
                deployBtn.innerText = '▶ RESUME OPERATION';
                deployBtn.style.background = 'linear-gradient(135deg, #15803d, #166534)';
                deployBtn.style.borderColor = '#22c55e';
                deployBtn.style.color = '#ffffff';
                deployBtn.style.cursor = 'pointer';
                deployBtn.style.boxShadow = '0 4px 15px rgba(34,197,94,0.3)';
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
            if (mission.id === 'M01') {
                this.engine.playCutscene('/assets/mission01_intro.mp4', () => {
                    this.engine.stateManager?.setState('PLAYING');
                    const player = this.engine.playerManager?.player;
                    if (player?.controls) {
                        try { player.controls.lock(); } catch(e) {}
                    }
                });
            } else {
                alert(`MISSION ${index + 1}: ${mission.title}\n\nPreparing tactical deployment environment for sector ${mission.location || 'classified'}...`);
                this.open();
            }
        }
    }
}


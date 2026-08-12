/**
 * RadioDialogueSystem.js  (Enhanced)
 * Tactical military radio communication panel with:
 *  - Message queue (no more overwriting)
 *  - Character-by-character typing animation
 *  - Web Audio radio static effect
 *  - Unique speaker color coding per character
 *  - Signal strength indicator
 *  - Smooth fade in / out transitions
 */

export class RadioDialogueSystem {
    constructor(engine) {
        this.engine = engine;
        this.containerEl = null;
        this.queue = [];
        this.isShowing = false;
        this.hideTimeout = null;
        this.typingInterval = null;
        this.audioCtx = null;

        this._ensureAudioCtx();
        this.createSubtitleUI();
    }

    _ensureAudioCtx() {
        if (!this.audioCtx) {
            try {
                this.audioCtx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {}
        }
    }

    createSubtitleUI() {
        if (document.getElementById('radio-dialogue-box')) {
            this.containerEl = document.getElementById('radio-dialogue-box');
            return;
        }

        const div = document.createElement('div');
        div.id = 'radio-dialogue-box';
        div.style.cssText = `
            position: absolute;
            bottom: 130px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(14, 19, 24, 0.94);
            border: 1px solid rgba(224, 155, 62, 0.4);
            border-left: 4px solid #e09b3e;
            padding: 0;
            border-radius: 4px;
            color: #fff;
            font-family: 'Share Tech Mono', monospace;
            z-index: 55;
            min-width: 380px;
            max-width: 640px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.9), 0 0 12px rgba(224, 155, 62, 0.15);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.25s ease, transform 0.25s ease;
            transform: translateX(-50%) translateY(8px);
            overflow: hidden;
            backdrop-filter: blur(8px);
        `;

        div.innerHTML = `
            <div id="radio-header" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 14px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
                background: rgba(8, 12, 16, 0.6);
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span id="radio-signal-dot" style="
                        width: 7px; height: 7px;
                        border-radius: 50%;
                        background: #e09b3e;
                        box-shadow: 0 0 8px #e09b3e;
                        animation: radioPulse 0.8s infinite alternate;
                        flex-shrink: 0;
                    "></span>
                    <span id="radio-speaker" style="
                        color: #e09b3e;
                        font-size: 0.82rem;
                        font-weight: bold;
                        letter-spacing: 2px;
                    ">LT. MEERA NAIR</span>
                    <span id="radio-status" style="
                        background: rgba(75, 107, 78, 0.3);
                        border: 1px solid #4b6b4e;
                        color: #4b6b4e;
                        font-size: 0.62rem;
                        padding: 1px 6px;
                        border-radius: 2px;
                        letter-spacing: 1.5px;
                        font-weight: bold;
                    ">ACTIVE</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <!-- Animated Waveform Bars -->
                    <div id="radio-bars" style="display: flex; gap: 3px; align-items: center; height: 14px;">
                        <div class="wf-bar" style="width:2px; background:#4b6b4e; height:6px; animation: wfAnim 0.6s infinite alternate;"></div>
                        <div class="wf-bar" style="width:2px; background:#4b6b4e; height:12px; animation: wfAnim 0.4s 0.1s infinite alternate;"></div>
                        <div class="wf-bar" style="width:2px; background:#4b6b4e; height:8px; animation: wfAnim 0.7s 0.2s infinite alternate;"></div>
                        <div class="wf-bar" style="width:2px; background:#4b6b4e; height:14px; animation: wfAnim 0.5s 0.05s infinite alternate;"></div>
                        <div class="wf-bar" style="width:2px; background:#4b6b4e; height:5px; animation: wfAnim 0.8s 0.15s infinite alternate;"></div>
                    </div>
                </div>
            </div>
            <div id="radio-text" style="
                font-size: 0.95rem;
                color: #e6edf3;
                line-height: 1.5;
                padding: 10px 14px 12px 14px;
                min-height: 28px;
            ">&nbsp;</div>
        `;

        // Inject pulse & waveform animation
        if (!document.getElementById('radio-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'radio-pulse-style';
            style.textContent = `
                @keyframes radioPulse {
                    from { opacity: 0.5; transform: scale(0.8); }
                    to   { opacity: 1.0; transform: scale(1.1); }
                }
                @keyframes wfAnim {
                    0%   { height: 3px; opacity: 0.4; }
                    100% { height: 14px; opacity: 1.0; }
                }
            `;
            document.head.appendChild(style);
        }

        const container = document.getElementById('game-container') || document.body;
        container.appendChild(div);
        this.containerEl = div;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Enqueue a speech line. Lines play sequentially without overlapping.
     * @param {string} speaker  - Speaker name (full caps)
     * @param {string} text     - Dialogue text (no quotes needed)
     * @param {number} duration - How long (seconds) to show after typing completes
     * @param {string} color    - Speaker name color (hex string)
     */
    speak(speaker, text, duration = 4.0, color = '#d97706') {
        if (!this.containerEl) this.createSubtitleUI();

        this.queue.push({ speaker, text, duration, color });

        if (!this.isShowing) {
            this._dequeueNext();
        }
    }

    clearQueue() {
        this.queue = [];
        this._hidePanel();
    }

    // ─── Internal Playback ─────────────────────────────────────────────────────

    _dequeueNext() {
        if (this.queue.length === 0) {
            this._hidePanel();
            return;
        }

        const { speaker, text, duration, color } = this.queue.shift();
        this._showLine(speaker, text, duration, color);
    }

    _showLine(speaker, text, duration, color) {
        this.isShowing = true;

        const speakerEl = document.getElementById('radio-speaker');
        const textEl    = document.getElementById('radio-text');
        const dotEl     = document.getElementById('radio-signal-dot');
        const headerEl  = document.getElementById('radio-header');

        if (speakerEl) {
            speakerEl.innerText = speaker.toUpperCase();
            speakerEl.style.color = color;
        }
        if (dotEl) {
            dotEl.style.background = color;
            dotEl.style.boxShadow = `0 0 6px ${color}`;
        }
        if (headerEl) {
            headerEl.style.borderBottomColor = `${color}33`;
        }
        if (this.containerEl) {
            this.containerEl.style.borderColor = color;
            this.containerEl.style.borderLeftColor = color;
        }

        // Play radio static
        this._playStaticBurst();

        // Show panel
        if (this.containerEl) {
            this.containerEl.style.opacity = '1';
            this.containerEl.style.transform = 'translateX(-50%) translateY(0)';
        }

        // Type the text
        if (textEl) {
            textEl.innerHTML = '';
        }
        this._typeText(textEl, `"${text}"`, () => {
            // After typing completes, wait then move to next
            if (this.hideTimeout) clearTimeout(this.hideTimeout);
            this.hideTimeout = setTimeout(() => {
                this._dequeueNext();
            }, duration * 1000);
        });
    }

    _typeText(el, fullText, onComplete) {
        if (this.typingInterval) clearInterval(this.typingInterval);
        if (!el) { if (onComplete) onComplete(); return; }

        let i = 0;
        const speedMs = 22; // ms per character
        el.innerHTML = '';

        this.typingInterval = setInterval(() => {
            if (i >= fullText.length) {
                clearInterval(this.typingInterval);
                this.typingInterval = null;
                if (onComplete) onComplete();
                return;
            }
            el.innerHTML = fullText.slice(0, i + 1) + '<span style="opacity:0.5; animation: blink 0.5s infinite;">_</span>';
            i++;
        }, speedMs);
    }

    _hidePanel() {
        this.isShowing = false;
        if (this.containerEl) {
            this.containerEl.style.opacity = '0';
            this.containerEl.style.transform = 'translateX(-50%) translateY(8px)';
        }
    }

    // ─── Audio ────────────────────────────────────────────────────────────────

    _playStaticBurst() {
        this._ensureAudioCtx();
        try {
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

            const now = this.audioCtx.currentTime;
            const duration = 0.12;

            // White noise buffer
            const bufLen = this.audioCtx.sampleRate * duration;
            const buf = this.audioCtx.createBuffer(1, bufLen, this.audioCtx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);

            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buf;

            // Bandpass filter for radio freq character
            const bp = this.audioCtx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.value = 1400;
            bp.Q.value = 0.8;

            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(bp);
            bp.connect(gain);
            gain.connect(this.audioCtx.destination);
            noise.start(now);
            noise.stop(now + duration);

            // Short click tone
            const osc = this.audioCtx.createOscillator();
            const oscGain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            oscGain.gain.setValueAtTime(0.06, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.connect(oscGain);
            oscGain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.07);

        } catch (e) {}
    }

    // Legacy compat — used by MissionManager
    playRadioBeep() { this._playStaticBurst(); }
}

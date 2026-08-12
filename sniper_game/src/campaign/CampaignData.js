/**
 * CampaignData.js
 * All 10 mission definitions for Elite Sniper: Shadows of India
 * Captain Arjun Rathore's full campaign against The Architect
 */

// ─── Character voice colors ───────────────────────────────────────────────────
export const CHARACTERS = {
    ARJUN:    { name: 'CAPTAIN ARJUN RATHORE',  color: '#60a5fa', short: 'ARJUN'    },
    VIKRAM:   { name: 'MAJOR VIKRAM SINGH',       color: '#f59e0b', short: 'VIKRAM'   },
    IMRAN:    { name: 'HAVILDAR IMRAN KHAN',      color: '#34d399', short: 'IMRAN'    },
    MEERA:    { name: 'LT. MEERA NAIR',           color: '#f472b6', short: 'MEERA'    },
    KAVYA:    { name: 'CPT. KAVYA MENON',         color: '#22d3ee', short: 'KAVYA'    },
    TARA:     { name: 'TARA',                     color: '#a78bfa', short: 'TARA'     },
    ARCHITECT:{ name: 'THE ARCHITECT',            color: '#ef4444', short: 'ARCHITECT' },
    SYSTEM:   { name: '[ SYSTEM ]',              color: '#9ca3af', short: 'SYSTEM'   },
};

// ─── Environment presets ───────────────────────────────────────────────────────
export const ENVIRONMENTS = {
    HIMALAYAN_SNOW: {
        id: 'HIMALAYAN_SNOW',
        skyColor: 0x8a9bab,
        fogColor: 0x9ca8b2,
        fogDensity: 0.0018,
        ambientColor: 0xb0c4de,
        ambientIntensity: 0.45,
        sunColor: 0xfff5ea,
        sunIntensity: 1.3,
        weather: 'snow',
        groundColor: 0x3d4843,
    },
    MOUNTAIN_PASS: {
        id: 'MOUNTAIN_PASS',
        skyColor: 0x6a7a8a,
        fogColor: 0x7a8a96,
        fogDensity: 0.0025,
        ambientColor: 0xa0b4cc,
        ambientIntensity: 0.35,
        sunColor: 0xeeeeff,
        sunIntensity: 0.9,
        weather: 'light_snow',
        groundColor: 0x2e3832,
    },
    DESERT: {
        id: 'DESERT',
        skyColor: 0xc8a875,
        fogColor: 0xd4b080,
        fogDensity: 0.0008,
        ambientColor: 0xf0c880,
        ambientIntensity: 0.7,
        sunColor: 0xffd070,
        sunIntensity: 2.2,
        weather: 'heat_shimmer',
        groundColor: 0xa08840,
    },
    URBAN_NIGHT: {
        id: 'URBAN_NIGHT',
        skyColor: 0x0a0e18,
        fogColor: 0x111828,
        fogDensity: 0.003,
        ambientColor: 0x223355,
        ambientIntensity: 0.25,
        sunColor: 0x4466aa,
        sunIntensity: 0.3,
        weather: 'overcast',
        groundColor: 0x1a1f28,
    },
    JUNGLE_RAIN: {
        id: 'JUNGLE_RAIN',
        skyColor: 0x1a2a1a,
        fogColor: 0x243424,
        fogDensity: 0.005,
        ambientColor: 0x406040,
        ambientIntensity: 0.3,
        sunColor: 0x608060,
        sunIntensity: 0.6,
        weather: 'heavy_rain',
        groundColor: 0x1f3025,
    },
    FACILITY: {
        id: 'FACILITY',
        skyColor: 0x0a0a0a,
        fogColor: 0x111111,
        fogDensity: 0.006,
        ambientColor: 0x404040,
        ambientIntensity: 0.4,
        sunColor: 0x8888aa,
        sunIntensity: 0.5,
        weather: 'none',
        groundColor: 0x2a2a2a,
    },
};

// ─── 10 Mission definitions ───────────────────────────────────────────────────
export const CAMPAIGN_MISSIONS = [

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 01 — OPERATION TRISHUL SHADOW
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M01',
        index: 0,
        codename: 'TRISHUL SHADOW',
        title: 'OPERATION: TRISHUL SHADOW',
        chapter: 'CHAPTER 1 — THE FIRST SIGNAL',
        location: 'HIMALAYAN BORDER SECTOR, NORTHERN INDIA',
        environment: 'HIMALAYAN_SNOW',
        unlocked: true,
        completed: false,
        playerChoice: null,

        briefing: [
            'A relay station went offline three nights ago.',
            'Yesterday, a patrol disappeared.',
            'Observe remote mountain valley settlement.',
            'Determine who is operating inside the compound.',
            'Locate Hostile Commander KABIR.',
            'Investigate the disappearance of local informant TARA.',
        ],

        primaryObjectives: [
            { id: 'reach_obs_point',     title: 'Reach Observation Point',     desc: 'Move forward through mountain corridor to overwatch ridge [486m].' },
            { id: 'establish_overwatch', title: 'Establish Overwatch',          desc: 'Equip sniper scope and observe enemy compound activity.' },
            { id: 'identify_target',     title: 'Confirm Target: Kabir',        desc: 'Scope in and identify Kabir — dark field jacket, tall, with two guards.' },
            { id: 'investigate_tara',    title: 'Determine Tara\'s Presence',   desc: 'Observe missing informant Tara entering the compound.' },
            { id: 'make_decision',       title: 'Tactical Choice',              desc: 'Decide whether to eliminate Kabir or continue observation.' },
            { id: 'reach_extraction',    title: 'Reach Extraction Point',       desc: 'Relocate on foot through valley to secondary extraction beacon [732m].' },
        ],
        optionalObjectives: [
            { id: 'inspect_patrol_vehicle', title: 'Inspect Abandoned Patrol Vehicle', desc: 'Examine patrol vehicle near forest path for military intelligence.' },
            { id: 'remain_undetected',      title: 'Ghost Reconnaissance',             desc: 'Complete extraction without being spotted by enemy search patrols.' },
        ],

        // Story beats — fired by EventBus during mission
        storyBeats: {
            opening: [
                { char: 'VIKRAM', line: "Rathore. Wake up.", delay: 0 },
                { char: 'ARJUN',  line: "I'm awake, sir.", delay: 2500 },
                { char: 'VIKRAM', line: "Good. Because we're already late.", delay: 5000 },
                { char: 'VIKRAM', line: "A relay station went offline three nights ago.", delay: 8000 },
                { char: 'IMRAN',  line: "Yesterday, a patrol disappeared.", delay: 11000 },
                { char: 'ARJUN',  line: "Enemy?", delay: 13500 },
                { char: 'VIKRAM', line: "We don't know. That's why you're going in quiet.", delay: 15500 },
                { char: 'IMRAN',  line: "That's usually when things get interesting.", delay: 19000 },
            ],
            vehicleFound: [
                { char: 'MEERA',  line: "Rathore, stop. That's the missing patrol vehicle.", delay: 0 },
                { char: 'ARJUN',  line: "Someone removed the radio.", delay: 3000 },
                { char: 'MEERA',  line: "Because they didn't want us listening.", delay: 5500 },
            ],
            obsPointReached: [
                { char: 'IMRAN',  line: "Welcome to the neighborhood.", delay: 0 },
                { char: 'ARJUN',  line: "How many?", delay: 2500 },
                { char: 'IMRAN',  line: "At least eight. Armed. Watching the road.", delay: 4500 },
                { char: 'MEERA',  line: "We're looking for a man called Kabir. Dark jacket. Tall. Usually has two guards.", delay: 7500 },
                { char: 'IMRAN',  line: "That's half the people down there.", delay: 12000 },
                { char: 'MEERA',  line: "Then you'll have to pay attention.", delay: 14000 },
            ],
            scopeIn: [
                { char: 'IMRAN',  line: "Eyes on compound. Take your time. Let him come to you.", delay: 0 },
            ],
            targetVisible: [
                { char: 'IMRAN',  line: "Possible target. Black jacket, near the command building.", delay: 0 },
                { char: 'MEERA',  line: "Wait for confirmation.", delay: 2000 },
            ],
            targetConfirmed: [
                { char: 'MEERA',  line: "That's him. Target confirmed — Kabir.", delay: 0 },
                { char: 'IMRAN',  line: "You've got him, Arjun.", delay: 2500 },
            ],
            taraAppears: [
                { char: 'ARJUN',  line: "Tara?", delay: 0 },
                { char: 'MEERA',  line: "That's impossible.", delay: 1500 },
                { char: 'ARJUN',  line: "You said she was missing.", delay: 3000 },
                { char: 'MEERA',  line: "She was.", delay: 4500 },
                { char: 'MEERA',  line: "Which means someone found her first.", delay: 6000 },
            ],
            choiceA_taken: [
                { char: 'ARJUN',  line: "Taking the shot.", delay: 0 },
                { char: 'IMRAN',  line: "Shot!", delay: 1200 },
                { char: 'MEERA',  line: "Target neutralized. But the compound is going loud — extract immediately!", delay: 3000 },
            ],
            choiceB_observe: [
                { char: 'ARJUN',  line: "Holding fire. Something doesn't feel right.", delay: 0 },
                { char: 'MEERA',  line: "Tara handed Kabir a data device. They're moving. We need that device — track him and extract!", delay: 2000 },
                { char: 'IMRAN',  line: "And compound just went active. Move, Arjun.", delay: 7500 },
            ],
            compoundAlert: [
                { char: 'IMRAN',  line: "Movement on the ridge. They've made us.", delay: 0 },
                { char: 'ARJUN',  line: "How bad?", delay: 2000 },
                { char: 'IMRAN',  line: "About to become worse. Two patrols moving your direction.", delay: 4000 },
            ],
            escape: [
                { char: 'IMRAN',  line: "Two patrols ahead. Left route?", delay: 0 },
                { char: 'ARJUN',  line: "Too exposed.", delay: 2500 },
                { char: 'IMRAN',  line: "Right?", delay: 4000 },
                { char: 'ARJUN',  line: "That's a cliff.", delay: 5500 },
                { char: 'IMRAN',  line: "I knew you'd remember. Push through — go!", delay: 7000 },
            ],
            extractionReached: [
                { char: 'VIKRAM', line: "Good work. Come home, Rathore.", delay: 0 },
            ],
            debrief: [
                { char: 'MEERA',  line: "Rathore, we've analyzed the communications.", delay: 0 },
                { char: 'ARJUN',  line: "And?", delay: 3000 },
                { char: 'MEERA',  line: "This wasn't a weapons operation.", delay: 5000 },
                { char: 'MEERA',  line: "Someone was measuring our response time. Every patrol. Every relay. Every reaction.", delay: 8000 },
                { char: 'ARJUN',  line: "Why?", delay: 14000 },
                { char: 'MEERA',  line: "That's what we're going to find out.", delay: 16000 },
            ],
        },

        // Lines triggered by player actions / idle states
        contextualLines: {
            playerIdleTooLong: [
                { char: 'IMRAN', line: "We've been watching that building for ten minutes." },
                { char: 'IMRAN', line: "Any day now, Arjun." },
                { char: 'IMRAN', line: "I'm not saying hurry. I'm saying... hurry." },
            ],
            playerInjured: [
                { char: 'IMRAN', line: "Rathore, report!" },
                { char: 'ARJUN', line: "Still operational." },
            ],
            enemyAlerted: [
                { char: 'IMRAN', line: "They're searching the ridge — stay low." },
                { char: 'MEERA', line: "Alert status rising. Do not engage unless necessary." },
            ],
            scopeZoomMax: [
                { char: 'IMRAN', line: "Good angle. Watch your breathing." },
            ],
        },

        targetProfile: {
            name: 'KABIR',
            alias: 'Commander Kabir',
            description: 'Height ~1.8m. Dark field jacket. Travels with armed escort of two guards at all times.',
            threat: 'HIGH',
            status: 'ACTIVE',
            notes: 'Possibly operating under an external handler. Identity of handler unknown.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 02 — THE SILENT PASS
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M02',
        index: 1,
        codename: 'SILENT PASS',
        title: 'OPERATION: SILENT PASS',
        chapter: 'CHAPTER 2 — THE DECOY',
        location: 'HIGH-ALTITUDE MOUNTAIN PASS, NORTHERN INDIA',
        environment: 'MOUNTAIN_PASS',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Following intelligence recovered from Mission 1.',
            'Enemy movement detected in high-altitude mountain pass.',
            'Track suspicious convoy activity.',
            'Do not engage — observe and report.',
            'Beware: enemy has begun using decoys.',
        ],

        primaryObjectives: [
            { id: 'reach_pass_overwatch', title: 'Reach Pass Overwatch',       desc: 'Navigate to the ridge overlooking the mountain pass.' },
            { id: 'track_convoy',         title: 'Track Convoy Movement',      desc: 'Observe the convoy moving through the pass. Note: not everything is as it appears.' },
            { id: 'find_real_target',     title: 'Identify Real Activity',     desc: 'Ignore the decoy movement. Locate the true objective.' },
            { id: 'recover_intel',        title: 'Photograph Architect Clue',  desc: 'Mark the encrypted signal equipment for extraction.' },
            { id: 'extract_m02',          title: 'Reach Extraction',           desc: 'Move to helicopter extraction zone at the eastern ridge.' },
        ],
        optionalObjectives: [
            { id: 'decode_signal',   title: 'Intercept Radio Signal', desc: 'Find and photograph the enemy relay equipment for SIGINT.' },
        ],

        storyBeats: {
            opening: [
                { char: 'VIKRAM', line: "The intel from Mission 1 pointed here. Someone is moving something through this pass.", delay: 0 },
                { char: 'MEERA',  line: "The convoy appeared this morning. Eight vehicles. But something about the pattern is wrong.", delay: 5000 },
                { char: 'IMRAN',  line: "Wrong how?", delay: 9500 },
                { char: 'MEERA',  line: "They want us looking left.", delay: 11000 },
            ],
            decoyRevealed: [
                { char: 'IMRAN',  line: "Someone wants us looking left.", delay: 0 },
                { char: 'ARJUN',  line: "And?", delay: 2000 },
                { char: 'IMRAN',  line: "I'm looking right.", delay: 3500 },
            ],
            architectClue: [
                { char: 'MEERA',  line: "Rathore, that signal equipment is not standard issue. Someone has been using it to collect data.", delay: 0 },
                { char: 'ARJUN',  line: "What kind of data?", delay: 5000 },
                { char: 'MEERA',  line: "Response patterns. Radio protocols. Patrol timing. This is a surveillance network.", delay: 7000 },
                { char: 'KAVYA',  line: "Whoever built this — they've been studying us for months.", delay: 13000 },
            ],
            debrief: [
                { char: 'MEERA',  line: "The convoy was empty. Every vehicle — empty.", delay: 0 },
                { char: 'VIKRAM', line: "Then what were they moving?", delay: 4000 },
                { char: 'MEERA',  line: "Nothing. They were watching us react to them.", delay: 6500 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'IMRAN', line: "Keep watching. The decoy works best when we're distracted." },
                { char: 'IMRAN', line: "Don't let them control where you look." },
            ],
        },
        targetProfile: {
            name: 'UNKNOWN SIGNAL SOURCE',
            alias: 'Architect Relay Node',
            description: 'Portable encrypted signal relay. Origin unknown. Design does not match any known group.',
            threat: 'MEDIUM',
            status: 'ACTIVE',
            notes: 'First confirmed evidence of systematic surveillance operation.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 03 — BROKEN RELAY
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M03',
        index: 2,
        codename: 'BROKEN RELAY',
        title: 'OPERATION: BROKEN RELAY',
        chapter: 'CHAPTER 3 — THE NETWORK',
        location: 'MOUNTAIN COMMUNICATIONS STATION, NORTHERN INDIA',
        environment: 'MOUNTAIN_PASS',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'A communications station has been compromised.',
            'Technical team requires armed escort to restore the relay.',
            'Hold position while engineers work.',
            'Protect the team from approaching hostile forces.',
            'Do not let the relay go dark again.',
        ],

        primaryObjectives: [
            { id: 'escort_team',         title: 'Escort Technical Team',      desc: 'Lead Kavya\'s team to the communications relay station.' },
            { id: 'hold_position',       title: 'Establish Defensive Position', desc: 'Hold the perimeter while the team restores communications.' },
            { id: 'eliminate_wave1',     title: 'Repel First Assault',         desc: 'Stop the incoming hostile patrol from reaching the station.' },
            { id: 'protect_kavya',       title: 'Protect Kavya\'s Team',       desc: 'Keep all technical personnel alive throughout the mission.' },
            { id: 'relay_restored',      title: 'Relay Restored',              desc: 'Wait for the relay to come back online.' },
            { id: 'extract_m03',         title: 'Reach Extraction',            desc: 'Move to extraction before secondary wave arrives.' },
        ],
        optionalObjectives: [
            { id: 'recover_enemy_radio', title: 'Recover Enemy Radio', desc: 'Find and recover an enemy radio unit for SIGINT analysis.' },
        ],

        storyBeats: {
            opening: [
                { char: 'KAVYA',  line: "Captain, I need four hours to restore this relay. Think you can keep us alive that long?", delay: 0 },
                { char: 'ARJUN',  line: "Three.", delay: 4500 },
                { char: 'KAVYA',  line: "...I'll work faster.", delay: 6000 },
            ],
            wave1_incoming: [
                { char: 'IMRAN',  line: "Contact! Six hostiles, northeast treeline.", delay: 0 },
                { char: 'ARJUN',  line: "I see them.", delay: 2000 },
                { char: 'KAVYA',  line: "Don't let them near the equipment. Please.", delay: 3500 },
            ],
            kavya_discovery: [
                { char: 'KAVYA',  line: "Captain. I found something inside the relay.", delay: 0 },
                { char: 'ARJUN',  line: "Talk to me.", delay: 2500 },
                { char: 'KAVYA',  line: "Someone has been collecting our response data. Every transmission we've made. Someone has been listening.", delay: 5000 },
                { char: 'MEERA',  line: "That's not possible. This is an encrypted military channel.", delay: 12000 },
                { char: 'KAVYA',  line: "Was encrypted. Past tense.", delay: 15000 },
            ],
            debrief: [
                { char: 'VIKRAM', line: "How long had they been inside our network?", delay: 0 },
                { char: 'KAVYA',  line: "Based on the data logs... six months.", delay: 4000 },
                { char: 'VIKRAM', line: "Six months.", delay: 8000 },
                { char: 'MEERA',  line: "Every operation. Every response. Whoever this is — they know us.", delay: 10000 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'KAVYA', line: "Still working here. Still very much alive. Both great things." },
                { char: 'IMRAN', line: "Don't relax. Second wave is coming." },
            ],
        },
        targetProfile: {
            name: 'RELAY STATION ALPHA',
            alias: 'Indian Army Signal Relay A-7',
            description: 'Mountain communications relay. Critical for northern sector coordination. Currently compromised.',
            threat: 'N/A',
            status: 'COMPROMISED',
            notes: 'Kavya has identified intrusion signatures matching previous Architect patterns.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 04 — THE INFORMANT
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M04',
        index: 3,
        codename: 'THE INFORMANT',
        title: 'OPERATION: THE INFORMANT',
        chapter: 'CHAPTER 4 — THE MISSING PIECE',
        location: 'REMOTE SETTLEMENT, NORTHERN INDIA',
        environment: 'HIMALAYAN_SNOW',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Following Tara\'s appearance at the Mission 1 compound.',
            'Intelligence suggests she may still be in the region.',
            'This is an investigation mission — no immediate combat.',
            'Observe. Follow. Listen.',
            'Find Tara. Understand what she knows.',
        ],

        primaryObjectives: [
            { id: 'enter_settlement',   title: 'Enter Settlement',            desc: 'Move into the remote settlement on foot. Low profile.' },
            { id: 'find_tara_clues',    title: 'Find Tara\'s Trail',          desc: 'Locate three evidence points left by Tara inside the settlement.' },
            { id: 'contact_tara',       title: 'Make Contact with Tara',      desc: 'Wait at the designated location for Tara to approach.' },
            { id: 'receive_intel',      title: 'Receive Intelligence',        desc: 'Listen to Tara\'s information about The Architect.' },
            { id: 'protect_tara',       title: 'Cover Tara\'s Escape',        desc: 'Provide overwatch while Tara safely leaves the settlement.' },
            { id: 'extract_m04',        title: 'Reach Extraction',            desc: 'Move to extraction before hostile follow-up patrols close in.' },
        ],
        optionalObjectives: [
            { id: 'photograph_evidence', title: 'Document Evidence',       desc: 'Photograph Tara\'s hidden intelligence cache for Meera.' },
        ],

        storyBeats: {
            opening: [
                { char: 'MEERA',  line: "Tara was our best contact in this region. If she's alive and operating independently, she's doing it for a reason.", delay: 0 },
                { char: 'ARJUN',  line: "Or she's been turned.", delay: 5000 },
                { char: 'MEERA',  line: "I've considered that.", delay: 7000 },
                { char: 'IMRAN',  line: "So what do we do if she has been?", delay: 9000 },
                { char: 'ARJUN',  line: "We find out first.", delay: 11500 },
            ],
            tara_contact: [
                { char: 'TARA',   line: "You shouldn't have come.", delay: 0 },
                { char: 'ARJUN',  line: "You disappeared.", delay: 2000 },
                { char: 'TARA',   line: "I was trying to find out who was giving the orders.", delay: 4000 },
                { char: 'ARJUN',  line: "And?", delay: 7500 },
                { char: 'TARA',   line: "The man you're looking for doesn't work alone.", delay: 9000 },
                { char: 'TARA',   line: "He works from the outside. He uses people. Turns systems against themselves.", delay: 13000 },
                { char: 'ARJUN',  line: "Does he have a name?", delay: 18000 },
                { char: 'TARA',   line: "Only one they use. The Architect.", delay: 21000 },
            ],
            debrief: [
                { char: 'MEERA',  line: "The Architect. No identity. No face. No location.", delay: 0 },
                { char: 'KAVYA',  line: "But he has a pattern. And now we have a name.", delay: 5000 },
                { char: 'VIKRAM', line: "Find him.", delay: 9000 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'IMRAN', line: "No shooting. This is a listening mission. Try that." },
            ],
        },
        targetProfile: {
            name: 'TARA',
            alias: 'Field Contact: Tara',
            description: 'Former intelligence contact, missing for three months. Reappeared at Mission 1 compound. True allegiance unclear.',
            threat: 'UNKNOWN',
            status: 'ACTIVE — UNCONFIRMED',
            notes: 'If she has not been turned, she may be our most valuable asset.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 05 — DESERT WATCH
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M05',
        index: 4,
        codename: 'DESERT WATCH',
        title: 'OPERATION: DESERT WATCH',
        chapter: 'CHAPTER 5 — THE MISDIRECTION',
        location: 'FICTIONAL WESTERN DESERT SECTOR, INDIA',
        environment: 'DESERT',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'A convoy has been spotted moving through the western desert.',
            'Intel suggests weapons shipment.',
            'Long-range observation mission in extreme heat.',
            'Moving targets at distance — patience required.',
            'CAUTION: Previous mission pattern suggests this may be another decoy.',
        ],

        primaryObjectives: [
            { id: 'reach_desert_ridge',  title: 'Reach Desert Ridge',         desc: 'Climb to the elevated ridge overlooking the desert valley.' },
            { id: 'track_convoy_desert', title: 'Track Convoy Movement',      desc: 'Observe convoy through heat distortion. Note vehicle types and cargo.' },
            { id: 'identify_decoy',      title: 'Identify the Decoy',         desc: 'Determine which convoy element is the genuine operation.' },
            { id: 'mark_real_target',    title: 'Mark the Real Target',       desc: 'Mark the actual operative vehicle for extraction team.' },
            { id: 'extract_m05',         title: 'Reach Extraction',           desc: 'Move to the desert extraction point before sandstorm window closes.' },
        ],
        optionalObjectives: [
            { id: 'count_all_vehicles', title: 'Full Convoy Census', desc: 'Identify and count every vehicle in the convoy — valuable for pattern analysis.' },
        ],

        storyBeats: {
            opening: [
                { char: 'IMRAN',  line: "Hot. Very hot. Who approved a desert deployment?", delay: 0 },
                { char: 'ARJUN',  line: "You volunteered.", delay: 2500 },
                { char: 'IMRAN',  line: "I don't remember that conversation.", delay: 4500 },
                { char: 'MEERA',  line: "The convoy appeared at 0400. Fourteen vehicles. But the pattern is familiar.", delay: 7000 },
                { char: 'ARJUN',  line: "Another decoy.", delay: 11000 },
                { char: 'MEERA',  line: "Maybe. Maybe not. Watch carefully this time.", delay: 13000 },
            ],
            heat_shimmer: [
                { char: 'IMRAN',  line: "The heat's bending everything. Adjust for mirage — your target is probably closer than it looks.", delay: 0 },
            ],
            real_op_found: [
                { char: 'MEERA',  line: "There. Vehicle seven. Civilian registration but military-grade chassis. That's not carrying supplies.", delay: 0 },
                { char: 'KAVYA',  line: "Electronic emissions from that vehicle — encrypted burst transmissions. They're broadcasting.", delay: 5000 },
                { char: 'ARJUN',  line: "Broadcasting to who?", delay: 9500 },
                { char: 'KAVYA',  line: "That's what worries me. The signal is going west.", delay: 11500 },
            ],
            debrief: [
                { char: 'MEERA',  line: "The real operation wasn't the convoy.", delay: 0 },
                { char: 'MEERA',  line: "The convoy was there to make us deploy here. While we watched the desert...", delay: 4500 },
                { char: 'VIKRAM', line: "Something happened somewhere else.", delay: 9000 },
                { char: 'MEERA',  line: "An encrypted signal appeared near the city. We missed it.", delay: 11500 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'IMRAN', line: "The convoy won't wait. Neither will the heat." },
                { char: 'IMRAN', line: "You're squinting, I can tell. Heat shimmer's rough. Keep both eyes open." },
            ],
        },
        targetProfile: {
            name: 'UNKNOWN OPERATIVE VEHICLE',
            alias: 'Desert Convoy — Vehicle Seven',
            description: 'Civilian-registered vehicle with military-grade chassis. Broadcasting encrypted burst transmissions on western frequency.',
            threat: 'HIGH',
            status: 'MOBILE',
            notes: 'Convoy is a distraction. Real operation is elsewhere.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 06 — GHOST SIGNAL
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M06',
        index: 5,
        codename: 'GHOST SIGNAL',
        title: 'OPERATION: GHOST SIGNAL',
        chapter: 'CHAPTER 6 — THE CITY',
        location: 'FICTIONAL URBAN SECTOR, INDIA',
        environment: 'URBAN_NIGHT',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Encrypted signal detected in urban environment.',
            'Team will work across rooftops, industrial zones and railway infrastructure.',
            'Civilian presence is HIGH — extreme caution required.',
            'A difficult choice will arise during the mission.',
            'Choose wisely. Your decision will have consequences.',
        ],

        primaryObjectives: [
            { id: 'reach_rooftop',    title: 'Reach Overwatch Rooftop',   desc: 'Navigate rooftops to gain overwatch position in the industrial district.' },
            { id: 'trace_signal',     title: 'Trace the Ghost Signal',    desc: 'Use Kavya\'s tracking to locate the encrypted broadcast source.' },
            { id: 'urban_choice',     title: 'Tactical Decision',         desc: 'Choose: pursue the suspect OR protect the compromised intelligence contact.' },
            { id: 'extract_m06',      title: 'Reach Extraction',          desc: 'Extract via the railway infrastructure before dawn.' },
        ],
        optionalObjectives: [
            { id: 'photograph_suspect', title: 'Photograph Suspect',   desc: 'Photograph the unidentified operative for Meera\'s database.' },
        ],

        storyBeats: {
            opening: [
                { char: 'KAVYA',  line: "The signal is moving. Whoever's transmitting — they know we're in the city.", delay: 0 },
                { char: 'IMRAN',  line: "Urban recon. My second favorite after anywhere-that-isn't-the-desert.", delay: 5000 },
                { char: 'MEERA',  line: "We have a contact inside the district. If they've been compromised, we need to know.", delay: 9000 },
            ],
            urban_choice_moment: [
                { char: 'KAVYA',  line: "Arjun — suspect is moving north. I can keep the track but I need you on the signal.", delay: 0 },
                { char: 'MEERA',  line: "Rathore, our contact is at the market. They're in trouble. Someone flagged them.", delay: 4000 },
                { char: 'ARJUN',  line: "I can't be in two places.", delay: 9000 },
                { char: 'VIKRAM', line: "Make the call, Captain.", delay: 11000 },
            ],
            chose_suspect: [
                { char: 'ARJUN',  line: "Pursuing the suspect. Meera — get someone to the contact.", delay: 0 },
                { char: 'MEERA',  line: "Understood. Move fast.", delay: 2500 },
            ],
            chose_contact: [
                { char: 'ARJUN',  line: "I'm going for the contact. Kavya — hold the signal as long as you can.", delay: 0 },
                { char: 'KAVYA',  line: "Copy. But Arjun — I'm going to lose him.", delay: 3000 },
            ],
            debrief: [
                { char: 'MEERA',  line: "The signal source was a relay point. Not a person.", delay: 0 },
                { char: 'KAVYA',  line: "But the transmissions were going somewhere. I traced the last burst.", delay: 5000 },
                { char: 'KAVYA',  line: "Northeast. Deep forest. That's where the Architect's communications are coming from.", delay: 9000 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'IMRAN', line: "Urban rooftop. City below. Time moving. Classic." },
            ],
        },
        targetProfile: {
            name: 'GHOST SIGNAL SOURCE',
            alias: 'Architect Relay Point — Urban',
            description: 'Mobile encrypted broadcast relay. Signal pattern matches previous Architect communications.',
            threat: 'HIGH',
            status: 'ACTIVE — MOBILE',
            notes: 'Choice in this mission affects Mission 7 intel access.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 07 — THE INSIDE MAN
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M07',
        index: 6,
        codename: 'THE INSIDE MAN',
        title: 'OPERATION: THE INSIDE MAN',
        chapter: 'CHAPTER 7 — THE FALSE TRAIL',
        location: 'MILITARY INTELLIGENCE COMPOUND, INDIA',
        environment: 'URBAN_NIGHT',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Evidence suggests someone inside our intelligence network is leaking information.',
            'The Architect knows our moves too accurately.',
            'This is an investigation mission — no traditional sniper objective.',
            'OBSERVE. FOLLOW. IDENTIFY. PROTECT. DECIDE.',
            'WARNING: The obvious answer may be wrong.',
        ],

        primaryObjectives: [
            { id: 'observe_suspects',   title: 'Observe the Suspects',       desc: 'Watch the three flagged personnel without being noticed.' },
            { id: 'follow_trail',       title: 'Follow the Evidence Trail',  desc: 'Track the suspicious activity to its source.' },
            { id: 'identify_innocent',  title: 'Clear the Innocent',         desc: 'Discover that the apparent traitor is being framed.' },
            { id: 'find_manipulator',   title: 'Find the Real Source',       desc: 'Identify who is actually manipulating the investigation.' },
            { id: 'extract_m07',        title: 'Secure the Evidence',        desc: 'Recover proof of the manipulation and extract safely.' },
        ],
        optionalObjectives: [
            { id: 'protect_suspect',   title: 'Protect the Falsely Accused', desc: 'Ensure the innocent suspect is not harmed during the investigation.' },
        ],

        storyBeats: {
            opening: [
                { char: 'VIKRAM', line: "I don't like this conversation.", delay: 0 },
                { char: 'MEERA',  line: "Neither do I, sir. But the evidence points inside our network.", delay: 3000 },
                { char: 'ARJUN',  line: "Who?", delay: 7000 },
                { char: 'MEERA',  line: "That's what Rathore is going to find out.", delay: 9000 },
            ],
            innocent_revealed: [
                { char: 'ARJUN',  line: "This evidence has been placed. Someone put it here.", delay: 0 },
                { char: 'MEERA',  line: "What?", delay: 3000 },
                { char: 'ARJUN',  line: "The trail is too clean. Someone wants us to find exactly this.", delay: 5000 },
                { char: 'IMRAN',  line: "The Architect isn't just collecting data. He's rewriting it.", delay: 10000 },
            ],
            debrief: [
                { char: 'MEERA',  line: "He manipulated our own investigation. Used our process against us.", delay: 0 },
                { char: 'KAVYA',  line: "He knew exactly how we'd react to this kind of evidence. He's done this before.", delay: 6000 },
                { char: 'ARJUN',  line: "He's been inside our procedures. Not just our communications.", delay: 12000 },
                { char: 'VIKRAM', line: "Find him. End this.", delay: 16000 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'IMRAN', line: "Observation takes time. But not this much time." },
            ],
        },
        targetProfile: {
            name: 'THE MANIPULATOR',
            alias: 'Unknown Internal Asset',
            description: 'Unknown individual with deep knowledge of Indian intelligence investigation procedures. Capable of planting evidence without detection.',
            threat: 'CRITICAL',
            status: 'UNIDENTIFIED',
            notes: 'This is not the Architect directly. This is a subordinate — or another manipulation.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 08 — BLACK MONSOON
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M08',
        index: 7,
        codename: 'BLACK MONSOON',
        title: 'OPERATION: BLACK MONSOON',
        chapter: 'CHAPTER 8 — THE RECORD',
        location: 'FICTIONAL NORTHEASTERN JUNGLE, INDIA',
        environment: 'JUNGLE_RAIN',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Missing military personnel reported in northeastern jungle sector.',
            'Heavy monsoon rain. Dense forest. Extremely low visibility.',
            'Search and recover mission.',
            'Expect underground facility — proceed with extreme caution.',
            'Whatever you find inside — the Architect has been watching.',
        ],

        primaryObjectives: [
            { id: 'enter_jungle',        title: 'Enter the Jungle Sector',     desc: 'Navigate deep jungle under heavy rain and low visibility.' },
            { id: 'find_missing',        title: 'Locate Missing Personnel',    desc: 'Search for the missing unit. Follow the signals.' },
            { id: 'find_facility',       title: 'Discover Underground Facility', desc: 'Locate and breach the hidden underground communications bunker.' },
            { id: 'recover_records',     title: 'Recover the Records',         desc: 'Download the Architect\'s surveillance files from the facility.' },
            { id: 'escape_facility',     title: 'Escape Before Shutdown',      desc: 'Extract before the facility\'s automatic lockdown activates.' },
            { id: 'extract_m08',         title: 'Reach Extraction',            desc: 'Move to the jungle extraction point before hostile teams arrive.' },
        ],
        optionalObjectives: [
            { id: 'recover_missing_alive', title: 'Recover Personnel Alive', desc: 'Find the missing soldiers before entering the facility.' },
        ],

        storyBeats: {
            opening: [
                { char: 'IMRAN',  line: "Rain. Dense jungle. Zero visibility. Perfect conditions.", delay: 0 },
                { char: 'ARJUN',  line: "Quiet.", delay: 3000 },
                { char: 'IMRAN',  line: "You know, I was being sincere.", delay: 4500 },
                { char: 'MEERA',  line: "The missing unit's last signal came from deep inside. They found something.", delay: 7500 },
            ],
            facility_found: [
                { char: 'KAVYA',  line: "Captain. This is not a natural structure. Someone built this down here. It's... professional.", delay: 0 },
                { char: 'ARJUN',  line: "How long has it been here?", delay: 5000 },
                { char: 'KAVYA',  line: "The equipment dates back... years.", delay: 7500 },
            ],
            records_found: [
                { char: 'KAVYA',  line: "Arjun. I found something.", delay: 0 },
                { char: 'ARJUN',  line: "Talk.", delay: 2500 },
                { char: 'KAVYA',  line: "Every mission. Mission 1. Mission 2. Mission 3. He has files on all of them.", delay: 4000 },
                { char: 'KAVYA',  line: "He has files... on us. On you. He has been watching you, Arjun. Specifically.", delay: 9000 },
                { char: 'ARJUN',  line: "Me.", delay: 15000 },
                { char: 'KAVYA',  line: "You made seven decisions across eight missions. He predicted six of them.", delay: 17000 },
            ],
            debrief: [
                { char: 'MEERA',  line: "He's been profiling you since Mission 1. Not studying India. Studying you.", delay: 0 },
                { char: 'ARJUN',  line: "Then he knows I'm coming for him.", delay: 7000 },
                { char: 'MEERA',  line: "He's counting on it.", delay: 9500 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'IMRAN', line: "Keep moving. Rain's getting heavier. Tracks won't last much longer." },
            ],
        },
        targetProfile: {
            name: 'UNDERGROUND FACILITY',
            alias: 'Architect Communications Bunker',
            description: 'Hidden underground communications and data facility. Contains surveillance records spanning multiple years.',
            threat: 'HIGH',
            status: 'ACTIVE',
            notes: 'He has been watching Arjun personally. Six out of seven decisions predicted correctly.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 09 — THE ARCHITECT
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M09',
        index: 8,
        codename: 'THE ARCHITECT',
        title: 'OPERATION: THE ARCHITECT',
        chapter: 'CHAPTER 9 — THE CONTACT',
        location: 'COORDINATES UNKNOWN',
        environment: 'FACILITY',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'The Architect has made direct contact.',
            'His location has been partially traced.',
            'This mission is reconnaissance only.',
            'We are not ready for direct confrontation.',
            'Understand his position. Prepare for Mission 10.',
        ],

        primaryObjectives: [
            { id: 'reach_transmission', title: 'Reach Transmission Point',   desc: 'Navigate to the location where the Architect\'s signal is strongest.' },
            { id: 'receive_message',    title: 'Receive the Architect\'s Message', desc: 'The Architect is already aware of your presence.' },
            { id: 'trace_location',     title: 'Trace His Location',          desc: 'While communicating, use Kavya\'s tools to trace the signal source.' },
            { id: 'survive_ambush',     title: 'Survive the Response',        desc: 'He will send a response team. Survive and extract.' },
            { id: 'extract_m09',        title: 'Reach Extraction',            desc: 'Extract with the traced coordinates.' },
        ],
        optionalObjectives: [
            { id: 'full_trace',         title: 'Complete Signal Trace',       desc: 'Keep Kavya connected long enough for a full location trace.' },
        ],

        storyBeats: {
            architect_contact: [
                { char: 'ARCHITECT', line: "You spent eight missions trying to find me.", delay: 0 },
                { char: 'ARJUN',    line: "I know.", delay: 4000 },
                { char: 'ARCHITECT', line: "I spent eight missions learning you.", delay: 6000 },
                { char: 'ARJUN',    line: "Then you should know I'm coming.", delay: 10000 },
                { char: 'ARCHITECT', line: "That's exactly what I wanted.", delay: 13000 },
            ],
            architect_reveals: [
                { char: 'ARCHITECT', line: "You made a decision in Mission 1. Another in Mission 3. Another in Mission 6.", delay: 0 },
                { char: 'ARCHITECT', line: "Each one exactly as I predicted. You are very consistent, Captain.", delay: 7000 },
                { char: 'ARJUN',    line: "Then I'll do something unpredictable.", delay: 13000 },
                { char: 'ARCHITECT', line: "That. Is. Also. Predicted.", delay: 16000 },
            ],
            ambush: [
                { char: 'KAVYA',  line: "Response team incoming! He knew we'd trace him — it's a trap!", delay: 0 },
                { char: 'IMRAN',  line: "Of course it is. Move! Move!", delay: 3000 },
            ],
            debrief: [
                { char: 'KAVYA',  line: "I got the trace. Partial, but it's enough.", delay: 0 },
                { char: 'MEERA',  line: "Where?", delay: 3000 },
                { char: 'KAVYA',  line: "There's a facility. Old. Hidden. That's where the last signal came from.", delay: 5000 },
                { char: 'VIKRAM', line: "Mission 10. We end this.", delay: 10000 },
                { char: 'ARJUN',  line: "He'll know we're coming.", delay: 13000 },
                { char: 'VIKRAM', line: "Then we use that.", delay: 15500 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'KAVYA', line: "Still holding the trace. Don't let the signal drop." },
            ],
        },
        targetProfile: {
            name: 'THE ARCHITECT',
            alias: 'Unknown — No Real Name Confirmed',
            description: 'Calm. Methodical. Highly intelligent. Operates entirely through prediction and manipulation. Has never been seen directly.',
            threat: 'CRITICAL',
            status: 'LOCATED — PARTIALLY',
            notes: 'He expected this contact. He may be using it to study our response one final time.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 10 — THE LAST SIGNAL
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M10',
        index: 9,
        codename: 'THE LAST SIGNAL',
        title: 'OPERATION: THE LAST SIGNAL',
        chapter: 'CHAPTER 10 — THE CHOICE',
        location: 'HIDDEN COMMAND FACILITY — LOCATION CLASSIFIED',
        environment: 'FACILITY',
        unlocked: false,
        completed: false,
        playerChoice: null, // 'ENDING_A', 'ENDING_B', 'ENDING_C'

        briefing: [
            'The Architect\'s command facility has been located.',
            'The entire campaign has led to this.',
            'Infiltrate. Gather intelligence. Identify the Architect.',
            'Stop the operation.',
            'Then: make your final decision.',
            'Every choice you made in this campaign has meaning.',
        ],

        primaryObjectives: [
            { id: 'infiltrate',          title: 'Infiltrate the Facility',     desc: 'Enter the hidden command facility without triggering full lockdown.' },
            { id: 'gather_intel',        title: 'Gather Final Intelligence',   desc: 'Recover the Architect\'s master operation files.' },
            { id: 'identify_architect',  title: 'Identify the Architect',      desc: 'See his face for the first time.' },
            { id: 'protect_team_final',  title: 'Protect the Team',            desc: 'Keep Imran, Meera, and Kavya operational throughout the facility.' },
            { id: 'stop_operation',      title: 'Stop the Operation',          desc: 'Destroy or disable the Architect\'s master control system.' },
            { id: 'final_choice',        title: 'Final Decision',              desc: 'Choose: complete the mission, pursue the Architect, or save the team.' },
        ],
        optionalObjectives: [
            { id: 'full_team_safe',      title: 'Full Team Extraction',       desc: 'Extract all team members safely.' },
            { id: 'architect_captured',  title: 'Architect Captured',         desc: 'Bring the Architect in alive.' },
        ],

        storyBeats: {
            opening: [
                { char: 'VIKRAM', line: "Every mission has led here. Every decision. This is the end of it.", delay: 0 },
                { char: 'ARJUN',  line: "He knows we're coming.", delay: 5000 },
                { char: 'VIKRAM', line: "Yes.", delay: 7000 },
                { char: 'IMRAN',  line: "And we're going anyway.", delay: 9000 },
                { char: 'ARJUN',  line: "We're going anyway.", delay: 11500 },
            ],
            architect_identified: [
                { char: 'KAVYA',  line: "I see him. Arjun — that's him. That's the Architect.", delay: 0 },
                { char: 'ARJUN',  line: "Got him.", delay: 3000 },
                { char: 'MEERA',  line: "He's looking right at the camera. He knew we'd reach this room.", delay: 5000 },
            ],
            final_choice_prompt: [
                { char: 'VIKRAM', line: "Rathore. Operation is complete. The facility is compromised. Get your team out.", delay: 0 },
                { char: 'IMRAN',  line: "Arjun — he's moving. If you go now—", delay: 5000 },
                { char: 'KAVYA',  line: "Team is pinned down in Section C. We need extraction.", delay: 8000 },
                { char: 'ARJUN',  line: "...", delay: 11000 },
            ],
            ending_A: [
                { char: 'ARJUN',  line: "Extracting with team. Mission complete.", delay: 0 },
                { char: 'IMRAN',  line: "Smart call.", delay: 3000 },
                { char: 'MEERA',  line: "The operation is stopped. He'll rebuild, but not here. Not now.", delay: 5500 },
                { char: 'ARJUN',  line: "Then we'll be ready when he does.", delay: 11000 },
            ],
            ending_B: [
                { char: 'ARJUN',  line: "I'm going after him. Imran — get them out.", delay: 0 },
                { char: 'IMRAN',  line: "Arjun—", delay: 2000 },
                { char: 'ARJUN',  line: "That's an order, Imran.", delay: 3500 },
            ],
            ending_C: [
                { char: 'ARJUN',  line: "He gets away. My team comes home. Every time.", delay: 0 },
                { char: 'KAVYA',  line: "Rathore...", delay: 3000 },
                { char: 'ARJUN',  line: "Move. Now.", delay: 4500 },
                { char: 'IMRAN',  line: "Follow the captain!", delay: 6000 },
            ],
        },
        contextualLines: {
            playerIdleTooLong: [
                { char: 'IMRAN', line: "This is it, Arjun. Let's finish it." },
            ],
        },
        targetProfile: {
            name: 'THE ARCHITECT',
            alias: 'Unknown Real Identity',
            description: 'Male. Middle-aged. Calm. Methodical. Has evaded identification for the entire campaign. He will not run. He has already planned for your arrival.',
            threat: 'CRITICAL',
            status: 'LOCATED',
            notes: 'He is the target. He always was.',
        },

        endings: {
            ENDING_A: {
                title: 'THE MISSION',
                subtitle: 'Complete the objective. The team comes home.',
                text: 'Arjun completes the strategic objective. The Architect\'s operation is stopped. The facility is destroyed. The team extracts safely.\n\nThe Architect escapes.\n\nBut the immediate threat is over. And everyone under Arjun\'s command comes home.\n\n"Sometimes," Arjun says on the helicopter back, "stopping the operation is enough. He can\'t rebuild what we destroyed today."\n\nImran nods.\n\n"He\'ll be back," Meera says.\n\n"So will we," says Arjun.',
            },
            ENDING_B: {
                title: 'THE HUNT',
                subtitle: 'The Architect ends here.',
                text: 'Arjun pursues the Architect through the facility.\n\nHe finds him.\n\nFacing him for the first time, the Architect is quiet.\n\n"You deviated," the Architect says. "I didn\'t predict this."\n\n"I know," says Arjun.\n\nThe Architect is taken into custody. The operation collapses.\n\nThe team makes it out — barely. But the Architect will not strike again.',
            },
            ENDING_C: {
                title: 'THE TEAM',
                subtitle: 'No one gets left behind. Not again.',
                text: 'Arjun abandons the pursuit.\n\nHe reaches Kavya\'s position, extracts the team, brings everyone home.\n\nThe Architect escapes.\n\nLater, alone, Arjun looks at the mission files. He could have had him. He chose not to.\n\nImran finds him.\n\n"You made the right call," Imran says.\n\n"I made the call I could live with," says Arjun.\n\n"That\'s the same thing."\n\nThe Architect is still out there.\n\nBut Arjun knows something now. He knows exactly what kind of soldier he is.\n\nAnd so does the Architect.',
            },
        },
    },
];

export const CAMPAIGN_META = {
    title: 'ELITE SNIPER',
    subtitle: 'SHADOWS OF INDIA',
    version: '1.0',
    totalMissions: 10,
    protagonist: {
        name: 'CAPTAIN ARJUN RATHORE',
        age: 31,
        role: 'Reconnaissance & Precision Specialist',
        origin: 'Rajasthan',
    },
};

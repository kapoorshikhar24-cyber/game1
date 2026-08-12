/**
 * CampaignData.js
 * All 10 mission definitions for Elite Sniper: Shadows of India
 * Captain Arjun Rathore's full campaign against The Architect
 */

// ─── Character voice colors ───────────────────────────────────────────────────
export const CHARACTERS = {
    ARJUN:    { name: 'CAPTAIN ARJUN RATHORE',  color: '#60a5fa', short: 'ARJUN'    },
    MEERA:    { name: 'MAJOR MEERA SEN',          color: '#f472b6', short: 'MEERA'    },
    KABIR:    { name: 'KABIR',                    color: '#f59e0b', short: 'KABIR'    },
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

// ─── 10 Campaign Mission definitions ──────────────────────────────────────────
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
            'Radio transmissions have disappeared and patrol routes were altered.',
            'Infiltrate the Himalayan border sector before sunrise.',
            'Reach observation ridge and scope enemy compound.',
            'Identify Hostile Commander Kabir.',
            'Determine what the hostile network is preparing.',
            'Investigate the unexpected presence of informant Tara.',
        ],

        primaryObjectives: [
            { id: 'reach_obs_point',     title: 'Reach Observation Ridge',     desc: 'Approach before sunrise and secure overwatch position.' },
            { id: 'establish_overwatch', title: 'Reconnaissance & Observation',desc: 'Equip sniper scope to observe compound activity.' },
            { id: 'identify_kabir',      title: 'Target Identification: Kabir',desc: 'Locate hostile commander Kabir entering compound.' },
            { id: 'observe_tara',        title: 'Unexpected Contact: Tara',    desc: 'Observe missing informant Tara meeting Kabir.' },
            { id: 'tactical_choice_m01', title: 'Tactical Decision',           desc: 'Choose: Take the shot OR continue observing.' },
            { id: 'extract_m01',         title: 'Extraction',                  desc: 'Evacuate valley under compound lockdown or stealth alert.' },
        ],
        optionalObjectives: [
            { id: 'investigate_environment', title: 'Environmental Investigation', desc: 'Scan compound perimeter for secondary signal emitters.' },
            { id: 'remain_ghost_m01',        title: 'Ghost Reconnaissance',        desc: 'Complete extraction without taking direct player damage.' },
        ],

        storyBeats: {
            opening: [
                { char: 'MEERA',  line: "Rathore, reach the observation ridge before sunrise.", delay: 0 },
                { char: 'ARJUN',  line: "In position. Sector is quiet.", delay: 2500 },
                { char: 'MEERA',  line: "Too quiet. Radios went silent 3 hours ago.", delay: 5000 },
            ],
            obsPointReached: [
                { char: 'ARJUN',  line: "Eyes on compound. Multiple armed guards.", delay: 0 },
                { char: 'MEERA',  line: "Identify Kabir. Determine what they're preparing.", delay: 2500 },
            ],
            targetConfirmed: [
                { char: 'ARJUN',  line: "Target identified — Kabir.", delay: 0 },
            ],
            taraAppears: [
                { char: 'ARJUN',  line: "Hold on... Tara just entered the compound.", delay: 0 },
                { char: 'MEERA',  line: "Tara? She was reported dead during the last operation!", delay: 2500 },
                { char: 'ARJUN',  line: "She's standing right next to Kabir.", delay: 5000 },
            ],
            choiceA_taken: [
                { char: 'ARJUN',  line: "Taking the shot on Kabir.", delay: 0 },
                { char: 'MEERA',  line: "Kabir is down! Compound is going into immediate lockdown! Extract now!", delay: 2000 },
            ],
            choiceB_observe: [
                { char: 'ARJUN',  line: "Holding fire. Continuing observation.", delay: 0 },
                { char: 'MEERA',  line: "They're leaving together... Kabir isn't preparing an attack. He's searching for something.", delay: 2500 },
            ],
            debrief: [
                { char: 'MEERA',  line: "Rathore, transmission recovered... corrupted.", delay: 0 },
                { char: 'ARJUN',  line: "Can you decode it?", delay: 2500 },
                { char: 'MEERA',  line: "Only three words recovered... 'The signal is active.'", delay: 5000 },
            ],
        },

        targetProfile: {
            name: 'KABIR',
            alias: 'Former Intelligence Operative',
            description: 'Former reliable intel agent. Now coordinating network in Himalayan sector.',
            threat: 'HIGH',
            status: 'ACTIVE',
            notes: 'Appears to believe he is exposing a greater threat.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 02 — THE LOST PATROL
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M02',
        index: 1,
        codename: 'THE LOST PATROL',
        title: 'OPERATION: THE LOST PATROL',
        chapter: 'CHAPTER 2 — TRACKS IN THE SNOW',
        location: 'MOUNTAIN SUPPLY ROUTE, NORTHERN INDIA',
        environment: 'MOUNTAIN_PASS',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Investigate missing Indian patrol vehicle on mountain supply route.',
            'Patrol vanished without sending distress signal.',
            'Track environmental clues left by missing soldiers.',
            'Locate and recover damaged field recorder.',
            'Determine if Kabir was involved.',
        ],

        primaryObjectives: [
            { id: 'reach_supply_route', title: 'Reconnaissance Mountain Route', desc: 'Move covertly along mountain supply route.' },
            { id: 'investigate_clues',  title: 'Environmental Tracking',       desc: 'Examine abandoned patrol tracks and discarded gear.' },
            { id: 'find_recorder',      title: 'Recover Damaged Field Recorder',desc: 'Locate destroyed vehicle and extract recorder data.' },
            { id: 'sub-station_scout',  title: 'Long-Range Observation',        desc: 'Observe unauthorized communications station.' },
            { id: 'extract_m02',        title: 'Tactical Extraction',           desc: 'Extract with audio recording.' },
        ],
        optionalObjectives: [
            { id: 'avoid_detection_m02', title: 'Ghost Tracking', desc: 'Complete tracking without alerting hostile mountain patrols.' },
        ],

        storyBeats: {
            opening: [
                { char: 'MEERA',  line: "Patrol vehicle disappeared 12 hours ago without distress signal.", delay: 0 },
                { char: 'ARJUN',  line: "I'll find out why.", delay: 2500 },
            ],
            recorderFound: [
                { char: 'ARJUN',  line: "Found the vehicle. Damaged field recorder recovered.", delay: 0 },
                { char: 'MEERA',  line: "Playback available?", delay: 2500 },
                { char: 'ARJUN',  line: "Fragments only... Kabir's voice is on it.", delay: 5000 },
            ],
            storyReveal: [
                { char: 'MEERA',  line: "The patrol uncovered an unauthorized communications network buried beneath the mountains.", delay: 0 },
            ],
            debrief: [
                { char: 'TARA',   line: "[RECORDER AUDIO] If Arjun finds this, don't let him trust the command.", delay: 0 },
                { char: 'ARJUN',  line: "Meera... that was Tara's voice.", delay: 4000 },
            ],
        },

        targetProfile: {
            name: 'BURIED NETWORK NODE',
            alias: 'Sub-surface Array',
            description: 'Unauthorized signal network buried under mountain rock.',
            threat: 'MEDIUM',
            status: 'ACTIVE',
            notes: 'Contains recordings mentioning command distrust.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 03 — ECHO UNDER SNOW
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M03',
        index: 2,
        codename: 'ECHO UNDER SNOW',
        title: 'OPERATION: ECHO UNDER SNOW',
        chapter: 'CHAPTER 3 — COMPROMISED CHAIN',
        location: 'ABANDONED MOUNTAIN COMMUNICATIONS STATION',
        environment: 'MOUNTAIN_PASS',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Infiltrate abandoned mountain communications facility.',
            'Facility has been inactive for years, but recently powered on.',
            'Investigate electronic transmissions.',
            'Determine who is manipulating intelligence sent to military units.',
        ],

        primaryObjectives: [
            { id: 'infiltrate_station', title: 'Infiltrate Station',            desc: 'Breach perimeter of abandoned facility.' },
            { id: 'electronic_invest',  title: 'Electronic Investigation',      desc: 'Access terminal to decrypt recent signal logs.' },
            { id: 'sniper_overwatch',   title: 'Sniper Overwatch',              desc: 'Provide overwatch against approaching hostiles.' },
            { id: 'extract_m03',        title: 'Extract Intel Data',            desc: 'Extract before hostile intercept team locks down facility.' },
        ],
        optionalObjectives: [
            { id: 'no_alarm_m03', title: 'Silent Operator', desc: 'Infiltrate without triggering security alarms.' },
        ],

        storyBeats: {
            opening: [
                { char: 'ARJUN',  line: "Inside facility. Old equipment, but powered on.", delay: 0 },
                { char: 'MEERA',  line: "Find the terminal. See what they were transmitting.", delay: 2500 },
            ],
            terminalAccessed: [
                { char: 'ARJUN',  line: "Transmissions are encrypted. Someone has been altering orders sent to military units.", delay: 0 },
                { char: 'MEERA',  line: "That's impossible. Only internal command has those encryption keys.", delay: 3500 },
                { char: 'ARJUN',  line: "Then someone inside intelligence is feeding them.", delay: 6500 },
            ],
            debrief: [
                { char: 'ARJUN',  line: "Meera... my own mission orders came through this channel.", delay: 0 },
                { char: 'MEERA',  line: "Rathore, stay calm. We need to verify everything.", delay: 3000 },
            ],
        },

        targetProfile: {
            name: 'COMPROMISED RELAY TERMINAL',
            alias: 'Node 03',
            description: 'Legacy relay feeding altered orders to active Indian military units.',
            threat: 'HIGH',
            status: 'COMPROMISED',
            notes: 'Confirms internal intelligence leaks.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 04 — WHITEOUT
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M04',
        index: 3,
        codename: 'WHITEOUT',
        title: 'OPERATION: WHITEOUT',
        chapter: 'CHAPTER 4 — ALONE IN THE STORM',
        location: 'HIGH-ALTITUDE MOUNTAIN PASS',
        environment: 'HIMALAYAN_SNOW',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Severe high-altitude blizzard disables all comms and satellite support.',
            'Arjun is isolated in whiteout weather.',
            'Navigate pass using survival tracking skills.',
            'Identify mysterious operator tracking Arjun\'s route.',
        ],

        primaryObjectives: [
            { id: 'survive_pass',      title: 'High-Altitude Survival',        desc: 'Navigate low visibility mountain pass.' },
            { id: 'track_operator',    title: 'Track Shadow Operator',         desc: 'Follow footprints of operator following your movement.' },
            { id: 'recover_belongings',title: 'Investigate Missing Soldier',   desc: 'Inspect personal belongings found in snow shelter.' },
            { id: 'restore_comms',     title: 'Restore Emergency Beacon',      desc: 'Climb to high spire and re-establish radio contact.' },
        ],
        optionalObjectives: [
            { id: 'conserve_supplies', title: 'Resource Efficiency', desc: 'Navigate storm without using thermal vision aids.' },
        ],

        storyBeats: {
            opening: [
                { char: 'SYSTEM', line: "[ WARNING: COMMS LINK LOST — WHITEOUT CONDITIONS ]", delay: 0 },
                { char: 'ARJUN',  line: "Comms dead. I'm on my own.", delay: 2500 },
            ],
            findingBelongings: [
                { char: 'ARJUN',  line: "Found a pack... military issue. A photograph of a soldier with his family.", delay: 0 },
                { char: 'ARJUN',  line: "This conflict is spreading far beyond the frontline.", delay: 3500 },
            ],
            commsRestored: [
                { char: 'ARJUN',  line: "Beacon active. Meera, do you copy?", delay: 0 },
                { char: 'MEERA',  line: "Arjun... thank god. Listen to me... come home.", delay: 2500 },
                { char: 'ARJUN',  line: "Meera? Signal is cutting out again—", delay: 5000 },
                { char: 'SYSTEM', line: "[ TRANSMISSION TERMINATED ]", delay: 7000 },
            ],
        },

        targetProfile: {
            name: 'UNKNOWN TRACKER',
            alias: 'Shadow Operator',
            description: 'Sole operator following Arjun through blizzard conditions.',
            threat: 'MEDIUM',
            status: 'UNKNOWN',
            notes: 'Pacing suggests keeping distance rather than engaging.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 05 — THE INFORMANT
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M05',
        index: 4,
        codename: 'THE INFORMANT',
        title: 'OPERATION: THE INFORMANT',
        chapter: 'CHAPTER 5 — SHADOWS IN THE VILLAGE',
        location: 'REMOTE MOUNTAIN VILLAGE',
        environment: 'HIMALAYAN_SNOW',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Locate Tara in a remote Himalayan mountain village.',
            'Discover why she went missing and her relationship with Kabir.',
            'Conduct village surveillance and protective overwatch.',
            'Make pivotal decision: Extract Tara OR follow her to Kabir.',
        ],

        primaryObjectives: [
            { id: 'village_surveillance',title: 'Village Surveillance',         desc: 'Locate Tara in remote settlement without disturbing locals.' },
            { id: 'confront_tara',      title: 'Confront Tara',                desc: 'Speak with Tara to learn the truth about informant network.' },
            { id: 'major_choice_m05',   title: 'Major Decision',               desc: 'Extract Tara immediately OR Follow her to Kabir.' },
            { id: 'follow_or_extract',  title: 'Execute Choice',               desc: 'Complete selected path to reveal hidden communication hub.' },
        ],
        optionalObjectives: [
            { id: 'protect_civilians', title: 'Civilian Overwatch', desc: 'Prevent hostile patrols from harassing village residents.' },
        ],

        storyBeats: {
            opening: [
                { char: 'ARJUN',  line: "Tara. You're alive.", delay: 0 },
                { char: 'TARA',   line: "I never betrayed India, Arjun. I disappeared because someone used informants to manipulate both sides.", delay: 2500 },
                { char: 'TARA',   line: "Kabir found out too. We've been investigating independently.", delay: 6000 },
            ],
            choiceExtract: [
                { char: 'ARJUN',  line: "I'm extracting you right now, Tara. It's not safe.", delay: 0 },
                { char: 'TARA',   line: "You're missing the bigger picture, Arjun!", delay: 2500 },
            ],
            choiceFollow: [
                { char: 'ARJUN',  line: "Lead me to Kabir. I need answers.", delay: 0 },
                { char: 'TARA',   line: "Keep up and stay low.", delay: 2000 },
            ],
            kabirDirectContact: [
                { char: 'KABIR',  line: "You still think you're hunting me, Arjun?", delay: 0 },
                { char: 'KABIR',  line: "...You're hunting the people who sent you.", delay: 3500 },
            ],
        },

        targetProfile: {
            name: 'TARA',
            alias: 'Former Informant',
            description: 'Former Indian informant who faked death after discovering intel manipulation.',
            threat: 'LOW',
            status: 'ACTIVE',
            notes: 'Holds key evidence connecting intelligence command to false flag ops.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 06 — BROKEN CHAIN
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M06',
        index: 5,
        codename: 'BROKEN CHAIN',
        title: 'OPERATION: BROKEN CHAIN',
        chapter: 'CHAPTER 6 — QUESTIONING COMMAND',
        location: 'MOUNTAIN INTELLIGENCE FACILITY',
        environment: 'FACILITY',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Return to base sector to investigate altered command structure.',
            'Collect internal evidence without triggering internal security alerts.',
            'Uncover covert organization manipulating border intelligence.',
        ],

        primaryObjectives: [
            { id: 'infiltrate_base',   title: 'Covert Facility Infiltration', desc: 'Access command archives undetected.' },
            { id: 'collect_evidence',  title: 'Collect Evidence',             desc: 'Download logs proving synthetic war escalation.' },
            { id: 'meera_contact',     title: 'Secret Contact: Meera',        desc: 'Meet Major Meera Sen off-record.' },
            { id: 'extract_m06',       title: 'Facility Extraction',          desc: 'Evacuate facility with classified files.' },
        ],
        optionalObjectives: [
            { id: 'no_lethal_guards', title: 'Non-Lethal Approach', desc: 'Avoid killing friendly base guards during infiltration.' },
        ],

        storyBeats: {
            opening: [
                { char: 'ARJUN',  line: "Orders have changed. Commands are coming from an unlisted server.", delay: 0 },
                { char: 'MEERA',  line: "Arjun, do not use official radio channels.", delay: 3000 },
            ],
            reveal: [
                { char: 'ARJUN',  line: "They aren't trying to win a battle. They're making both sides believe war is inevitable.", delay: 0 },
            ],
            newMissionFromMeera: [
                { char: 'MEERA',  line: "Arjun... I am giving you a new mission off the record. Find Kabir. Not to kill him... to listen to him.", delay: 0 },
            ],
        },

        targetProfile: {
            name: 'THE SHADOW ARCHITECT NETWORK',
            alias: 'Covert Cell',
            description: 'Internal conspiracy manipulating border intelligence to force open war.',
            threat: 'CRITICAL',
            status: 'OPERATIONAL',
            notes: 'Operates within official military intelligence channels.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 07 — THE SHADOW NETWORK
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M07',
        index: 6,
        codename: 'THE SHADOW NETWORK',
        title: 'OPERATION: THE SHADOW NETWORK',
        chapter: 'CHAPTER 7 — UNLIKELY ALLIES',
        location: 'REMOTE MOUNTAIN INFRASTRUCTURE',
        environment: 'MOUNTAIN_PASS',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Cooperate with Kabir to locate hidden communications stations across the sector.',
            'Execute dual-objective long-range overwatch and coordinated sniper tactical movement.',
            'Discover the origin of Kabir\'s disappearance.',
        ],

        primaryObjectives: [
            { id: 'meet_kabir',         title: 'Coordinated Meeting',         desc: 'Rendezvous with Kabir at ridge vantage point.' },
            { id: 'dual_overwatch',     title: 'Dual-Objective Overwatch',    desc: 'Cover Kabir as he disables primary node.' },
            { id: 'defend_node',        title: 'Defensive Combat',            desc: 'Repel enemy strike squad pushing the facility.' },
            { id: 'extract_m07',        title: 'Tactical Relocation',         desc: 'Move to secondary objective area with Kabir.' },
        ],
        optionalObjectives: [
            { id: 'synced_shots', title: 'Synchronized Precision', desc: 'Eliminate twin sniper spots simultaneously with Kabir.' },
        ],

        storyBeats: {
            opening: [
                { char: 'KABIR',  line: "I was ordered to eliminate an informant who knew too much. That informant was Tara.", delay: 0 },
                { char: 'KABIR',  line: "I refused. And helped her disappear.", delay: 3500 },
            ],
            characterBonding: [
                { char: 'KABIR',  line: "You and I are not on opposite sides, Arjun. We were simply given different versions of the truth.", delay: 0 },
                { char: 'ARJUN',  line: "Let's find the true version.", delay: 4000 },
            ],
        },

        targetProfile: {
            name: 'HIDDEN SIGNAL NODES',
            alias: 'Sector Broadcasters',
            description: 'Network of deep-mountain communication relays feeding synthetic alerts.',
            threat: 'HIGH',
            status: 'ACTIVE',
            notes: 'Coordinated destruction required.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 08 — THE LAST SIGNAL
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M08',
        index: 7,
        codename: 'THE LAST SIGNAL',
        title: 'OPERATION: THE LAST SIGNAL',
        chapter: 'CHAPTER 8 — COUNTDOWN',
        location: 'HIGH-ALTITUDE COMMUNICATIONS COMPLEX',
        environment: 'HIMALAYAN_SNOW',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'The shadow network activates its final communication sequence.',
            'If successful, false intelligence will trigger a major military confrontation.',
            'Large-scale sniper overwatch, long-distance shooting, compound infiltration.',
            'Major Decision: Destroy equipment immediately OR Investigate signal source first.',
        ],

        primaryObjectives: [
            { id: 'infiltrate_complex', title: 'Complex Infiltration',         desc: 'Navigate heavy enemy patrols around complex.' },
            { id: 'time_sensitive_op',  title: 'Stop Signal Countdown',        desc: 'Reach central array before timer reaches zero.' },
            { id: 'major_choice_m08',   title: 'Major Decision',               desc: 'Destroy equipment immediately OR Investigate false intel source.' },
            { id: 'extract_m08',        title: 'Emergency Extraction',         desc: 'Escape as array overload initiates.' },
        ],
        optionalObjectives: [
            { id: 'long_range_mastery', title: 'Extreme Distance Shot', desc: 'Neutralize tower spotter from >600m.' },
        ],

        storyBeats: {
            opening: [
                { char: 'MEERA',  line: "The transmission sequence has started! You have four minutes before false orders broadcast across the border!", delay: 0 },
            ],
            choiceDestroy: [
                { char: 'ARJUN',  line: "Destroying the transmitter now!", delay: 0 },
                { char: 'MEERA',  line: "Signal stopped, but we lost the source data!", delay: 2500 },
            ],
            choiceInvestigate: [
                { char: 'ARJUN',  line: "Accessing signal core first! Downloading full origin logs!", delay: 0 },
                { char: 'KABIR',  line: "Hurry Arjun! System is counting down!", delay: 2500 },
                { char: 'ARJUN',  line: "Got it! The source... it's coming from inside our own Himalayan Command Facility!", delay: 5000 },
            ],
        },

        targetProfile: {
            name: 'HIGH-ALTITUDE TRANSMITTER',
            alias: 'Broadcast Spire',
            description: 'Massive relay intended to fire false war escalation orders.',
            threat: 'CRITICAL',
            status: 'COUNTDOWN ACTIVE',
            notes: 'Timer: 04:00.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 09 — TRISHUL
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M09',
        index: 8,
        codename: 'TRISHUL',
        title: 'OPERATION: TRISHUL',
        chapter: 'CHAPTER 9 — THE ARCHITECT REVEALED',
        location: 'MOUNTAIN COMMAND FACILITY',
        environment: 'FACILITY',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Infiltrate mountain command facility to reveal the true architect.',
            'The enemy commander was only a proxy — the architect is within the intelligence chain.',
            'High enemy awareness, precision overwatch, target identification.',
            'Major Decision: Expose the network publicly OR Destroy the network silently.',
        ],

        primaryObjectives: [
            { id: 'infiltrate_hq',       title: 'Infiltrate HQ Facility',      desc: 'Bypass internal security controls.' },
            { id: 'identify_architect',  title: 'Target Identification',       desc: 'Identify true mastermind inside command structure.' },
            { id: 'major_choice_m09',   title: 'Major Decision',               desc: 'Expose network publicly OR Destroy network silently.' },
            { id: 'extract_m09',        title: 'Exfiltration',                 desc: 'Extract with full documentation.' },
        ],
        optionalObjectives: [
            { id: 'zero_alerts_m09', title: 'Shadow Master', desc: 'Reach master office without raising base alarm.' },
        ],

        storyBeats: {
            opening: [
                { char: 'ARJUN',  line: "The objective was never territorial conquest. It was escalation.", delay: 0 },
                { char: 'MEERA',  line: "Create fear, create retaliation, create war... and profit from chaos.", delay: 3500 },
            ],
            choicePublic: [
                { char: 'ARJUN',  line: "Broadcasting files to public and military command channels simultaneously.", delay: 0 },
                { char: 'MEERA',  line: "It's out in the open. They can't cover this up now.", delay: 3000 },
            ],
            choiceSilent: [
                { char: 'ARJUN',  line: "Erasing all servers and dismantling network quietly.", delay: 0 },
                { char: 'MEERA',  line: "Silent removal. Clean and effective.", delay: 3000 },
            ],
        },

        targetProfile: {
            name: 'THE ARCHITECT',
            alias: 'Internal Mastermind',
            description: 'High-ranking intelligence director operating proxy network.',
            threat: 'CRITICAL',
            status: 'UNCOVERED',
            notes: 'Mastermind of false flag escalation.',
        },
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // MISSION 10 — SHADOWS OF INDIA
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'M10',
        index: 9,
        codename: 'SHADOWS OF INDIA',
        title: 'OPERATION: SHADOWS OF INDIA',
        chapter: 'CHAPTER 10 — THE FINAL SHOT',
        location: 'HIMALAYAN COMMAND SECTOR',
        environment: 'HIMALAYAN_SNOW',
        unlocked: false,
        completed: false,
        playerChoice: null,

        briefing: [
            'Final operation before dawn in Himalayan command sector.',
            'Arjun, Tara, Kabir, and Meera unite to stop final transmission.',
            'Operation goes wrong: Kabir delays enemy, Tara handles comms.',
            'Arjun climbs ridge in snowstorm for final precision shot.',
            'NO RED MARKER. NO AUTO TARGET. Deduce correct target from campaign intel.',
        ],

        primaryObjectives: [
            { id: 'climb_ridge',        title: 'Climb Final Overwatch Ridge', desc: 'Ascend ridge amidst heavy falling snow.' },
            { id: 'survey_valley',      title: 'Valley Overview',              desc: 'Observe multiple communication structures in valley.' },
            { id: 'deduce_target',      title: 'Intel Target Deduction',       desc: 'Use campaign knowledge to identify actual broadcast tower (No UI Marker).' },
            { id: 'fire_final_shot',    title: 'The Final Shot',               desc: 'Take the decisive long-range precision shot.' },
            { id: 'witness_ending',     title: 'Final Resolution',             desc: 'Observe the aftermath and campaign conclusion.' },
        ],
        optionalObjectives: [
            { id: 'perfect_shot', title: 'First-Try Precision', desc: 'Hit the correct relay target on your first bullet.' },
        ],

        storyBeats: {
            opening: [
                { char: 'KABIR',  line: "I'll hold the valley path! Tara, get to the terminal! Arjun — get to the ridge!", delay: 0 },
                { char: 'TARA',   line: "Taking control of comms override!", delay: 3000 },
                { char: 'ARJUN',  line: "Reaching overwatch position now.", delay: 5500 },
            ],
            ridgePosition: [
                { char: 'ARJUN',  line: "Snow is heavy. Multiple towers in the valley.", delay: 0 },
                { char: 'MEERA',  line: "No automated markers available, Arjun. Use the intelligence gathered across all missions.", delay: 3000 },
                { char: 'ARJUN',  line: "I see it. Tower Three... matches the buried frequency signature.", delay: 7000 },
            ],
            finalShotTaken: [
                { char: 'SYSTEM', line: "[ FINAL PRECISION SHOT FIRED — TRANSMISSION CEASED ]", delay: 0 },
                { char: 'MEERA',  line: "Arjun... it's over.", delay: 3000 },
                { char: 'ARJUN',  line: "No. It's only quiet.", delay: 5500 },
                { char: 'TARA',   line: "Sometimes that's enough.", delay: 8000 },
            ],
        },

        targetProfile: {
            name: 'PRIMARY BROADCAST TOWER',
            alias: 'Structure 03',
            description: 'Valley broadcasting tower matching campaign signal telemetry.',
            threat: 'CRITICAL',
            status: 'TERMINATED',
            notes: 'Requires manual intelligence identification by player.',
        },

        endings: {
            SUMMARY: {
                title: 'ELITE SNIPER: SHADOWS OF INDIA — EPILOGUE',
                subtitle: 'Truth vs Manipulation',
                text: `Several weeks later.

The investigation becomes public.
The intelligence network is dismantled.
The soldiers whose disappearances began the investigation are remembered.

Kabir's status remains unknown.
Tara disappears again.

Arjun returns to active duty.
A new mission file appears on his desk:

CLASSIFICATION: RESTRICTED
OPERATION: UNKNOWN

Arjun looks at it.
Fade to black.`,
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

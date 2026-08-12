export class AIManager {
    constructor(engine) {
        this.engine = engine;
        this.guards = [];

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.engine.eventBus.on('WEAPON_FIRED', (data) => {
            let pos = data.position;
            let noise = data.weapon ? data.weapon.noise : 100;
            this.notifyGuardsSound(pos, noise);
        });

        this.engine.eventBus.on('SURFACE_HIT', (data) => {
            if (data.point) {
                this.notifyGuardsSound(data.point, 20);
            }
        });

        this.engine.eventBus.on('BULLET_IMPACT', (data) => {
            if (data.point) {
                this.notifyGuardsSound(data.point, 20);
            }
        });
    }

    notifyGuardsSound(pos, noiseRadius) {
        for (let guard of this.guards) {
            if (guard && guard.state !== 'DEAD') {
                guard.hearNoise(pos, noiseRadius);
            }
        }
    }

    init(scene) {
        this.guards = [];
        let GuardClass = window.Guard;
        if (!GuardClass) return;

        // Compound Patrol Routes (Z = -220 to -280)
        let routeKabir = [
            new THREE.Vector3(0, 0, -250),
            new THREE.Vector3(12, 0, -250),
            new THREE.Vector3(12, 0, -260),
            new THREE.Vector3(0, 0, -260)
        ];

        let routeGuard1 = [
            new THREE.Vector3(-20, 0, -220),
            new THREE.Vector3(20, 0, -220),
            new THREE.Vector3(20, 0, -270),
            new THREE.Vector3(-20, 0, -270)
        ];

        let routeGuard2 = [
            new THREE.Vector3(25, 0, -230),
            new THREE.Vector3(38, 0, -230),
            new THREE.Vector3(38, 0, -275),
            new THREE.Vector3(25, 0, -275)
        ];

        let routeGuard3 = [
            new THREE.Vector3(-25, 0, -230),
            new THREE.Vector3(-38, 0, -230),
            new THREE.Vector3(-38, 0, -275)
        ];

        let routeTara = [
            new THREE.Vector3(-45, 0, -225),
            new THREE.Vector3(-10, 0, -245),
            new THREE.Vector3(0, 0, -255)
        ];

        // Spawn Characters
        let kabir = new GuardClass(scene, routeKabir[0], routeKabir, true, false); // Target Kabir
        let g1 = new GuardClass(scene, routeGuard1[0], routeGuard1, false, false);
        let g2 = new GuardClass(scene, routeGuard2[0], routeGuard2, false, false);
        let g3 = new GuardClass(scene, routeGuard3[0], routeGuard3, false, false);
        let tara = new GuardClass(scene, routeTara[0], routeTara, false, true); // Missing Informant Tara

        this.guards.push(kabir, g1, g2, g3, tara);
        window.guards = this.guards;
    }

    update(dt) {
        if (!this.engine.stateManager.is('PLAYING') && !this.engine.stateManager.is('SCOPE')) return;

        let player = this.engine.worldManager.playerManager?.player;
        if (!player) return;

        for (let guard of this.guards) {
            guard.update(dt, player, this.guards);
        }
    }
}


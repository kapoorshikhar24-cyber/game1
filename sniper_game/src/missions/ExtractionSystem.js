export class ExtractionSystem {
    constructor(engine) {
        this.engine = engine;
        this.extractionZone = null;
        this.beaconMesh = null;
        this.isExtractionActive = false;
    }

    init(scene, extractionPos = new THREE.Vector3(0, 0, 10)) {
        this.extractionZone = extractionPos.clone();

        // Visual Beacon Ring
        const ringGeo = new THREE.RingGeometry(2.5, 3.0, 32);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        this.beaconMesh = new THREE.Mesh(ringGeo, ringMat);
        this.beaconMesh.position.copy(extractionPos);
        this.beaconMesh.position.y = 0.1;

        // Dynamic Pillar Light
        const light = new THREE.PointLight(0x22c55e, 2, 10);
        light.position.set(0, 2, 0);
        this.beaconMesh.add(light);

        scene.add(this.beaconMesh);
        this.beaconMesh.visible = false;
    }

    activateExtraction() {
        this.isExtractionActive = true;
        if (this.beaconMesh) {
            this.beaconMesh.visible = true;
        }
    }

    update(dt, playerPos) {
        if (!this.isExtractionActive || !playerPos || !this.extractionZone) return false;

        // Pulse extraction beacon opacity
        if (this.beaconMesh) {
            let t = performance.now() * 0.003;
            this.beaconMesh.material.opacity = 0.4 + Math.sin(t) * 0.3;
        }

        // Proximity check to extraction zone (5m radius)
        let dist = playerPos.distanceTo(this.extractionZone);
        if (dist < 5.0) {
            return true; // Reached extraction!
        }
        return false;
    }
}

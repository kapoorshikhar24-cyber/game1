export class Level {
    constructor(scene) {
        this.scene = scene;
        this.targets = [];
        this.buildLevel();
    }

    /**
     * Continuous Himalayan Terrain Height Function getTerrainHeight(x, z).
     * Provides deterministic elevation queries for both mesh generation and real-time physics.
     */
    getTerrainHeight(x, z) {
        let h = 0;

        // 1. Core Mountain Path & Ridge Corridor (z: +120 down to -45)
        if (z > -45) {
            let pathOffsetX = (z > 25 ? (80 - z) * 0.15 : (z - 25) * -0.2);
            let distToPath = Math.abs(x - pathOffsetX);

            // Base elevation along path: Starts at ~14.0 (z=80), descends to ~9.6 (z=25), then ascends to 24.0 (z=-40)
            let pathBaseH = 14.0 - (80 - z) * 0.08;
            if (z < 25) {
                let frac = (25 - z) / 65.0; // 0.0 to 1.0
                pathBaseH = 9.6 + frac * 14.4; // Reaches 24.0 at z=-40
            }

            if (distToPath < 18) {
                h = pathBaseH + Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.35;
            } else {
                let slopeDist = distToPath - 18;
                h = pathBaseH + Math.pow(slopeDist * 0.38, 1.35) + Math.sin(x * 0.08) * 2.5;
            }
        }
        // 2. Overwatch Ridge Cliff Drop-Off & Valley Floor (z: -45 to -400)
        else {
            // Smooth cliff drop-off between z = -45 and z = -78
            let cliffFrac = Math.min(1.0, Math.max(0.0, (-45 - z) / 33.0));
            let ridgeH = 24.0;
            let valleyH = -4.0 + Math.sin(x * 0.02) * Math.cos(z * 0.02) * 1.8;

            // Future Enemy Compound terraced plateau at z = -240
            let distToCompound = Math.hypot(x, z - (-240));
            if (distToCompound < 65) {
                valleyH = Math.max(-4.0, 0.0 - Math.pow(distToCompound / 65.0, 2) * 4.0);
            }

            let centerH = ridgeH * (1.0 - cliffFrac) + valleyH * cliffFrac;

            // Towering Himalayan canyon walls on left (x < -60) and right (x > 60)
            let valleyDist = Math.max(0, Math.abs(x) - 75);
            let wallH = Math.pow(valleyDist * 0.38, 1.4) + Math.sin(z * 0.03) * 6.0;

            h = centerH + wallH;
        }

        // Natural micro-fractal noise
        h += Math.sin(x * 0.04 + z * 0.03) * 1.4 + Math.cos(x * 0.09 - z * 0.07) * 0.7;
        return h;
    }

    buildLevel() {
        console.log('[Level] Building Phase 01 Realistic Himalayan 3D Environment...');

        // 1. Build Atmosphere & Pre-Dawn Himalayan Lighting (04:30–05:00 AM)
        this.buildHimalayanAtmosphere();

        // 2. Generate Realistic Terrain Geometry & PBR Shader Textures
        this.buildHimalayanTerrain();

        // 3. Generate Distant Mountain Ridge Peaks (Perimeter Skybox Ring)
        this.buildDistantHimalayanPeaks();

        // 4. Strategic Rock Placement (Overwatch Cover Boulders & Path Rocks)
        this.buildRockFormations();

        // 5. Zoned Coniferous Vegetation (Pine Forest, Alpine Shrubs, Grass)
        this.buildHimalayanVegetation();

        // 6. Abandoned Patrol Vehicle Site (Operational Reconnaissance Landmark)
        this.buildAbandonedVehicleSite();

        // 7. Future Enemy Compound Reserved Tactical Footprint (z = -240)
        this.buildFutureCompoundFootprint();

        // 8. Future Extraction Area Reserved Footprint (z = -360)
        this.buildFutureExtractionArea();
    }

    buildHimalayanAtmosphere() {
        // Cold early-morning pre-dawn sky gradient background
        this.scene.background = new THREE.Color(0x384a5c);

        // Pre-dawn Himalayan exponential atmospheric fog
        this.scene.fog = new THREE.FogExp2(0x52677b, 0.0016);

        // Cool ambient sky & warm ground bounce light
        const hemiLight = new THREE.HemisphereLight(0x82a7c7, 0x2b382d, 0.7);
        this.scene.add(hemiLight);

        // Soft ambient blue tint
        const ambientLight = new THREE.AmbientLight(0x667a91, 0.3);
        this.scene.add(ambientLight);

        // Low-angle early morning warm sunlight (04:45 AM Sun)
        const dirLight = new THREE.DirectionalLight(0xffcaa2, 1.85);
        dirLight.position.set(220, 70, -260);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 1000;
        dirLight.shadow.camera.left = -250;
        dirLight.shadow.camera.right = 250;
        dirLight.shadow.camera.top = 250;
        dirLight.shadow.camera.bottom = -250;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.bias = -0.00025;
        dirLight.shadow.radius = 1.5;
        this.scene.add(dirLight);
    }

    buildHimalayanTerrain() {
        const width = 2500;
        const height = 2500;
        const segments = 180;
        const groundGeo = new THREE.PlaneGeometry(width, height, segments, segments);
        groundGeo.rotateX(-Math.PI / 2);

        const pos = groundGeo.attributes.position;
        const colors = new Float32Array(pos.count * 3);

        const colorSnow = new THREE.Color(0xdde5ed);
        const colorRock = new THREE.Color(0x3d484e);
        const colorDirt = new THREE.Color(0x4a3b30);
        const colorGrass = new THREE.Color(0x2d3b2f);

        for (let i = 0; i < pos.count; i++) {
            let vx = pos.getX(i);
            let vz = pos.getZ(i);

            let vy = this.getTerrainHeight(vx, vz);
            pos.setY(i, vy);

            // Procedural Vertex Painting based on elevation, slope, and path proximity
            let pathDist = Math.abs(vx);
            let vertexColor = colorDirt.clone();

            if (vy > 35) {
                // High altitude snow caps
                vertexColor.lerp(colorSnow, Math.min(1.0, (vy - 35) / 25.0));
            } else if (vy > 18) {
                // Cold mountain rock slopes
                vertexColor.lerp(colorRock, 0.75);
            } else if (pathDist < 14 && vz > -45) {
                // Weathered mountain gravel path
                vertexColor.lerp(colorDirt, 0.85);
            } else if (vz < -50 && pathDist < 100) {
                // Valley alpine grass & dark dirt
                vertexColor.lerp(colorGrass, 0.6);
            } else {
                vertexColor.lerp(colorRock, 0.5);
            }

            colors[i * 3] = vertexColor.r;
            colors[i * 3 + 1] = vertexColor.g;
            colors[i * 3 + 2] = vertexColor.b;
        }

        groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        groundGeo.computeVertexNormals();

        // High detail PBR terrain material
        const groundMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.92,
            metalness: 0.04,
            flatShading: false
        });

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.receiveShadow = true;
        ground.userData.matType = 'ground';
        this.scene.add(ground);
    }

    buildDistantHimalayanPeaks() {
        const count = 36;
        const peakMat = new THREE.MeshStandardMaterial({
            color: 0x4a5863,
            roughness: 0.95,
            metalness: 0.05
        });
        const snowCapMat = new THREE.MeshStandardMaterial({
            color: 0xe6edf5,
            roughness: 0.65,
            metalness: 0.05
        });

        for (let i = 0; i < count; i++) {
            let angle = (i / count) * Math.PI * 2;
            let radius = 650 + (i % 3) * 150;
            let x = Math.cos(angle) * radius;
            let z = Math.sin(angle) * radius;
            let peakH = 180 + Math.random() * 260;

            const coneGeo = new THREE.ConeGeometry(90 + Math.random() * 60, peakH, 7);
            const peak = new THREE.Mesh(coneGeo, peakMat);
            peak.position.set(x, peakH / 2 - 10, z);
            this.scene.add(peak);

            // Snow-capped peak tops
            const capGeo = new THREE.ConeGeometry(45 + Math.random() * 25, peakH * 0.38, 7);
            const cap = new THREE.Mesh(capGeo, snowCapMat);
            cap.position.set(x, peakH * 0.81 - 10, z);
            this.scene.add(cap);
        }
    }

    buildRockFormations() {
        // High Detail Poly Haven Namaqualand Cliff GLTF Formations
        const cliffPath = '/assets/environment/rocks/namaqualand_cliff_01_1k.gltf/namaqualand_cliff_01_1k.gltf';
        if (window.gameEngine && window.gameEngine.assetManager && window.gameEngine.assetManager.models['namaqualand_cliff_01']) {
            this.spawnNamaqualandCliffs(window.gameEngine.assetManager.models['namaqualand_cliff_01']);
        } else if (typeof THREE.GLTFLoader !== 'undefined') {
            const loader = new THREE.GLTFLoader();
            loader.load(cliffPath, (gltf) => {
                this.spawnNamaqualandCliffs(gltf.scene);
            }, undefined, (err) => {
                console.warn('[Level] Namaqualand Cliff GLTF loading deferred:', err);
            });
        }
    }

    /**
     * Spawns cloned instances of the Poly Haven Namaqualand Cliff 3D model across tactical positions,
     * replacing all procedural rock generation.
     */
    spawnNamaqualandCliffs(baseModel) {
        if (!baseModel) return;

        // 1. Large Tactical Cliffs
        const cliffPlacements = [
            { x: -35, z: -48, scale: 4.5, rotY: 0.4, rotX: 0.1 },
            { x: 42, z: -55, scale: 5.0, rotY: -0.8, rotX: -0.05 },
            { x: -70, z: -120, scale: 7.5, rotY: 1.2, rotX: 0.0 },
            { x: 65, z: -180, scale: 7.0, rotY: -1.5, rotX: 0.1 },
            { x: -22, z: 20, scale: 3.5, rotY: 2.1, rotX: -0.1 },
            { x: 28, z: -230, scale: 8.0, rotY: 0.7, rotX: 0.0 }
        ];

        // 2. Overwatch Ridge Sniper Cover Boulders (z = -38 to -45)
        const coverBoulders = [
            { x: -8, z: -38, scale: 0.8 },
            { x: 6, z: -42, scale: 1.0 },
            { x: -2, z: -45, scale: 0.7 },
            { x: 12, z: -35, scale: 0.8 },
            { x: -14, z: -36, scale: 0.9 }
        ];

        const spawnRock = (x, z, scale, rotY) => {
            const rockInst = baseModel.clone(true);
            const groundY = this.getTerrainHeight(x, z);
            rockInst.position.set(x, groundY - scale * 0.3, z);
            rockInst.scale.set(scale, scale, scale);
            rockInst.rotation.set(Math.random() * 0.2, rotY, Math.random() * 0.2);

            rockInst.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.matType = 'stone';
                    this.targets.push(child);
                }
            });

            this.scene.add(rockInst);
        };

        // Spawn Cliffs
        cliffPlacements.forEach(p => spawnRock(p.x, p.z, p.scale, p.rotY));
        
        // Spawn Cover Boulders
        coverBoulders.forEach(b => spawnRock(b.x, b.z, b.scale, Math.random() * Math.PI));

        // 3. Mountain Path Flanking Rocks
        for (let i = 0; i < 28; i++) {
            let pz = 80 - i * 4.2;
            let side = i % 2 === 0 ? 1 : -1;
            let px = side * (12 + Math.random() * 8);
            let scale = 0.3 + Math.random() * 0.5;
            spawnRock(px, pz, scale, Math.random() * Math.PI);
        }

        // 4. Scattered Mountain Boulders
        for (let i = 0; i < 40; i++) {
            let rx = (Math.random() - 0.5) * 360;
            let rz = (Math.random() - 0.5) * 450 - 50;

            // Keep main path reasonably clear
            if (Math.abs(rx) < 8 && rz > -45) continue;

            let scale = 0.1 + Math.random() * 0.3;
            spawnRock(rx, rz, scale, Math.random() * Math.PI);
        }

        console.log('[Level] Successfully replaced all rocks with Poly Haven Namaqualand Cliff 3D formations.');
    }

    buildHimalayanVegetation() {
        // Coniferous Pine Forest along mountain flanks (z = 90 down to -350)
        for (let i = 0; i < 90; i++) {
            let px = (Math.random() - 0.5) * 280;
            let pz = (Math.random() - 0.5) * 420 - 30;

            // Clear line of sight for path and sniper overwatch corridor
            if (Math.abs(px) < 16 && pz > -50) continue; // Path corridor
            if (Math.abs(px) < 55 && pz < -180 && pz > -300) continue; // Compound line of sight

            let py = this.getTerrainHeight(px, pz);
            let scale = 0.85 + Math.random() * 0.55;

            this.buildRealisticConiferTree(px, py, pz, scale);
        }
    }

    _getPineNeedleTexture() {
        if (this._pineNeedleTex) return this._pineNeedleTex;

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);

        ctx.strokeStyle = '#1a331c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(128, 250);
        ctx.quadraticCurveTo(128, 140, 128, 10);
        ctx.stroke();

        for (let y = 30; y < 240; y += 6) {
            let count = 10 + Math.floor(Math.random() * 8);
            for (let i = 0; i < count; i++) {
                let side = (i % 2 === 0 ? 1 : -1);
                let angle = side * (0.2 + Math.random() * 1.1);
                let len = 25 + Math.random() * 40;
                let endX = 128 + Math.sin(angle) * len;
                let endY = y - Math.cos(angle) * len * 0.35;

                ctx.strokeStyle = Math.random() < 0.5 ? '#17311c' : (Math.random() < 0.8 ? '#214728' : '#0e2112');
                ctx.lineWidth = 1.4 + Math.random() * 1.2;
                ctx.beginPath();
                ctx.moveTo(128, y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }

        // Soft snow dusting on upper needles
        for (let s = 0; s < 35; s++) {
            let sx = 50 + Math.random() * 156;
            let sy = 15 + Math.random() * 120;
            ctx.fillStyle = 'rgba(230, 238, 246, 0.75)';
            ctx.beginPath();
            ctx.arc(sx, sy, 1.2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        this._pineNeedleTex = new THREE.CanvasTexture(canvas);
        return this._pineNeedleTex;
    }

    buildRealisticConiferTree(x, py, z, scale = 1.0) {
        const treeGroup = new THREE.Group();

        const trunkHeight = (11 + Math.random() * 5) * scale;
        const trunkGeo = new THREE.CylinderGeometry(0.12 * scale, 0.48 * scale, trunkHeight, 8);
        const barkMat = new THREE.MeshStandardMaterial({ color: 0x241710, roughness: 0.95 });
        const trunk = new THREE.Mesh(trunkGeo, barkMat);
        trunk.position.set(0, trunkHeight / 2, 0);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        const needleTexture = this._getPineNeedleTexture();
        const foliageMat = new THREE.MeshStandardMaterial({
            map: needleTexture,
            transparent: true,
            alphaTest: 0.25,
            side: THREE.DoubleSide,
            roughness: 0.82
        });

        const branchCount = 16 + Math.floor(Math.random() * 6);
        for (let b = 0; b < branchCount; b++) {
            const hFrac = 0.2 + (b / branchCount) * 0.75;
            const branchY = trunkHeight * hFrac;
            const widthScale = Math.pow(1.0 - hFrac * 0.7, 0.7);
            const fanSize = (1.8 + widthScale * 1.8) * scale;
            const angle = b * 2.4;

            const fanGeo = new THREE.PlaneGeometry(fanSize, fanSize * 1.2);
            const fan = new THREE.Mesh(fanGeo, foliageMat);
            fan.position.set(Math.cos(angle) * 0.8, branchY, Math.sin(angle) * 0.8);
            fan.rotation.y = angle;
            fan.castShadow = true;
            fan.receiveShadow = true;
            treeGroup.add(fan);
        }

        treeGroup.position.set(x, py, z);
        this.scene.add(treeGroup);
    }

    buildAbandonedVehicleSite() {
        const vx = 12;
        const vz = 25;
        const vy = this.getTerrainHeight(vx, vz);

        // 1. Concrete Ledge Foundation Pad
        const padGeo = new THREE.BoxGeometry(7, 0.4, 9);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x484e49, roughness: 0.9 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(vx, vy + 0.2, vz);
        pad.receiveShadow = true;
        this.scene.add(pad);

        // 2. Abandoned Patrol 4x4 Vehicle
        const bodyGeo = new THREE.BoxGeometry(3.6, 1.8, 6.2);
        const mat = new THREE.MeshStandardMaterial({ color: 0x334233, roughness: 0.8, metalness: 0.2 });
        const vehicle = new THREE.Mesh(bodyGeo, mat);
        vehicle.position.set(vx, vy + 1.2, vz);
        vehicle.rotation.y = 0.35;
        vehicle.castShadow = true;
        vehicle.receiveShadow = true;
        vehicle.userData.matType = 'metal';
        vehicle.userData.isPatrolVehicle = true;
        this.scene.add(vehicle);
        this.targets.push(vehicle);

        // Damaged Hood Ledge
        const hoodGeo = new THREE.BoxGeometry(2.8, 0.4, 2.2);
        const hoodMat = new THREE.MeshStandardMaterial({ color: 0x1f2b1f, roughness: 0.9 });
        const hood = new THREE.Mesh(hoodGeo, hoodMat);
        hood.position.set(vx + 0.3, vy + 2.0, vz - 1.2);
        hood.rotation.z = 0.2;
        hood.castShadow = true;
        this.scene.add(hood);

        // 3. Sandbag Defenses & Supply Crates
        const crateGeo = new THREE.BoxGeometry(1.4, 0.9, 0.9);
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x2b382b, roughness: 0.85 });
        const crate = new THREE.Mesh(crateGeo, crateMat);
        crate.position.set(vx - 2.8, vy + 0.65, vz + 1.5);
        crate.castShadow = true;
        crate.receiveShadow = true;
        this.scene.add(crate);
    }

    buildFutureCompoundFootprint() {
        const cx = 0;
        const cz = -240;
        const cy = 0.0;

        // Reserved Terraced Plateau Foundation Pad
        const plateauGeo = new THREE.BoxGeometry(120, 0.6, 100);
        const plateauMat = new THREE.MeshStandardMaterial({ color: 0x3a423d, roughness: 0.95 });
        const plateau = new THREE.Mesh(plateauGeo, plateauMat);
        plateau.position.set(cx, cy - 0.3, cz);
        plateau.receiveShadow = true;
        this.scene.add(plateau);

        // Perimeter Sandbag Foundations & Warning Boundary Posts
        const postMat = new THREE.MeshStandardMaterial({ color: 0x6e7882, roughness: 0.5, metalness: 0.8 });
        for (let p = -50; p <= 50; p += 25) {
            // Front & Rear Boundary Marker Posts
            [cz + 45, cz - 45].forEach((postZ) => {
                const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.5, 6);
                const post = new THREE.Mesh(postGeo, postMat);
                post.position.set(p, cy + 1.75, postZ);
                post.castShadow = true;
                this.scene.add(post);
            });
        }
    }

    buildFutureExtractionArea() {
        const ex = 0;
        const ez = -360;
        const ey = this.getTerrainHeight(ex, ez);

        // Reserved Landing Pad Ring Outline
        const ringGeo = new THREE.RingGeometry(8, 9.5, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xd97706, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(ex, ey + 0.1, ez);
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
    }
}
